"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCandidateFilterData, findCandidateFilterTarget } from "./api";
import {
  EMPTY_FILTERS,
  getFilterLevels,
  resolveExamSource,
} from "./config";

function freshFilters() {
  return { ...EMPTY_FILTERS };
}

function freshOptions() {
  return {
    track: [],
    wilaya: [],
    centre: [],
    school: [],
  };
}

export function useCandidateFilters() {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState(null);
  const [values, setValues] = useState(freshFilters);
  const [options, setOptions] = useState(freshOptions);
  const [visibleCount, setVisibleCount] = useState(1);
  const [loading, setLoading] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("");
  const activeRequestRef = useRef(null);

  const levels = useMemo(() => getFilterLevels(source), [source]);

  useEffect(() => {
    const refresh = () => {
      setSource(resolveExamSource());
      setTarget(findCandidateFilterTarget());
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", refresh);
    window.addEventListener("popstate", refresh);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", refresh);
      window.removeEventListener("popstate", refresh);
    };
  }, []);

  useEffect(() => {
    if (!source) return;

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const firstLevel = levels[0];

    setValues(freshFilters());
    setOptions(freshOptions());
    setVisibleCount(1);
    setCandidates([]);
    setMessage("");
    setLoading(firstLevel);

    fetchCandidateFilterData(
      { mode: "options", source, level: firstLevel },
      controller.signal
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setOptions((current) => ({
          ...current,
          [firstLevel]: data.options || [],
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError") setMessage("تعذر تحميل خيارات البحث.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading("");
      });

    return () => controller.abort();
  }, [source, levels]);

  const loadCandidates = useCallback(async (nextValues) => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setLoading("candidates");
    setMessage("");

    try {
      const data = await fetchCandidateFilterData(
        { source, ...nextValues },
        controller.signal
      );
      if (controller.signal.aborted) return;

      const rows = data.candidates || [];
      setCandidates(rows);
      if (!rows.length) setMessage("لا توجد نتائج ناجحة مطابقة لهذه الاختيارات.");
    } catch (error) {
      if (error.name === "AbortError") return;
      setCandidates([]);
      setMessage("تعذر تحميل قائمة الناجحين الآن.");
    } finally {
      if (!controller.signal.aborted) setLoading("");
    }
  }, [source]);

  const selectLevel = useCallback(async (level, value) => {
    activeRequestRef.current?.abort();
    const index = levels.indexOf(level);
    const nextValues = { ...values, [level]: value };

    for (const later of levels.slice(index + 1)) nextValues[later] = "";

    setValues(nextValues);
    setCandidates([]);
    setMessage("");
    setOptions((current) => {
      const next = { ...current };
      for (const later of levels.slice(index + 1)) next[later] = [];
      return next;
    });

    if (!value) {
      setVisibleCount(index + 1);
      setLoading("");
      return;
    }

    const nextLevel = levels[index + 1];
    if (!nextLevel) {
      setVisibleCount(levels.length);
      await loadCandidates(nextValues);
      return;
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(nextLevel);

    try {
      const data = await fetchCandidateFilterData({
        mode: "options",
        source,
        level: nextLevel,
        ...nextValues,
      }, controller.signal);

      if (controller.signal.aborted) return;
      const rows = data.options || [];

      if (!rows.length) {
        setVisibleCount(index + 1);
        await loadCandidates(nextValues);
        return;
      }

      setOptions((current) => ({ ...current, [nextLevel]: rows }));
      setVisibleCount(index + 2);
    } catch (error) {
      if (error.name === "AbortError") return;
      setMessage("تعذر تحميل الخيارات التالية.");
      setVisibleCount(index + 1);
    } finally {
      if (!controller.signal.aborted) setLoading("");
    }
  }, [levels, loadCandidates, source, values]);

  return {
    source,
    target,
    levels,
    values,
    options,
    visibleCount,
    loading,
    candidates,
    message,
    selectLevel,
  };
}
