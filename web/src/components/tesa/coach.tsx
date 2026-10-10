import { getJob } from "@/lib/tesa/data";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Check, Mic, Route, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { JOBS } from "@/lib/tesa/data";
import { scoreJob } from "@/lib/tesa/scoring";
import { JobSelector } from "./gap";
import { NextStep, PageHeading, Status } from "./shared";
import { LearningChat } from "./learning-chat";
import { CoachAvatar } from "./coach-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CoachPage() {
  const { mode } = useSearch({ from: "/coach" });
  const navigate = useNavigate({ from: "/coach" });
  const { state, update, t } = useTesa();
  const firstName = state.analyzed ? (state.profile.name.split(/\s+/)[0] ?? "") : "";
  const headline = state.analyzed ? state.profile.headline : "";
  const job = getJob(state.focus);
  const fit = scoreJob(job, state.profile, state.evidence, state.sims);
  const missing =
    fit.short[0] ??
    job.reqs.find((r) => (state.profile.skills[r.s]?.level ?? 0) < r.t)?.s ??
    "Project Coordination";
  return (
    <>
      <PageHeading
        eyebrow={t("Your personalized path", "Tu ruta personalizada")}
        title={t("Your personal coach.", "Tu coach personal.")}
        description={t(
          "A focused plan that connects your experience to the job you want.",
          "Un plan enfocado que conecta tu experiencia con el empleo que quieres.",
        )}
      />
      <Tabs
        value={mode}
        onValueChange={(value) =>
          void navigate({ search: { mode: value === "tutor" ? "tutor" : "coach" } })
        }
      >
        <TabsList className="mb-6" aria-label={t("Personal coach mode", "Modo de coach personal")}>
          <TabsTrigger value="coach">{t("Career coaching", "Orientación profesional")}</TabsTrigger>
          <TabsTrigger value="tutor">{t("Socratic tutor", "Tutor socrático")}</TabsTrigger>
        </TabsList>
        <TabsContent value="tutor">
          <LearningChat />
        </TabsContent>
        <TabsContent value="coach">
          <div className="coach-welcome">
            <CoachAvatar />
            <div>
              <h2>
                {t(
                  `Hi ${firstName || "there"}, you’re closer than you think.`,
                  `Hola${firstName ? ` ${firstName}` : ""}, estás más cerca de lo que crees.`,
                )}
              </h2>
              <p>
                {t(
                  `Your experience${headline ? ` as ${headline}` : ""} has already built valuable skills. Let’s choose a role, work on the biggest gaps, and practice real workplace moments.`,
                  `Tu experiencia${headline ? ` como ${headline}` : ""} ya te ha dado habilidades valiosas. Elijamos un puesto, cerremos las brechas y practiquemos situaciones reales.`,
                )}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-[11px] text-muted-foreground mb-2">
              {t("What role are we working toward?", "¿Qué puesto queremos alcanzar?")}
            </label>
            <JobSelector />
          </div>
          <NextStep job={job} skill={missing} />
          <div className="learning-grid">
            <section className="learning-card">
              <span className="page-eyebrow">
                <Route size={13} />
                {t("Your guided plan", "Tu plan guiado")}
              </span>
              <h3>{job.title}</h3>
              <p>
                {job.employer} · {job.hood}
              </p>
              <ol className="list-none p-0">
                <li className="flex gap-3">
                  <span className="step-number">1</span>
                  <div>
                    <strong className="text-foreground">
                      {t("Build your job-specific skills", "Desarrolla habilidades para el puesto")}
                    </strong>
                    <p>
                      {t(
                        `Start with ${missing}. One question at a time.`,
                        `Empieza con ${missing}. Una pregunta a la vez.`,
                      )}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="step-number">2</span>
                  <div>
                    <strong className="text-foreground">
                      {t("Practice a real situation", "Practica una situación real")}
                    </strong>
                    <p>
                      {job.scn.name} · {job.scn.setting}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="step-number">3</span>
                  <div>
                    <strong className="text-foreground">
                      {t("Take your evidence with you", "Lleva contigo tu evidencia")}
                    </strong>
                    <p>
                      {t(
                        "Build a portfolio that shows what you can actually do.",
                        "Crea un portafolio que muestre lo que puedes hacer.",
                      )}
                    </p>
                  </div>
                </li>
              </ol>
              <Button asChild onClick={() => update({ skill: missing })}>
                <Link to="/coach" search={{ mode: "tutor" }}>
                  <Mic />
                  {t("Start my first session", "Empezar mi primera sesión")}
                  <ArrowRight />
                </Link>
              </Button>
            </section>
            <section className="learning-card">
              <span className="page-eyebrow">
                <Target size={13} />
                {t("Your starting point", "Tu punto de partida")}
              </span>
              <div className="flex gap-3 items-center mt-6">
                <strong className="font-mono text-5xl">{fit.score}</strong>
                <Status status={fit.status} />
              </div>
              <p>
                {t(
                  `You’re ahead of ~${fit.pct}% of a modeled applicant pool. Your score will grow as you demonstrate skills.`,
                  `Estás por delante de ~${fit.pct}% de candidatos modelados. Tu puntaje crecerá al demostrar tus habilidades.`,
                )}
              </p>
              <div className="mt-6 mb-6">
                {job.reqs
                  .filter((r) => (state.profile.skills[r.s]?.level ?? 0) >= r.t)
                  .map((r) => (
                    <div key={r.s} className="text-bay text-xs flex items-center gap-2 my-3">
                      <Check size={13} />
                      {r.s}
                    </div>
                  ))}
              </div>
              <Button variant="outline" asChild>
                <Link to="/gap">
                  {t("See my full skill gap", "Ver mi brecha completa")}
                  <ArrowRight />
                </Link>
              </Button>
              <div className="border-t border-border mt-6 pt-5">
                <p>
                  {t("Want to explore a different direction?", "¿Quieres explorar otra dirección?")}
                </p>
                <Button variant="ghost" className="px-0 text-bay text-xs" asChild>
                  <Link to="/jobs">
                    <BriefcaseBusiness />
                    {t("Compare Miami jobs", "Comparar empleos en Miami")}
                  </Link>
                </Button>
              </div>
            </section>
          </div>
          <p className="helper">
            {t(
              "Guided demo · coaching is scripted for this prototype.",
              "Demo guiada · el coaching usa respuestas de ejemplo en este prototipo.",
            )}
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}
