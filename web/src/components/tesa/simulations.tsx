import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock3, Play, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { JOBS, type Simulation } from "@/lib/tesa/data";
import { scoreJob } from "@/lib/tesa/scoring";
import { LearningChat } from "./learning-chat";
import { NextStep, PageHeading, Status } from "./shared";

export function SimulationsPage() {
  const { state, update, t } = useTesa();
  const [selected, setSelected] = useState<string | null>(null),
    [started, setStarted] = useState(false),
    [result, setResult] = useState<Simulation | null>(null),
    [timerOn, setTimerOn] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [replay, setReplay] = useState<Simulation | null>(null);
  const job = JOBS.find((j) => j.id === selected);
  const fit = job ? scoreJob(job, state.profile, state.evidence, state.sims) : null;
  useEffect(() => {
    if (!started || !timerOn || result) return;
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [started, timerOn, result]);
  function back() {
    setSelected(null);
    setStarted(false);
    setResult(null);
    setReplay(null);
    setElapsed(0);
  }
  return (
    <>
      <PageHeading
        eyebrow={t("Real situations. Real confidence.", "Situaciones reales. Confianza real.")}
        title={
          selected
            ? t("Your workplace practice.", "Tu práctica laboral.")
            : t("Practice Arena", "Arena de práctica")
        }
        description={t(
          "Build the human skills that turn a good candidate into a great colleague.",
          "Desarrolla las habilidades humanas que convierten a un buen candidato en un gran colega.",
        )}
      >
        {selected && (
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft />
            {t("All scenarios", "Todos los escenarios")}
          </Button>
        )}
      </PageHeading>
      {replay ? (
        <section className="panel">
          <div className="panel-head">
            <h2>{t("Past simulation", "Simulación anterior")}</h2>
            <Button variant="ghost" onClick={() => setReplay(null)}>
              {t("Close", "Cerrar")}
            </Button>
          </div>
          <div className="panel-body">
            {replay.turns.map((turn, i) => (
              <p key={i} className="text-xs leading-7">
                <strong className={turn.role === "user" ? "text-bay" : "text-foreground"}>
                  {turn.role === "user" ? state.profile.name : t("Character", "Personaje")}:{" "}
                </strong>
                {turn.text}
              </p>
            ))}
          </div>
        </section>
      ) : result && job && fit ? (
        <>
          <section className="next-step">
            <div>
              <span className="eyebrow">{t("Practice completed", "Práctica completada")}</span>
              <h3>
                {job.title} · {fit.score}/100
              </h3>
              <p>
                {t(
                  "Simulation evidence is now part of your portfolio.",
                  "La evidencia de la simulación ahora es parte de tu portafolio.",
                )}
              </p>
            </div>
            <Status status={fit.status} />
          </section>
          <section className="learning-card">
            <div className="text-bay mb-4">
              <Check size={26} />
            </div>
            <h3>{t("A strong step forward.", "Un gran paso adelante.")}</h3>
            <p>{result.summary}</p>
            <blockquote className="border-l-2 border-bay pl-4 my-6 text-sm leading-7">
              “{result.quote}”
            </blockquote>
            <h3>{t("Keep building on this", "Sigue mejorando")}</h3>
            <ul>
              {result.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <div className="flex gap-3 mt-6">
              <Button asChild>
                <Link to="/portfolio">
                  {t("Build portfolio", "Crear portafolio")}
                  <ArrowRight />
                </Link>
              </Button>
              <Button variant="outline" onClick={back}>
                {t("Practice another scenario", "Practicar otro escenario")}
              </Button>
            </div>
          </section>
        </>
      ) : job ? (
        started ? (
          <>
            <div className="flex justify-between mb-5 items-center">
              <span className="pill sample">{t("Scripted practice", "Práctica con guion")}</span>
              {timerOn && (
                <span className="font-mono text-xs text-sun">
                  <Clock3 size={12} className="inline mr-2" />
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
              )}
            </div>
            <LearningChat simulation jobId={job.id} onFinish={setResult} />
          </>
        ) : (
          <section className="learning-card max-w-2xl mx-auto mt-8">
            <div className="scenario-icon">
              <Waves />
            </div>
            <h3 className="text-2xl">{job.scn.name}</h3>
            <p>
              {job.title} · {job.employer}
            </p>
            <div className="border-t border-border pt-5 mt-6">
              <span className="page-eyebrow">{t("The setting", "El escenario")}</span>
              <p>{job.scn.setting}</p>
              <span className="page-eyebrow mt-6">
                {t("Who you’re talking to", "Con quién hablarás")}
              </span>
              <p>{job.scn.character}</p>
            </div>
            <div className="tags">
              {job.soft.map((k) => (
                <span className="tag" key={k}>
                  {k.replaceAll("_", " ")}
                </span>
              ))}
            </div>
            <label className="flex gap-2 items-center text-xs text-muted-foreground my-6">
              <input
                type="checkbox"
                checked={timerOn}
                onChange={(e) => setTimerOn(e.target.checked)}
              />
              <Clock3 size={13} />
              {t("Show a practice timer", "Mostrar cronómetro")}
            </label>
            <Button
              onClick={() => {
                setStarted(true);
                update({ focus: job.id });
              }}
            >
              <Play />
              {t("Begin simulation", "Empezar simulación")}
            </Button>
          </section>
        )
      ) : (
        <>
          <NextStep />
          <div className="section-heading">
            <div>
              <h2>{t("Choose a workplace moment", "Elige una situación laboral")}</h2>
              <p>
                {t(
                  "Saved jobs first · all scenarios are sample situations",
                  "Empleos guardados primero · todos los escenarios son ejemplos",
                )}
              </p>
            </div>
          </div>
          <div className="scenario-grid">
            {[...JOBS]
              .sort(
                (a, b) => Number(state.saved.includes(b.id)) - Number(state.saved.includes(a.id)),
              )
              .map((j) => (
                <article className="scenario-card" key={j.id}>
                  <div className="flex justify-between items-center">
                    <div className="scenario-icon">
                      <Waves size={19} />
                    </div>
                    {state.saved.includes(j.id) && (
                      <span className="pill sample">{t("Saved role", "Puesto guardado")}</span>
                    )}
                  </div>
                  <h3>{j.scn.name}</h3>
                  <p className="text-foreground">{j.title}</p>
                  <p>{j.scn.setting}</p>
                  <p>{j.scn.character}</p>
                  <div className="tags">
                    {j.soft.slice(0, 3).map((k) => (
                      <span className="tag" key={k}>
                        {k.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setSelected(j.id)}>
                    {t("Enter scenario", "Ver escenario")}
                    <ArrowRight />
                  </Button>
                </article>
              ))}
          </div>
          {state.sims.length > 0 && (
            <>
              <div className="section-heading">
                <h2>{t("Your simulation record", "Tu historial de simulaciones")}</h2>
              </div>
              {state.sims.map((sim, i) => {
                const j = JOBS.find((j) => j.id === sim.job);
                return (
                  <div className="gap-row" key={`${sim.at}-${i}`}>
                    <div>
                      <h3>{j?.scn.name}</h3>
                      <p>{j?.title}</p>
                    </div>
                    <div className="font-mono text-bay">4.0 / 5</div>
                    <Button variant="outline" onClick={() => setReplay(sim)}>
                      <Play />
                      {t("Replay", "Revisar")}
                    </Button>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </>
  );
}
