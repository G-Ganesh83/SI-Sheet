import React, { useMemo, useState } from "react";
import { Download, Search, Upload, X } from "lucide-react";
import { useTracker } from "../../context/useTracker";
import type { DatasetImportCandidate, Problem } from "../../types/tracker";
import { adminImportToCatalog } from "../../services/adminImportService";
import {
  buildImportCandidate,
  extractUrls,
  normalizeLabDate,
  parseProblemText,
} from "../../data/importer";

type ImportMode = "url" | "paste" | "manual";

const emptyManual = {
  title: "",
  url: "",
  platform: "",
  topics: "",
  labDate: "",
};

function actionLabel(action: DatasetImportCandidate["action"]): string {
  switch (action) {
    case "new":
      return "NEW";
    case "add-lab-date":
      return "ADD LAB DATE";
    case "already-exists":
      return "ALREADY EXISTS";
    case "possible-duplicate":
      return "POSSIBLE DUPLICATE";
    case "invalid":
    default:
      return "INVALID";
  }
}

function candidateToProblem(candidate: DatasetImportCandidate): Partial<Problem> {
  return {
    id: candidate.id,
    title: candidate.title,
    url: candidate.url,
    platform: candidate.platform,
    topics: candidate.topics,
    labDates: candidate.labDates,
  };
}

async function fetchPageTitle(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const text = await response.text();
    return text.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  } catch {
    return "";
  }
}

export const ImportView: React.FC = () => {
  const {
    problems,
    allTopics,
    importHistory,
    refreshImportedProblems,
    exportDataset,
  } = useTracker();

  const [mode, setMode] = useState<ImportMode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [sharedLabDate, setSharedLabDate] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [manual, setManual] = useState(emptyManual);
  const [candidates, setCandidates] = useState<DatasetImportCandidate[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<string>("");
  const [existingSearch, setExistingSearch] = useState("");

  const selectedImportable = candidates.filter(
    (candidate) =>
      candidate.selected &&
      (candidate.action === "new" || candidate.action === "add-lab-date")
  );

  const existingMatches = useMemo(() => {
    const query = existingSearch.trim().toLowerCase();
    if (!query) return [];
    return problems
      .filter(
        (problem) =>
          problem.title.toLowerCase().includes(query) ||
          problem.url.toLowerCase().includes(query) ||
          problem.topics.some((topic) => topic.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [existingSearch, problems]);

  const rebuildCandidate = (candidate: DatasetImportCandidate): DatasetImportCandidate => {
    const rebuilt = buildImportCandidate(candidateToProblem(candidate), candidate.labDates[0] ?? "", problems, allTopics);
    return {
      ...rebuilt,
      selected: candidate.selected && rebuilt.action !== "invalid" && rebuilt.action !== "already-exists",
    };
  };

  const updateCandidate = (id: string, updates: Partial<DatasetImportCandidate>) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id !== id) return candidate;
        return rebuildCandidate({ ...candidate, ...updates });
      })
    );
  };

  const extractFromUrls = async () => {
    setMessage("");
    setSummary("");
    const urls = extractUrls(urlInput);
    const labDate = normalizeLabDate(sharedLabDate);
    if (urls.length === 0) {
      setMessage("Please enter at least one URL.");
      return;
    }
    if (!labDate) {
      setMessage("Lab date is required. Use the format 21 Sep 2026.");
      return;
    }

    setIsExtracting(true);
    const next: DatasetImportCandidate[] = [];
    for (const url of urls) {
      const pageTitle = await fetchPageTitle(url);
      const candidate = buildImportCandidate(
        {
          title: pageTitle,
          url,
          labDates: [labDate],
        },
        labDate,
        problems,
        allTopics
      );
      if (!pageTitle) {
        candidate.messages.push("Automatic page extraction failed; title was derived from the URL when possible.");
      }
      next.push(candidate);
    }
    setCandidates(next);
    setIsExtracting(false);
  };

  const extractFromPaste = () => {
    setMessage("");
    setSummary("");
    if (!pasteText.trim()) {
      setMessage("Please paste problem text or metadata first.");
      return;
    }
    const parsed = parseProblemText(pasteText);
    const candidate = buildImportCandidate(parsed, sharedLabDate, problems, allTopics);
    setCandidates([candidate]);
  };

  const addManualCandidate = () => {
    setMessage("");
    setSummary("");
    const candidate = buildImportCandidate(
      {
        title: manual.title,
        url: manual.url,
        platform: manual.platform,
        topics: manual.topics.split(",").map((topic) => topic.trim()).filter(Boolean),
        labDates: [manual.labDate],
      },
      manual.labDate,
      problems,
      allTopics
    );
    setCandidates([candidate]);
  };

  const confirmImport = async () => {
    setMessage("");
    setSummary("");
    if (selectedImportable.length === 0) {
      setMessage("Select at least one valid NEW or ADD LAB DATE row before confirming.");
      return;
    }

    setIsImporting(true);
    try {
      const response = await adminImportToCatalog(candidates);
      if (!response.ok) {
        const failureMsg = response.error || "Import failed. No changes were made to the shared catalog.";
        setMessage(response.details ? `${failureMsg} (${response.details})` : failureMsg);
        return;
      }

      // Refresh catalog and merge in TrackerContext
      await refreshImportedProblems();

      const addedCount = response.added ?? 0;
      const updatedCount = response.updated ?? 0;
      let summaryText = "Import completed successfully.";
      if (addedCount > 0 || updatedCount > 0) {
        summaryText += ` (${addedCount} added, ${updatedCount} updated)`;
      }
      setSummary(summaryText);
      setCandidates([]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessage(
        errMsg.includes("Import failed")
          ? errMsg
          : `Import failed. No changes were made to the shared catalog. (${errMsg})`
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-title-row">
          <h1 className="view-title">Import Problems</h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary" onClick={exportDataset}>
              <Download size={13} />
              <span>Export Dataset</span>
            </button>
          </div>
        </div>
        <p className="view-subtitle">
          Admin tool: Import problems directly into the shared Supabase catalog with validation, duplicate detection, and live synchronization.
        </p>
      </div>

      <section className="import-panel">
        <div className="import-tabs" aria-label="Import method">
          {(["url", "paste", "manual"] as ImportMode[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`import-tab ${mode === item ? "active" : ""}`}
              onClick={() => setMode(item)}
            >
              {item === "url" ? "URL" : item === "paste" ? "Paste Text" : "Manual"}
            </button>
          ))}
        </div>

        {mode === "url" && (
          <div className="import-form-grid">
            <label className="import-field import-field-wide">
              <span>Problem URLs</span>
              <textarea
                className="import-textarea"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://leetcode.com/problems/daily-temperatures/"
                aria-label="Problem URLs"
              />
            </label>
            <label className="import-field">
              <span>Lab Date</span>
              <input
                className="import-input"
                value={sharedLabDate}
                onChange={(e) => setSharedLabDate(e.target.value)}
                placeholder="21 Sep 2026"
                aria-label="Lab date"
              />
            </label>
            <div className="import-actions">
              <button type="button" className="btn-primary" onClick={extractFromUrls} disabled={isExtracting}>
                <Upload size={13} />
                <span>{isExtracting ? "Extracting..." : "Extract Problem"}</span>
              </button>
            </div>
          </div>
        )}

        {mode === "paste" && (
          <div className="import-form-grid">
            <label className="import-field import-field-wide">
              <span>Problem Text</span>
              <textarea
                className="import-textarea"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Title: Maximum XOR&#10;URL: https://...&#10;Topics: Bit Manipulation, Trie"
                aria-label="Pasted problem text"
              />
            </label>
            <label className="import-field">
              <span>Lab Date</span>
              <input
                className="import-input"
                value={sharedLabDate}
                onChange={(e) => setSharedLabDate(e.target.value)}
                placeholder="21 Sep 2026"
                aria-label="Lab date for pasted problem"
              />
            </label>
            <div className="import-actions">
              <button type="button" className="btn-primary" onClick={extractFromPaste}>
                <Upload size={13} />
                <span>Parse Text</span>
              </button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="import-form-grid">
            <label className="import-field">
              <span>Title</span>
              <input className="import-input" value={manual.title} onChange={(e) => setManual((prev) => ({ ...prev, title: e.target.value }))} />
            </label>
            <label className="import-field">
              <span>URL</span>
              <input className="import-input" value={manual.url} onChange={(e) => setManual((prev) => ({ ...prev, url: e.target.value }))} />
            </label>
            <label className="import-field">
              <span>Platform</span>
              <input className="import-input" value={manual.platform} onChange={(e) => setManual((prev) => ({ ...prev, platform: e.target.value }))} />
            </label>
            <label className="import-field">
              <span>Topics</span>
              <input className="import-input" value={manual.topics} onChange={(e) => setManual((prev) => ({ ...prev, topics: e.target.value }))} placeholder="Bit Manipulation, Trie" />
            </label>
            <label className="import-field">
              <span>Lab Date</span>
              <input className="import-input" value={manual.labDate} onChange={(e) => setManual((prev) => ({ ...prev, labDate: e.target.value }))} placeholder="21 Sep 2026" />
            </label>
            <div className="import-actions">
              <button type="button" className="btn-primary" onClick={addManualCandidate}>
                <Upload size={13} />
                <span>Preview Entry</span>
              </button>
            </div>
          </div>
        )}

        {message && <div className="import-alert">{message}</div>}
        {summary && <div className="import-success">{summary}</div>}
      </section>

      {candidates.length > 0 && (
        <section className="import-panel">
          <div className="section-title-row">
            <h2 className="section-title">Import Preview</h2>
            <button type="button" className="section-action" onClick={() => setCandidates([])}>
              <X size={11} />
              <span>Clear</span>
            </button>
          </div>

          <div className="import-preview-list">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="import-preview-row">
                <label className="revision-toggle">
                  <input
                    type="checkbox"
                    checked={candidate.selected}
                    disabled={candidate.action === "invalid" || candidate.action === "already-exists"}
                    onChange={(e) => updateCandidate(candidate.id, { selected: e.target.checked })}
                    aria-label={`Select ${candidate.title || "candidate"} for import`}
                  />
                  <span>Select</span>
                </label>
                <label className="import-field">
                  <span>Title</span>
                  <input className="import-input" value={candidate.title} onChange={(e) => updateCandidate(candidate.id, { title: e.target.value })} />
                </label>
                <label className="import-field">
                  <span>Platform</span>
                  <input className="import-input" value={candidate.platform} onChange={(e) => updateCandidate(candidate.id, { platform: e.target.value })} />
                </label>
                <label className="import-field">
                  <span>Topics</span>
                  <input className="import-input" value={candidate.topics.join(", ")} onChange={(e) => updateCandidate(candidate.id, { topics: e.target.value.split(",").map((topic) => topic.trim()).filter(Boolean) })} />
                </label>
                <label className="import-field">
                  <span>Lab Date</span>
                  <input className="import-input" value={candidate.labDates[0] ?? ""} onChange={(e) => updateCandidate(candidate.id, { labDates: [e.target.value] })} />
                </label>
                <label className="import-field import-field-wide">
                  <span>URL</span>
                  <input className="import-input" value={candidate.url} onChange={(e) => updateCandidate(candidate.id, { url: e.target.value })} />
                </label>
                <div className="import-row-meta">
                  <span className={`import-action-pill ${candidate.action}`}>{actionLabel(candidate.action)}</span>
                  <span>{candidate.confidence}</span>
                  {candidate.action === "possible-duplicate" && (
                    <button
                      type="button"
                      className="section-action"
                      onClick={() => updateCandidate(candidate.id, { action: "new", selected: true, messages: [] })}
                    >
                      Import as New
                    </button>
                  )}
                </div>
                {candidate.messages.length > 0 && (
                  <ul className="import-messages">
                    {candidate.messages.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="import-confirm-row">
            <label className="search-input-wrapper import-existing-search">
              <Search size={15} className="search-icon" />
              <input
                className="search-input"
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
                placeholder="Search existing problems while reviewing..."
                aria-label="Search existing problems"
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void confirmImport()}
              disabled={isImporting || selectedImportable.length === 0}
            >
              {isImporting ? "Importing to Catalog..." : "Confirm Import"}
            </button>
          </div>

          {existingMatches.length > 0 && (
            <div className="compact-list">
              {existingMatches.map((problem) => (
                <div key={problem.id} className="compact-item">
                  <div className="compact-item-left">
                    <span className="compact-item-title">{problem.title}</span>
                  </div>
                  <span className="compact-item-tag">{problem.platform} · {problem.labDates.join(", ")}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="import-panel">
        <div className="section-title-row">
          <h2 className="section-title">Recent Imports</h2>
        </div>
        {importHistory.length > 0 ? (
          <div className="compact-list">
            {importHistory.map((entry) => (
              <div key={entry.id} className="compact-item">
                <span className="compact-item-title">{new Date(entry.timestamp).toLocaleString()}</span>
                <span className="compact-item-tag">
                  {entry.processed} processed · {entry.added} added · {entry.updated} updated · {entry.skipped} skipped
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state-desc">No imports yet.</p>
        )}
      </section>
    </div>
  );
};
