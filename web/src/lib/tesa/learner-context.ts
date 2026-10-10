import { createContext, type Context } from "react";
import type { Profile, Evidence, Simulation } from "./data";

export type State = {
  profile: Profile;
  resume: string;
  analyzed: boolean;
  /** Where the profile came from: the built-in sample, or an analysis of the user's resume. */
  source: "sample" | "resume" | null;
  saved: string[];
  focus: string;
  evidence: Evidence[];
  sims: Simulation[];
  skill: string;
  language: "en" | "es";
  theme: "dark" | "light";
};

type LearnerContextValue = {
  state: State;
  update: (s: Partial<State>) => void;
  t: (en: string, es: string) => string;
  addEvidence: (e: Evidence) => void;
  addSimulation: (s: Simulation) => void;
  loadSample: () => void;
  reset: () => void;
};

// Module edits also refresh this file. Reuse the context across those edits,
// rather than leaving mounted providers attached to an obsolete identity.
// Vite's hot data is browser-development-only; no learner data is stored here.
const hotData = import.meta.hot?.data as
  { learnerContext?: Context<LearnerContextValue | null> } | undefined;
// Query-versioned module URLs can coexist during preview updates. Share only
// the context identity in the browser realm, never state or a server singleton.
const browserRegistry =
  typeof window === "undefined"
    ? undefined
    : (window as Window & { __tesaLearnerContext?: Context<LearnerContextValue | null> });
export const TesaContext =
  browserRegistry?.__tesaLearnerContext ??
  hotData?.learnerContext ??
  createContext<LearnerContextValue | null>(null);
if (hotData) hotData.learnerContext = TesaContext;
if (browserRegistry) browserRegistry.__tesaLearnerContext = TesaContext;
