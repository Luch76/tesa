import { useContext, useEffect, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import {
  EMPTY_PROFILE,
  JOBS,
  SAMPLE_PROFILE,
  SAMPLE_RESUME,
  type Evidence,
  type Simulation,
} from "./data";
import { scoreJob, skillLevel } from "./scoring";
import { TesaContext as Context, type State } from "./learner-context";
const initial: State = {
  profile: EMPTY_PROFILE,
  resume: "",
  analyzed: false,
  source: null,
  saved: ["gem", "pa", "csm"],
  focus: "gem",
  evidence: [],
  sims: [],
  skill: "Insurance Verification",
  language: "en",
  theme: "dark",
};
// v2: progress saved before real resume analysis assumed the sample profile.
const STORAGE_KEY = "tesa-miami-v2";
export function TesaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed.profile?.skills &&
          Array.isArray(parsed.saved) &&
          Array.isArray(parsed.evidence) &&
          Array.isArray(parsed.sims)
        )
          setState({ ...initial, ...parsed });
      }
    } catch {
      /* use clean demo */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);
  const update = (s: Partial<State>) => setState((prev) => ({ ...prev, ...s }));
  useEffect(() => {
    document.documentElement.classList.toggle("light", state.theme === "light");
    document.documentElement.classList.toggle("dark", state.theme !== "light");
  }, [state.theme]);
  const t = (en: string, es: string) => (state.language === "es" ? es : en);
  function alertProgress(next: State) {
    for (const id of state.saved) {
      const job = JOBS.find((j) => j.id === id);
      if (!job) continue;
      const before = scoreJob(job, state.profile, state.evidence, state.sims);
      const after = scoreJob(job, next.profile, next.evidence, next.sims);
      const ranks = { building: 0, almost: 1, ready: 2 };
      if (ranks[after.status] > ranks[before.status])
        toast.success(
          after.status === "ready"
            ? t(`Ready to apply: ${job.title}`, `Listo para postular: ${job.title}`)
            : t(`Almost there: ${job.title}`, `Casi listo: ${job.title}`),
          {
            description: `${before.score} → ${after.score}`,
            action: {
              label: t("View progress", "Ver progreso"),
              onClick: () =>
                window.location.assign(after.status === "ready" ? "/portfolio" : "/gap"),
            },
          },
        );
    }
  }
  const addEvidence = (e: Evidence) => {
    const next = { ...state, evidence: [...state.evidence, e] };
    if (
      skillLevel(next.profile, next.evidence, e.skill).level >
      skillLevel(state.profile, state.evidence, e.skill).level
    )
      toast.success(t("Level earned!", "¡Nivel alcanzado!"), { description: e.skill });
    alertProgress(next);
    setState(next);
  };
  const addSimulation = (s: Simulation) => {
    const next = { ...state, sims: [...state.sims, s] };
    alertProgress(next);
    setState(next);
  };
  return (
    <Context.Provider
      value={{
        state,
        update,
        t,
        addEvidence,
        addSimulation,
        loadSample: () =>
          update({
            profile: structuredClone(SAMPLE_PROFILE),
            resume: SAMPLE_RESUME,
            analyzed: true,
            source: "sample",
            evidence: [],
            sims: [],
          }),
        reset: () => setState({ ...initial, language: state.language, theme: state.theme }),
      }}
    >
      {children}
      <Toaster theme={state.theme} position="top-right" richColors />
    </Context.Provider>
  );
}
export function useTesa() {
  const context = useContext(Context);
  if (!context) throw new Error("TESA provider required");
  return context;
}
