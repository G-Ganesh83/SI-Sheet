import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import { fetchAdminUsers } from "../../services/adminService";
import type { AdminUser } from "../../types/admin";
import {
  Users,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

type RoleFilter = "all" | "admin" | "user";

export const UsersView: React.FC = () => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(isAdmin));
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!isAdmin) return;

    const load = async () => {
      try {
        const data = await fetchAdminUsers();
        if (isMounted) {
          setUsers(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Failed to load users.";
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

  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users.";
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAdmin]);

  // Summary Metrics
  const totalUsersCount = users.length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;
  const standardUsersCount = users.filter((u) => u.role === "user").length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Role Filter
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }
      // Search Filter
      if (query) {
        const matchesName = u.display_name?.toLowerCase().includes(query) ?? false;
        const matchesEmail = u.email?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  // Non-admin guard
  if (!user || !isAdmin) {
    return (
      <div className="view-container">
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
      </div>
    );
  }

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "Never";
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="view-container">
      <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-header-tag">
            <ShieldCheck size={12} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">
            Inspect registered accounts, view aggregated progress metrics, and monitor user activity.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={refreshUsers}
          disabled={isLoading || isRefreshing}
          title="Refresh users list"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Total Users</div>
          <div className="admin-kpi-val">{isLoading ? "…" : totalUsersCount}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Admins</div>
          <div className="admin-kpi-val">{isLoading ? "…" : adminUsersCount}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Regular Users</div>
          <div className="admin-kpi-val">{isLoading ? "…" : standardUsersCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="admin-filter-bar">
        <div className="search-input-wrapper admin-search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by display name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="admin-role-filters">
          <button
            type="button"
            className={`admin-filter-chip ${roleFilter === "all" ? "active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            All Roles ({users.length})
          </button>
          <button
            type="button"
            className={`admin-filter-chip ${roleFilter === "admin" ? "active" : ""}`}
            onClick={() => setRoleFilter("admin")}
          >
            Admins ({adminUsersCount})
          </button>
          <button
            type="button"
            className={`admin-filter-chip ${roleFilter === "user" ? "active" : ""}`}
            onClick={() => setRoleFilter("user")}
          >
            Users ({standardUsersCount})
          </button>
        </div>

        <div className="admin-results-count">
          {searchQuery || roleFilter !== "all"
            ? `${filteredUsers.length} of ${users.length} users`
            : `${users.length} users`}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="admin-loading-container">
          <RefreshCw size={24} className="spin admin-loading-spinner" />
          <p className="admin-loading-text">Loading users and progress records...</p>
        </div>
      ) : error ? (
        <div className="admin-error-box">
          <div className="admin-error-header">
            <AlertTriangle size={16} />
            <span>Error Loading Users</span>
          </div>
          <p className="admin-error-msg">{error}</p>
          <button type="button" className="btn-secondary" onClick={refreshUsers}>
            Try Again
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={32} />
          </div>
          <h2 className="empty-state-title">No users found</h2>
          <p className="empty-state-desc">
            {searchQuery || roleFilter !== "all"
              ? "No accounts match the current search or role filter criteria."
              : "No user accounts registered yet."}
          </p>
          {(searchQuery || roleFilter !== "all") && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-container admin-table-container">
          <table className="problems-table admin-table admin-users-table">
            <thead>
              <tr>
                <th className="col-user">User</th>
                <th className="col-role">Role</th>
                <th className="col-stat">Completed</th>
                <th className="col-stat">In Progress</th>
                <th className="col-stat">Revision</th>
                <th className="col-joined">Joined</th>
                <th className="col-last-signin">Last Sign-in</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => (
                <tr key={item.id} className="admin-user-row">
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt={item.display_name || "User"} />
                        ) : (
                          <span>
                            {(item.display_name || item.email || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="admin-user-meta">
                        <span className="admin-user-name">
                          {item.display_name || "Anonymous Learner"}
                        </span>
                        {item.email ? (
                          <span className="admin-user-email" title={item.email}>
                            {item.email}
                          </span>
                        ) : (
                          <span className="admin-user-email-placeholder">—</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.role === "admin" ? (
                      <span className="admin-badge admin-badge-admin">
                        <ShieldCheck size={11} />
                        Admin
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge-user">
                        <UserIcon size={11} />
                        User
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="admin-stat-chip admin-stat-completed">
                      <CheckCircle2 size={12} />
                      <span className="admin-stat-num">{item.completed_count}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="admin-stat-chip admin-stat-in-progress">
                      <Clock size={12} />
                      <span className="admin-stat-num">{item.in_progress_count}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="admin-stat-chip admin-stat-revision">
                      <RotateCcw size={12} />
                      <span className="admin-stat-num">{item.revision_count}</span>
                    </span>
                  </td>
                  <td>
                    <span className="admin-date-text">{formatDate(item.created_at)}</span>
                  </td>
                  <td>
                    <span className="admin-date-text">{formatDateTime(item.last_sign_in_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};
