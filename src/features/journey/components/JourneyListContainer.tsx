"use client";

import { useState } from "react";
import { JourneyRecord, JourneyCategory } from "../types";
import { JourneyFilters } from "./JourneyFilters";
import { JourneyTimeline } from "./JourneyTimeline";

interface JourneyListContainerProps {
  readonly records: readonly JourneyRecord[];
}

export function JourneyListContainer({ records }: JourneyListContainerProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Determine categories that actually exist in Fathan's demo data
  const existingCategories = Array.from(
    new Set(records.map((r) => r.category))
  ) as JourneyCategory[];

  const filteredRecords = activeFilter === "all"
    ? records
    : records.filter((r) => r.category === activeFilter);

  return (
    <div className="space-y-6">
      <JourneyFilters 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
        categories={existingCategories}
      />
      <JourneyTimeline records={filteredRecords} />
    </div>
  );
}
