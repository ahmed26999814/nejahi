"use client";

import { useEffect } from "react";

export default function MotivationalVisibility() {
  useEffect(() => {
    let controller = new AbortController();

    const refresh = async () => {
      controller.abort();
      controller = new AbortController();

      try {
        const response = await fetch("/api/site-controls", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        const visible = data?.controls?.ui_show_motivational !== "false";
        document.documentElement.dataset.showMotivational = visible ? "true" : "false";
        window.dispatchEvent(new CustomEvent("mauriresults:motivational-visibility", {
          detail: { visible },
        }));
      } catch (error) {
        if (error?.name !== "AbortError") {
          document.documentElement.dataset.showMotivational = "true";
        }
      }
    };

    refresh();
    window.addEventListener("mauriresults:site-controls-updated", refresh);

    return () => {
      controller.abort();
      window.removeEventListener("mauriresults:site-controls-updated", refresh);
    };
  }, []);

  return null;
}
