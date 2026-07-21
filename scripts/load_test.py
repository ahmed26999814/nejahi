import asyncio
import json
import math
import os
import statistics
import time
from dataclasses import asdict, dataclass
from typing import Iterable

import aiohttp

BASE_URL = os.getenv("TARGET_URL", "https://mauri-results.vercel.app").rstrip("/")
TIMEOUT_SECONDS = 15


@dataclass
class StageResult:
    name: str
    url: str
    requests: int
    concurrency: int
    duration_seconds: float
    requests_per_second: float
    success: int
    errors: int
    error_rate_percent: float
    avg_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_ms: float
    status_codes: dict[str, int]
    bytes_received: int
    stopped: bool
    stop_reason: str


def percentile(values: list[float], percentile_value: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * percentile_value
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


async def run_stage(
    session: aiohttp.ClientSession,
    name: str,
    urls: Iterable[str],
    concurrency: int,
    max_error_rate: float = 0.01,
    max_p95_ms: float = 4000,
) -> StageResult:
    url_list = list(urls)
    semaphore = asyncio.Semaphore(concurrency)
    latencies: list[float] = []
    status_codes: dict[str, int] = {}
    bytes_received = 0
    errors = 0
    success = 0

    async def fetch(url: str) -> None:
        nonlocal bytes_received, errors, success
        async with semaphore:
            started = time.perf_counter()
            try:
                async with session.get(url, allow_redirects=True) as response:
                    body = await response.read()
                    elapsed_ms = (time.perf_counter() - started) * 1000
                    latencies.append(elapsed_ms)
                    status_key = str(response.status)
                    status_codes[status_key] = status_codes.get(status_key, 0) + 1
                    bytes_received += len(body)
                    if 200 <= response.status < 400:
                        success += 1
                    else:
                        errors += 1
            except Exception as exc:
                elapsed_ms = (time.perf_counter() - started) * 1000
                latencies.append(elapsed_ms)
                key = type(exc).__name__
                status_codes[key] = status_codes.get(key, 0) + 1
                errors += 1

    started = time.perf_counter()
    await asyncio.gather(*(fetch(url) for url in url_list))
    duration = time.perf_counter() - started
    total = len(url_list)
    error_rate = errors / total if total else 0
    p95 = percentile(latencies, 0.95)
    stopped = error_rate > max_error_rate or p95 > max_p95_ms
    reasons: list[str] = []
    if error_rate > max_error_rate:
        reasons.append(f"error rate {error_rate * 100:.2f}% > {max_error_rate * 100:.2f}%")
    if p95 > max_p95_ms:
        reasons.append(f"p95 {p95:.1f} ms > {max_p95_ms:.1f} ms")

    return StageResult(
        name=name,
        url=url_list[0] if len(set(url_list)) == 1 else "mixed URLs",
        requests=total,
        concurrency=concurrency,
        duration_seconds=round(duration, 3),
        requests_per_second=round(total / duration, 2) if duration else 0,
        success=success,
        errors=errors,
        error_rate_percent=round(error_rate * 100, 3),
        avg_ms=round(statistics.mean(latencies), 2) if latencies else 0,
        p50_ms=round(percentile(latencies, 0.50), 2),
        p95_ms=round(p95, 2),
        p99_ms=round(percentile(latencies, 0.99), 2),
        max_ms=round(max(latencies), 2) if latencies else 0,
        status_codes=status_codes,
        bytes_received=bytes_received,
        stopped=stopped,
        stop_reason="; ".join(reasons),
    )


async def main() -> int:
    connector = aiohttp.TCPConnector(limit=220, ttl_dns_cache=300)
    timeout = aiohttp.ClientTimeout(total=TIMEOUT_SECONDS)
    headers = {
        "User-Agent": "MauriResults-Authorized-Load-Test/1.0",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
    }

    stages = [
        ("home-warmup", [f"{BASE_URL}/"] * 20, 2, 0.01, 4000),
        ("home-50", [f"{BASE_URL}/"] * 500, 50, 0.01, 3000),
        ("home-150", [f"{BASE_URL}/"] * 1200, 150, 0.01, 3500),
        ("orientation-75", [f"{BASE_URL}/orientation"] * 600, 75, 0.01, 3500),
        ("public-exams-50", [f"{BASE_URL}/api/public-exams"] * 500, 50, 0.01, 3000),
        ("search-cached-50", [f"{BASE_URL}/api/search?source=bac&q=1"] * 500, 50, 0.01, 3500),
        (
            "search-mixed-12",
            [f"{BASE_URL}/api/search?source=bac&q={number}" for number in range(1, 121)],
            12,
            0.02,
            4500,
        ),
    ]

    results: list[StageResult] = []
    async with aiohttp.ClientSession(connector=connector, timeout=timeout, headers=headers) as session:
        for stage in stages:
            result = await run_stage(session, *stage)
            results.append(result)
            print(json.dumps(asdict(result), ensure_ascii=False), flush=True)
            if result.stopped:
                print(f"Stopping after {result.name}: {result.stop_reason}", flush=True)
                break
            await asyncio.sleep(2)

    payload = {
        "target": BASE_URL,
        "generated_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "results": [asdict(result) for result in results],
    }
    with open("load-test-results.json", "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)

    lines = [
        "# MauriResults controlled load test",
        "",
        f"Target: `{BASE_URL}`",
        "",
        "| Stage | Requests | Concurrency | RPS | Errors | Avg ms | P95 ms | P99 ms | Max ms | Status |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    for result in results:
        status = "STOP" if result.stopped else "PASS"
        lines.append(
            f"| {result.name} | {result.requests} | {result.concurrency} | {result.requests_per_second} | "
            f"{result.errors} ({result.error_rate_percent}%) | {result.avg_ms} | {result.p95_ms} | "
            f"{result.p99_ms} | {result.max_ms} | {status} |"
        )
    lines.extend([
        "",
        "Safety limits: stop when error rate exceeds the stage threshold or P95 latency exceeds the stage threshold.",
    ])
    with open("load-test-summary.md", "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
