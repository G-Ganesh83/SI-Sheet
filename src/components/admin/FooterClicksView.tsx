import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import { fetchAdminFooterClicks } from "../../services/adminService";
import type { FooterClickItem, FooterClicksSummary } from "../../types/admin";
import {
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

type DateRangeFilter = "all" | "today" | "7days" | "30days";
type VisitorTypeFilter = "all" | "signed_in" | "anonymous";

const ITEMS_PER_PAGE = 20;

export const FooterClicksView: React.FC = () => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [clicks, setClicks] = useState<FooterClickItem[]>([]);
  const [summary, setSummary] = useState<FooterClicksSummary>({
    total: 0,
    signed_in: 0,
    anonymous: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(isAdmin));
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<VisitorTypeFilter>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;
    if (!isAdmin) return;

    const load = async () => {
      try {
        const data = await fetchAdminFooterClicks();
        if (isMounted) {
          setClicks(data.clicks);
          setSummary(data.summary);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load footer clicks.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const refreshClicks = useCallback(async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchAdminFooterClicks();
      setClicks(data.clicks);
      setSummary(data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load footer clicks.";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAdmin]);

  // Filter clicks
  const filteredClicks = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return clicks.filter((c) => {
      // Type filter
      if (typeFilter !== "all" && c.visitor_type !== typeFilter) {
        return false;
      }

      // Date range filter
      if (dateRange !== "all") {
        const clickTime = new Date(c.clicked_at).getTime();
        if (dateRange === "today" && clickTime < todayStart) {
          return false;
        }
        if (dateRange === "7days" && clickTime < sevenDaysAgo) {
          return false;
        }
        if (dateRange === "30days" && clickTime < thirtyDaysAgo) {
          return false;
        }
      }

      return true;
    });
  }, [clicks, typeFilter, dateRange]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredClicks.length / ITEMS_PER_PAGE));
  const paginatedClicks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClicks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClicks, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset to page 1 on filter change
  const handleDateFilterChange = (range: DateRangeFilter) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (type: VisitorTypeFilter) => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  // Non-admin guard
  if (!user || !isAdmin) {
    return (
      <div className="admin-page-container">
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">
            <AlertTriangle size={32} />
          </div>
          <h2 className="empty-state-title">Access Denied</h2>
          <p className="empty-state-desc">
            You do not have administrative privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  const formatClickTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-tag">
            <ShieldCheck size={12} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="admin-page-title">Footer Clicks</h1>
          <p className="admin-page-subtitle">
            Track engagement on the public GitHub creator link across authenticated learners and anonymous visitors.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={refreshClicks}
          disabled={isLoading || isRefreshing}
          title="Refresh clicks"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Total Clicks</div>
          <div className="admin-kpi-val">{isLoading ? "…" : summary.total}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <UserCheck size={13} style={{ color: "var(--status-completed)" }} />
            <span>Signed-in Clicks</span>
          </div>
          <div className="admin-kpi-val" style={{ color: "var(--status-completed)" }}>
            {isLoading ? "…" : summary.signed_in}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <UserX size={13} style={{ color: "var(--text-muted)" }} />
            <span>Anonymous Clicks</span>
          </div>
          <div className="admin-kpi-val" style={{ color: "var(--text-secondary)" }}>
            {isLoading ? "…" : summary.anonymous}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filter-group">
          <span className="admin-filter-label">
            <Calendar size={13} />
            <span>Time Range:</span>
          </span>
          <div className="admin-role-filters">
            <button
              type="button"
              className={`admin-filter-chip ${dateRange === "all" ? "active" : ""}`}
              onClick={() => handleDateFilterChange("all")}
            >
              All Time
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${dateRange === "today" ? "active" : ""}`}
              onClick={() => handleDateFilterChange("today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${dateRange === "7days" ? "active" : ""}`}
              onClick={() => handleDateFilterChange("7days")}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${dateRange === "30days" ? "active" : ""}`}
              onClick={() => handleDateFilterChange("30days")}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">
            <Filter size={13} />
            <span>Type:</span>
          </span>
          <div className="admin-role-filters">
            <button
              type="button"
              className={`admin-filter-chip ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => handleTypeFilterChange("all")}
            >
              All Types
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${typeFilter === "signed_in" ? "active" : ""}`}
              onClick={() => handleTypeFilterChange("signed_in")}
            >
              Signed In
            </button>
            <button
              type="button"
              className={`admin-filter-chip ${typeFilter === "anonymous" ? "active" : ""}`}
              onClick={() => handleTypeFilterChange("anonymous")}
            >
              Anonymous
            </button>
          </div>
        </div>

        <div className="admin-results-count">
          {dateRange !== "all" || typeFilter !== "all"
            ? `${filteredClicks.length} of ${clicks.length} clicks`
            : `${clicks.length} clicks`}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="admin-loading-container">
          <RefreshCw size={24} className="spin admin-loading-spinner" />
          <p className="admin-loading-text">Loading footer click records...</p>
        </div>
      ) : error ? (
        <div className="admin-error-box">
          <div className="admin-error-header">
            <AlertTriangle size={16} />
            <span>Error Loading Clicks</span>
          </div>
          <p className="admin-error-msg">{error}</p>
          <button type="button" className="btn-secondary" onClick={refreshClicks}>
            Try Again
          </button>
        </div>
      ) : filteredClicks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MousePointerClick size={32} />
          </div>
          <h2 className="empty-state-title">No click events recorded</h2>
          <p className="empty-state-desc">
            {dateRange !== "all" || typeFilter !== "all"
              ? "No click events match the selected filters."
              : "No clicks on the creator GitHub footer link have been recorded yet."}
          </p>
          {(dateRange !== "all" || typeFilter !== "all") && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => {
                setDateRange("all");
                setTypeFilter("all");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container admin-table-container">
          <table className="problems-table admin-table">
            <thead>
              <tr>
                <th style={{ width: "28%" }}>Time</th>
                <th style={{ width: "30%" }}>Visitor</th>
                <th style={{ width: "26%" }}>Email</th>
                <th style={{ width: "16%", textAlign: "center" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClicks.map((click) => (
                <tr key={click.id} className="admin-user-row">
                  <td>
                    <span className="admin-date-text">{formatClickTime(click.clicked_at)}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          click.visitor_type === "signed_in"
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {click.visitor_name}
                    </span>
                  </td>
                  <td>
                    {click.visitor_email ? (
                      <span className="admin-user-email" title={click.visitor_email}>
                        {click.visitor_email}
                      </span>
                    ) : (
                      <span className="admin-user-email-placeholder">—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {click.visitor_type === "signed_in" ? (
                      <span className="admin-badge admin-badge-admin" style={{ color: "var(--status-completed)", borderColor: "rgba(16, 185, 129, 0.3)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                        <UserCheck size={11} />
                        Signed in
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-user">
                        <UserX size={11} />
                        Anonymous
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                Page {currentPage} of {totalPages} ({filteredClicks.length} total)
              </span>
              <div className="admin-pagination-actions">
                <button
                  type="button"
                  className="btn-icon"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
