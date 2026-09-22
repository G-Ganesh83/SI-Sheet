import { createContext } from "react";
import type { TrackerContextValue } from "./TrackerContext";

export const TrackerContext = createContext<TrackerContextValue | undefined>(undefined);
