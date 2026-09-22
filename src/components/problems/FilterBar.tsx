import React, { useRef, useEffect } from "react";
import { useTracker } from "../../context/useTracker";
import { Search, X } from "lucide-react";
import type { ProblemStatus } from "../../types/tracker";

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, allTopics, allLabDates, allPlatforms } = useTracker();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        if (["input", "textarea", "select"].includes(document.activeElement?.tagName.toLowerCase() || "")) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.revision !== "all" ||
    filters.topic !== "all" ||
    filters.labDate !== "all" ||
    filters.platform !== "all";

  return (
    <div className="table-filter-bar">
      {/* Search Input Bar */}
      <div className="search-and-quick">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search problems by title, topic, platform, or lab date..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            aria-label="Search problems"
          />
          {filters.search ? (
            <button
              type="button"
              className="btn-icon"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : (
            <span className="search-shortcut">/</span>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="filters-row">
        {/* Status Filter */}
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as "all" | ProblemStatus }))}
          title="Filter by status"
          aria-label="Filter by status"
        >
          <option value="all">Status: All</option>
          <option value="not-started">🔴 Not Started</option>
          <option value="in-progress">🟡 In Progress</option>
          <option value="completed">🟢 Completed</option>
        </select>

        {/* Revision Filter */}
        <select
          className="filter-select"
          value={filters.revision}
          onChange={(e) => setFilters((prev) => ({ ...prev, revision: e.target.value as any }))}
          title="Filter by revision flag"
          aria-label="Filter by revision flag"
        >
          <option value="all">Revision: All</option>
          <option value="needs-revision">☑ Needs Revision</option>
          <option value="no-revision">☐ No Revision</option>
        </select>

        {/* Topic Filter */}
        <select
          className="filter-select"
          value={filters.topic}
          onChange={(e) => setFilters((prev) => ({ ...prev, topic: e.target.value }))}
          title="Filter by topic"
          aria-label="Filter by topic"
        >
          <option value="all">Topic: All Topics ({allTopics.length})</option>
          {allTopics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        {/* Lab Date Filter */}
        <select
          className="filter-select"
          value={filters.labDate}
          onChange={(e) => setFilters((prev) => ({ ...prev, labDate: e.target.value }))}
          title="Filter by lab date"
          aria-label="Filter by lab date"
        >
          <option value="all">Lab: All Dates ({allLabDates.length})</option>
          {allLabDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>

        {/* Platform Filter */}
        <select
          className="filter-select"
          value={filters.platform}
          onChange={(e) => setFilters((prev) => ({ ...prev, platform: e.target.value }))}
          title="Filter by platform"
          aria-label="Filter by platform"
        >
          <option value="all">Platform: All</option>
          {allPlatforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          className="filter-select"
          value={filters.sortBy}
          onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
          title="Sort problems"
          aria-label="Sort problems"
        >
          <option value="date-asc">Sort: Lab Date (Asc)</option>
          <option value="date-desc">Sort: Lab Date (Desc)</option>
          <option value="name-asc">Sort: Name (A → Z)</option>
          <option value="name-desc">Sort: Name (Z → A)</option>
          <option value="status">Sort: Status</option>
          <option value="topic">Sort: Topic</option>
          <option value="platform">Sort: Platform</option>
        </select>

        {/* Clear Filters button */}
        {hasActiveFilters && (
          <button type="button" className="filter-clear-btn" onClick={resetFilters}>
            <X size={12} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
