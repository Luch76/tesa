import { getJob } from "@/lib/tesa/data";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Mic, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { JOBS, BLOOM } from "@/lib/tesa/data";
import { scoreJob, skillLevel } from "@/lib/tesa/scoring";
import { BloomBar, NextStep, PageHeading, Status } from "./shared";

export function JobSelector() {
  const { state, update, t } = useTesa();
  return (
    <select
      className="w-full sm:w-auto text-xs"
      aria-label={t("Target job", "Empleo objetivo")}
      value={state.focus}
      onChange={(e) => update({ focus: e.target.value })}
    >
      {[...JOBS]
        .sort((a, b) => Number(state.saved.includes(b.id)) - Number(state.saved.includes(a.id)))
        .map((j) => (
          <option key={j.id} value={j.id}>
            {state.saved.includes(j.id) ? "★ " : ""}
            {j.title}
          </option>
        ))}
    </select>
  );
}
export function GapPage() {
  const { state, update, t } = useTesa();
  const job = getJob(state.focus);
  const fit = scoreJob(job, state.profile, state.evidence, state.sims);
  const reqs = [...job.reqs].sort(
    (a, b) =>
      b.m - a.m ||
      b.t -
        skillLevel(state.profile, state.evidence, b.s).level -
        (a.t - skillLevel(state.profile, state.evidence, a.s).level),
  );
  const missing = reqs.find((r) => skillLevel(state.profile, state.evidence, r.s).level < r.t);
  const suggested = missing?.s ?? job.reqs[0]?.s ?? "Project Coordination";
  const gain = missing
    ? scoreJob(
        job,
        {
          ...state.profile,
          skills: {
            ...state.profile.skills,
            [missing.s]: { level: missing.t, evidence: "Preview" },
          },
        },
        state.evidence,
        state.sims,
      ).score - fit.score
    : 0;
  return (
    <>
      <PageHeading
        eyebrow={t("Know your next move", "Conoce tu siguiente paso")}
        title={t("A gap is just a starting point.", "Una brecha es solo el comienzo.")}
        description={t(
          "Turn the requirements for your target role into an achievable learning path.",
          "Convierte los requisitos de tu puesto ideal en una ruta de aprendizaje alcanzable.",
        )}
      />
      <JobSelector />
      <div className="fit-summary">
        <div>
          <div className="fit-large">
            {fit.score}
            <small> / 100</small>
          </div>
          <div className="mt-3">
            <Status status={fit.status} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            {t(`Ahead of ~${fit.pct}% (modeled)`, `Por delante de ~${fit.pct}% (modelado)`)}
          </p>
        </div>
        <div className="fit-breakdown">
          {[
            [t("Hard skills · 60%", "Habilidades técnicas · 60%"), fit.H],
            [t("Soft skills · 25%", "Habilidades humanas · 25%"), fit.S],
            [t("Experience · 15%", "Experiencia · 15%"), fit.E],
          ].map(([label, value]) => (
            <div className="breakdown" key={String(label)}>
              <label>{label}</label>
              <strong>{Math.round(Number(value) * 100)}%</strong>
              <div className="mini-track">
                <div
                  className="mini-fill"
                  ref={(node) => {
                    if (node) node.style.transform = `scaleX(${value})`;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <section className="next-step">
        <div>
          <span className="eyebrow">
            {t("Your next best step", "Tu mejor siguiente paso")}
            {gain > 0 && ` · +${gain} ${t("potential fit", "afinidad potencial")}`}
          </span>
          <h3>
            {missing
              ? t(`Close ${suggested} next`, `Aprende ${suggested} ahora`)
              : t(
                  "Put your people skills into practice",
                  "Pon en práctica tus habilidades humanas",
                )}
          </h3>
          <p>
            {t(
              "Small, focused steps. Evidence you can take to an employer.",
              "Pasos pequeños y enfocados. Evidencia para compartir con empleadores.",
            )}
          </p>
        </div>
        <Button asChild onClick={() => update({ skill: suggested })}>
          <Link to={missing ? "/coach" : "/simulations"} search={missing ? { mode: "tutor" } : {}}>
            {missing ? t("Tutor me", "Aprender") : t("Practice now", "Practicar")}
            <ArrowRight />
          </Link>
        </Button>
      </section>
      <div className="section-heading">
        <div>
          <h2>{t("Your skills vs. this role", "Tus habilidades frente al puesto")}</h2>
          <p>
            {job.title} · {job.employer}
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {fit.short.length} {t("must-have gaps", "brechas obligatorias")}
        </span>
      </div>
      {reqs.map((r) => {
        const sl = skillLevel(state.profile, state.evidence, r.s);
        const met = sl.level >= r.t;
        return (
          <div key={r.s} className="gap-row">
            <div>
              <h3>{r.s}</h3>
              <div className="flex gap-2 items-center">
                {r.m === 1 && <span className="tag">{t("Must-have", "Obligatoria")}</span>}
                <span className={`text-[10px] ${met ? "text-good" : "text-primary"}`}>
                  {met ? (
                    <span className="flex gap-1 items-center">
                      <Check size={11} />
                      {t("At target", "Objetivo alcanzado")}
                    </span>
                  ) : (
                    t(`${r.t - sl.level} levels to go`, `${r.t - sl.level} niveles por alcanzar`)
                  )}
                </span>
                {sl.earned > sl.base && (
                  <span className="pill sample">
                    {t("Raised in tutoring", "Mejorado con tutoría")}
                  </span>
                )}
              </div>
            </div>
            <div>
              <BloomBar level={sl.level} target={r.t} />
              <p>
                L{sl.level} {BLOOM[sl.level]} → {t("target", "objetivo")} L{r.t} {BLOOM[r.t]}
              </p>
            </div>
            <Button
              variant={met ? "outline" : "bay"}
              asChild
              onClick={() => update({ skill: r.s })}
            >
              <Link to="/coach" search={{ mode: "tutor" }}>
                {met ? t("Practice", "Practicar") : t("Tutor me", "Aprender")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        );
      })}
      <div className="gap-row">
        <div>
          <h3>{t("Soft skills", "Habilidades humanas")}</h3>
          <p>{job.soft.map((s) => s.replaceAll("_", " ")).join(" · ")}</p>
        </div>
        <div>
          <p>
            {state.sims.length
              ? t(
                  `${state.sims.length} simulations completed`,
                  `${state.sims.length} simulaciones completadas`,
                )
              : t("No simulation evidence yet", "Sin evidencia de simulaciones")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/simulations">
            {t("Simulate", "Simular")}
            <Mic />
          </Link>
        </Button>
      </div>
      <p className="helper">
        <Target size={12} />
        {t(
          "Fit is deterministic: skills 60%, soft skills 25%, experience 15%. Percentiles model a typical applicant pool.",
          "La afinidad es determinista: técnicas 60%, humanas 25%, experiencia 15%. Los percentiles modelan candidatos típicos.",
        )}
      </p>
    </>
  );
}
