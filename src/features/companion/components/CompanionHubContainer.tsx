"use client";

import { useState } from "react";
import { CompanionInsight } from "../types";
import { CompanionInsightFilters, CompanionCard } from "./CompanionComponents";

interface CompanionHubContainerProps {
  readonly insights: readonly CompanionInsight[];
}

export function CompanionHubContainer({ insights }: CompanionHubContainerProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const primaryInsight = insights.find((ins) => ins.type === "morning-brief");
  const recentInsights = insights.filter((ins) => ins.id !== primaryInsight?.id);

  // Filter dynamic list based on type
  const filteredInsights = recentInsights.filter((ins) => {
    if (activeFilter === "all") {
      // Exclude low priority or safety from regular timeline list if required
      return ins.priority !== "safety";
    }
    if (activeFilter === "reflection") {
      return ins.type.includes("reflection");
    }
    if (activeFilter === "morning-brief") {
      return ins.type === "morning-brief";
    }
    return ins.type === activeFilter;
  });

  return (
    <div className="min-w-0 space-y-6">
      {/* Featured Hero Insight */}
      {primaryInsight && activeFilter === "all" && (
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Featured Brief</h3>
          <CompanionCard 
            insight={primaryInsight} 
            variant="hero" 
            showExplanation={true} 
            showPriority={false}
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="space-y-3 pt-2">
        <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Explore Insight Streams</h3>
        <CompanionInsightFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Dynamic List */}
      <div className="space-y-4">
        {filteredInsights.length > 0 ? (
          filteredInsights.map((ins) => {
            const isRefl = ins.type.includes("reflection");
            return (
              <CompanionCard 
                key={ins.id} 
                insight={ins} 
                variant={isRefl ? "reflection" : "compact"} 
                showPriority={true}
                showSourceLabels={true}
              />
            );
          })
        ) : (
          <div className="card card-pad text-center py-10 border-dashed border-line">
            <p className="text-sm text-muted-foreground">No recent insights match this active stream filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
