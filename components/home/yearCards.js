export const HOME_YEAR_CARDS = [
  {
    id: "year-2026",
    title: { ar: "نتائج المسابقات 2026", fr: "Résultats des concours 2026" },
    description: { ar: "سيتم فتحها عند توفر نتائج منشورة.", fr: "Ouverture dès la publication des résultats." },
    available: false,
  },
  {
    id: "year-2025",
    title: { ar: "نتائج المسابقات 2025", fr: "Résultats des concours 2025" },
    description: { ar: "كل نتائج 2025 المتوفرة الآن في مكان واحد.", fr: "Tous les résultats 2025 disponibles au même endroit." },
    available: true,
  },
];

export function normalizeYearTitle(title, yearId) {
  const fallback = `نتائج المسابقات ${String(yearId || "").replace("year-", "")}`.trim();
  return String(title || fallback)
    .replace("نتائج مسابقات", "نتائج المسابقات")
    .replace("نتائج المسابقات الوطنية", "نتائج المسابقات");
}

export function normalizeHomeYearId(year) {
  const rawId = String(year?.id || year || "year-2025").trim();
  if (rawId.startsWith("year-")) return rawId;
  const matchedYear = rawId.match(/20\d{2}/)?.[0] || "2025";
  return `year-${matchedYear}`;
}

function createYearCard(yearValue) {
  return {
    id: `year-${yearValue}`,
    title: { ar: `نتائج المسابقات ${yearValue}`, fr: `Résultats des concours ${yearValue}` },
    description: { ar: `نتائج ${yearValue} المنشورة والمتاحة للبحث.`, fr: `Résultats ${yearValue} publiés et disponibles.` },
    available: false,
  };
}

export function mergeYearCards(yearCards = []) {
  const byId = new Map(HOME_YEAR_CARDS.map((card) => [card.id, card]));

  for (const card of Array.isArray(yearCards) ? yearCards : []) {
    const id = normalizeHomeYearId(card);
    byId.set(id, {
      ...(byId.get(id) || createYearCard(id.replace("year-", ""))),
      ...card,
      id,
    });
  }

  return [...byId.values()]
    .map((card) => {
      const id = normalizeHomeYearId(card);
      const yearValue = id.replace("year-", "");
      const propAvailability = Array.isArray(yearCards) && yearCards.length
        ? yearCards.find((item) => normalizeHomeYearId(item) === id)?.available
        : undefined;
      const available = propAvailability === undefined ? card.available === true : propAvailability === true;
      return { ...card, id, available };
    })
    .sort((a, b) => Number(b.id.replace("year-", "")) - Number(a.id.replace("year-", "")));
}
