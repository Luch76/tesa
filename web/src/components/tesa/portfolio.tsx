import { getJob } from "@/lib/tesa/data";
import { useMemo, useState } from "react";
import { Copy, Download, FileText, RefreshCw, Printer, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/components/ai-elements/message";
import { useTesa } from "@/lib/tesa/context";
import { JOBS, SAMPLE_RESUME, BLOOM } from "@/lib/tesa/data";
import { scoreJob, skillLevel } from "@/lib/tesa/scoring";
import { JobSelector } from "./gap";
import { NextStep, PageHeading, Status } from "./shared";

export function PortfolioPage() {
  const { state, t } = useTesa();
  const job = getJob(state.focus);
  const fit = scoreJob(job, state.profile, state.evidence, state.sims);
  const [tab, setTab] = useState("preview"),
    [edited, setEdited] = useState<string | null>(null),
    [summary, setSummary] = useState(""),
    [confirm, setConfirm] = useState(false);
  const markdown = useMemo(
    () =>
      `# ${state.profile.name} · ${t("Proof Portfolio", "Portafolio de evidencia")}\n\n**${t("Target role", "Puesto objetivo")}:** ${job.title}, ${job.employer} (${job.hood}, Miami)\n\n**${t("Fit score", "Afinidad")}:** ${fit.score}/100 · ${t("ahead of", "por delante de")} ~${fit.pct}% (${t("modeled", "modelado")}) · ${fit.status}\n\n${summary ? `## ${t("Summary", "Resumen")}\n${summary}\n\n` : ""}## ${t("Skill evidence", "Evidencia de habilidades")}\n\n| ${t("Skill", "Habilidad")} | ${t("Level", "Nivel")} | ${t("Target", "Objetivo")} | ${t("Evidence", "Evidencia")} |\n|---|---|---|---|\n${job.reqs
        .map((r) => {
          const s = skillLevel(state.profile, state.evidence, r.s);
          return `| ${r.s}${r.m ? " (must-have)" : ""} | L${s.level} ${BLOOM[s.level]} | L${r.t} | ${(s.last?.quote ?? state.profile.skills[r.s]?.evidence ?? "Not yet demonstrated").replaceAll("|", "/")} |`;
        })
        .join(
          "\n",
        )}\n\n## ${t("Simulation record", "Historial de simulaciones")}\n${state.sims.length ? state.sims.map((sim) => `\n### ${JOBS.find((j) => j.id === sim.job)?.scn.name}\n${sim.summary}\n\n> ${sim.quote.replaceAll("\n", " ")}\n\nCommunication 4 · Empathy 4 · Problem solving 4 · Composure 4 · Professionalism 4\n`).join("\n") : t("No completed simulations yet.", "No hay simulaciones completadas.")}\n\n## ${t("Learning journey", "Ruta de aprendizaje")}\n- ${t("Tutor answers graded", "Respuestas evaluadas")}: ${state.evidence.length}\n- ${t("Simulations completed", "Simulaciones completadas")}: ${state.sims.length}\n\n## ${t("Resume", "Currículum")}\n\n\`\`\`\n${state.resume || SAMPLE_RESUME}\n\`\`\`\n\n---\nTESA Miami · ${t("Interactive prototype · illustrative demo evidence", "Prototipo interactivo · evidencia ilustrativa de ejemplo")}`,
    [state, job.id, summary, fit.score, fit.pct, t],
  );
  const content = edited ?? markdown;
  function download(kind: "md" | "json") {
    const data =
      kind === "md"
        ? content
        : JSON.stringify(
            {
              candidate: state.profile,
              job,
              fit: {
                score: fit.score,
                hard: fit.H,
                soft: fit.S,
                experience: fit.E,
                percentile_modeled: fit.pct,
                status: fit.status,
              },
              skills: job.reqs.map((r) => ({
                ...r,
                ...skillLevel(state.profile, state.evidence, r.s),
              })),
              evidence: state.evidence,
              simulations: state.sims,
              resume: state.resume || SAMPLE_RESUME,
              generated: new Date().toISOString(),
              demo: true,
            },
            null,
            2,
          );
    const url = URL.createObjectURL(
      new Blob([data], { type: kind === "md" ? "text/markdown" : "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `TESA-${state.profile.name.replaceAll(" ", "-")}-${job.id}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("Portfolio downloaded", "Portafolio descargado"));
  }
  return (
    <>
      <PageHeading
        eyebrow={t(
          "Your experience, backed by evidence",
          "Tu experiencia, respaldada por evidencia",
        )}
        title={t("Show what you can do.", "Demuestra lo que puedes hacer.")}
        description={t(
          "Take your skills, learning, and workplace practice into your next application.",
          "Lleva tus habilidades, aprendizaje y práctica a tu próxima postulación.",
        )}
      />
      <div className="mb-6">
        <JobSelector />
      </div>
      <section className="next-step">
        <div>
          <span className="eyebrow">{job.title}</span>
          <h3>
            {fit.score}/100 · {t("Your job fit", "Tu afinidad laboral")}
          </h3>
          <p>
            {fit.status === "ready"
              ? t(
                  "Your sample evidence clears the modeled readiness bar.",
                  "Tu evidencia de ejemplo supera el umbral modelado.",
                )
              : t(
                  "Keep building evidence to strengthen your application.",
                  "Sigue construyendo evidencia para mejorar tu postulación.",
                )}
          </p>
        </div>
        <Status status={fit.status} />
      </section>
      {fit.status !== "ready" && <NextStep job={job} />}
      <div className="portfolio-toolbar">
        <Button variant={tab === "preview" ? "bay" : "ghost"} onClick={() => setTab("preview")}>
          <FileText />
          {t("Preview", "Vista previa")}
        </Button>
        <Button variant={tab === "edit" ? "bay" : "ghost"} onClick={() => setTab("edit")}>
          <PenLine />
          Markdown
        </Button>
        <span className="flex-1" />
        <Button
          variant="outline"
          onClick={() => {
            setSummary(
              t(
                `I am a bilingual front desk supervisor with ${state.profile.years} years of experience in hospitality. I bring service recovery, guest operations, and team coordination to my work. My portfolio documents my current skills and workplace practice for ${job.title}.`,
                `Soy supervisora de recepción bilingüe con ${state.profile.years} años de experiencia en hospitalidad. Aporto recuperación de servicio, operaciones y coordinación de equipos. Mi portafolio documenta mis habilidades y práctica para ${job.title}.`,
              ),
            );
            setEdited(null);
            toast.success(t("Sample summary added", "Resumen de ejemplo agregado"));
          }}
        >
          {t("Write summary", "Crear resumen")}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title={t("Rebuild portfolio", "Reconstruir portafolio")}
          aria-label={t("Rebuild portfolio", "Reconstruir portafolio")}
          onClick={() => (edited ? setConfirm(true) : setEdited(null))}
        >
          <RefreshCw />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title={t("Copy", "Copiar")}
          aria-label={t("Copy portfolio", "Copiar portafolio")}
          onClick={() =>
            navigator.clipboard
              .writeText(content)
              .then(() => toast.success(t("Copied", "Copiado")))
              .catch(() =>
                toast.error(
                  t("Copy is unavailable in this browser", "No se puede copiar en este navegador"),
                ),
              )
          }
        >
          <Copy />
        </Button>
        <Button variant="outline" onClick={() => download("md")}>
          <Download />
          .md
        </Button>
        <Button variant="outline" onClick={() => download("json")}>
          <Download />
          .json
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          PDF
        </Button>
      </div>
      {confirm && (
        <div className="next-step">
          <h3>{t("Discard your edits and rebuild?", "¿Descartar cambios y reconstruir?")}</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              {t("Cancel", "Cancelar")}
            </Button>
            <Button
              onClick={() => {
                setEdited(null);
                setConfirm(false);
              }}
            >
              {t("Rebuild", "Reconstruir")}
            </Button>
          </div>
        </div>
      )}
      <section className="portfolio-content">
        {tab === "preview" ? (
          <MessageResponse>{content}</MessageResponse>
        ) : (
          <textarea
            aria-label={t("Edit portfolio Markdown", "Editar Markdown del portafolio")}
            className="markdown-edit"
            value={content}
            onChange={(e) => setEdited(e.target.value)}
          />
        )}
      </section>
      <p className="helper">
        {t(
          "Demo evidence is illustrative. PDF opens your browser’s print dialog. Employer sharing and AI summaries are not connected.",
          "La evidencia demo es ilustrativa. PDF abre la impresión del navegador. Compartir con empleadores y resúmenes con IA no están conectados.",
        )}
      </p>
    </>
  );
}
