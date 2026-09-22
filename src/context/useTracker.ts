import { useContext } from "react";
import { TrackerContext } from "./TrackerContextBase";
import type { TrackerContextValue } from "./TrackerContext";

export function useTracker(): TrackerContextValue {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
}
