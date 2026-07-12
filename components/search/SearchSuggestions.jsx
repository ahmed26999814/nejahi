"use client";

import { parseAverageValue } from "./searchUtils";

export default function SearchSuggestions({ suggestions, onPick }) {
  if (!suggestions.length) return null;

  return (
    <div className="suggestions-panel">
      {suggestions.map((student) => (
        <button
          className="suggestion-item"
          key={student.id}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(student)}
          type="button"
        >
          <span className="min-w-0 text-start">
            <strong className="line-clamp-1 block">{student.name}</strong>
            <small className="line-clamp-1 text-slate-500 dark:text-slate-400">
              {student.id}{student.track ? ` - ${student.track}` : ""}
            </small>
          </span>
          <span className="rounded-full bg-mauri-green/10 px-2 py-1 text-xs font-black text-mauri-green">
            {parseAverageValue(student.MOD).toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
}
