# Vercel release recovery — PR #80

Baseline: 452524f71d18420859ed77c7d4ff67f19402252e. Existing UX/search/security work is preserved.

## Installation failures

All three deployments used the same source commit and failed before the application build:

| Deployment | Install configuration | Failure |
| --- | --- | --- |
| dpl_ATFa74Ei6xK3TS69khp2mFmM5gjr | default npm install with previous cache | ECONNRESET downloading official SheetJS archive |
| dpl_7oRMZfj1uib72gb2Vqu1b2Bt8Gy4 | NODE_OPTIONS=--dns-result-order=ipv4first npm ci --fetch-timeout=30000 --fetch-retries=1, no cache | EIDLETIMEOUT at cdn.sheetjs.com:443 |
| dpl_8MKSzYbXLz82RBz7RZzf8C5tvSFm | curl --connect-timeout 10 --max-time 45, npm cache add, npm ci --prefer-offline | curl exit 28 after 10002ms; npm ci never ran |

The common dependency was a CDN URL in both package.json and package-lock.json. Prewarming npm's cache still required that unreachable host. Pinning the original official archive under vendor removes this dependency; use npm ci without CDN-prefetch overrides.

## APK service issue

APK storage is a separate existing operational issue: the new Supabase project's public app-releases URL returned HTTP 402 in the prior acceptance session. No billing, storage, Supabase configuration or credentials are changed. The existing UI checks availability and disables the link with an Arabic temporary-unavailability message. The download endpoint now checks availability before counting/redirecting; unavailable direct requests return to /apk rather than redirecting to a broken object URL. Page copy avoids promising immediate availability. This is independent of the SheetJS installation failure.

## Rollback reference

Last READY production: dpl_9jRokVSvthjaoTPxEibBnHL7FnsG, https://mauriresults-ezsdlyvlz-mauriresults.vercel.app, source e7a4c556477ed08f0d2a5f24277e39c7971ddaa2. Preserve this deployment for rollback. A release must wait for passing full/production audits, regression/build checks, Preview acceptance, and real read-only result verification.
