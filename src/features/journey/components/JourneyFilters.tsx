"use client";

import { JourneyCategory } from "../types";
import { getJourneyCategoryLabel } from "../helpers";

interface JourneyFiltersProps {
  readonly activeFilter: string;
  readonly onFilterChange: (filter: string) => void;
  readonly categories: readonly JourneyCategory[];
}

export function JourneyFilters({ activeFilter, onFilterChange, categories }: JourneyFiltersProps) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2 border-b border-line/20 py-1 pb-4">
      <button
        onClick={() => onFilterChange("all")}
        aria-pressed={activeFilter === "all"}
        className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
          activeFilter === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        All Journeys
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onFilterChange(cat)}
          aria-pressed={activeFilter === cat}
          className={`rounded-full px-4.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
            activeFilter === cat
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {getJourneyCategoryLabel(cat)}
        </button>
      ))}
    </div>
  );
}
