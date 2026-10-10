import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Mic,
  MapPin,
  Bookmark,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeResume, getResume, uploadResume } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { BLOOM, JOBS } from "@/lib/tesa/data";
import { initials } from "@/lib/utils";
import { scoreJob, skillLevel } from "@/lib/tesa/scoring";
import { BloomBar, PageHeading, Status } from "./shared";
import miamiBay from "@/assets/miami-bay.jpg";
import { ScrollJourney, JourneyChapter } from "./scroll-journey";
import { CoachAvatar } from "./coach-avatar";

export function ProfilePage() {
  const { state, update, t, loadSample, reset } = useTesa();
  const [busy, setBusy] = useState(false),
    [drag, setDrag] = useState(false),
    [file, setFile] = useState(""),
    [expanded, setExpanded] = useState(false),
    [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // The latest upload, so analysis can wait for it; resolves to whether it succeeded.
  const uploading = useRef<Promise<boolean> | null>(null);
  // Show the resume already saved to the user's account, if any.
  useEffect(() => {
    getResume()
      .then((saved) => {
        if (saved) setFile((current) => current || saved.originalName);
      })
      .catch(() => undefined);
  }, []);
  const matches = JOBS.map((job) => ({
    job,
    fit: scoreJob(job, state.profile, state.evidence, state.sims),
  })).sort((a, b) => b.fit.score - a.fit.score);
  async function acceptFile(f: File) {
    if (!/\.(pdf|docx|txt)$/i.test(f.name)) {
      toast.error(t("Choose a PDF, DOCX, or text file", "Elige un archivo PDF, DOCX o de texto"));
      return;
    }
    // A new resume starts everything anew: profile, analysis, tutor evidence and simulations.
    const hadProgress = state.analyzed;
    reset();
    setFile(f.name);
    if (hadProgress) {
      toast.info(
        t("Starting fresh with your new resume", "Empezando de nuevo con tu nuevo currículum"),
        {
          description: t(
            "Analyze it to rebuild your profile.",
            "Analízalo para reconstruir tu perfil.",
          ),
        },
      );
    }
    uploading.current = saveToAccount(f);
    if (/\.txt$/i.test(f.name)) update({ resume: await f.text() });
  }
  async function saveToAccount(f: File): Promise<boolean> {
    try {
      await uploadResume(f);
      toast.success(t("Resume saved to your account", "Currículum guardado en tu cuenta"));
      return true;
    } catch (error) {
      toast.error(t("Couldn’t save your resume", "No se pudo guardar tu currículum"), {
        description: error instanceof Error ? error.message : undefined,
      });
      return false;
    }
  }
  async function analyze() {
    if (!state.resume.trim() && !file) return;
    setBusy(true);
    try {
      let profile;
      if (file) {
        // Analyze the file saved to the account, once its upload has finished.
        if (uploading.current && !(await uploading.current)) return;
        profile = await analyzeResume();
      } else {
        profile = await analyzeResume(state.resume);
      }
      update({ profile, analyzed: true, source: "resume", evidence: [], sims: [] });
      const found = Object.keys(profile.skills).length;
      toast.success(t("Your skill analysis is ready", "Tu análisis de habilidades está listo"), {
        description: t(
          `Found ${found} job skill${found === 1 ? "" : "s"} in your resume.`,
          `Encontramos ${found} habilidad${found === 1 ? "" : "es"} laboral${found === 1 ? "" : "es"} en tu currículum.`,
        ),
      });
    } catch (error) {
      toast.error(t("Couldn’t analyze your resume", "No se pudo analizar tu currículum"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        aria-label={t("Upload resume", "Subir currículum")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          // Clear the picker so choosing the same file again still triggers a new upload.
          e.target.value = "";
          if (f) void acceptFile(f);
        }}
      />
      <PageHeading
        eyebrow={t("Built for your next move", "Para tu próximo paso")}
        title={t("Your experience. New possibilities.", "Tu experiencia. Nuevas posibilidades.")}
        description={t(
          "See what you already bring to the table—and what stands between you and your next role.",
          "Descubre lo que ya aportas y lo que te falta para tu próximo puesto.",
        )}
      >
        <span className="pill sample mt-1">{t("Miami-Dade, FL", "Miami-Dade, FL")}</span>
      </PageHeading>
      <ScrollJourney>
        <div className="journey-chapter" data-journey-chapter="0">
          <JourneyChapter
            step={t("01 · Your starting point", "01 · Tu punto de partida")}
            title={t(
              state.analyzed ? "Your experience, uncovered." : "Add your resume.",
              state.analyzed ? "Tu experiencia, descubierta." : "Agrega tu currículum.",
            )}
            description={t(
              "Every next chapter starts with what you already know.",
              "Cada nuevo capítulo empieza con lo que ya sabes.",
            )}
          />
          <div className="profile-grid">
            {!state.analyzed && (
              <section className="panel">
                <div className="panel-head">
                  <h2 className="flex items-center gap-2">
                    <FileText size={15} className="text-muted-foreground" />
                    {t("Start with your resume", "Empieza con tu currículum")}
                  </h2>
                  <span className="text-[10px] text-muted-foreground">
                    {t("Step 01", "Paso 01")}
                  </span>
                </div>
                <div className="panel-body">
                  <div
                    className={`dropzone ${drag ? "dragging" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={t("Drop or upload your resume", "Arrastra o sube tu currículum")}
                    onClick={() => input.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        input.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      const f = e.dataTransfer.files[0];
                      if (f) void acceptFile(f);
                    }}
                  >
                    <div className="upload-icon">
                      <Upload size={21} className="text-bay" />
                    </div>
                    <h3>{file || t("Drop your resume here", "Arrastra tu currículum aquí")}</h3>
                    <p>
                      {t(
                        "or choose a file from your device",
                        "o elige un archivo de tu dispositivo",
                      )}
                    </p>
                    <span className="text-[9px] text-muted-foreground mt-2">PDF, DOCX, TXT</span>
                  </div>
                  <div className="divider-label">
                    {t("or paste your resume", "o pega tu currículum")}
                  </div>
                  <textarea
                    aria-label={t("Resume text", "Texto del currículum")}
                    className="resume-text"
                    value={state.resume}
                    onChange={(e) => update({ resume: e.target.value })}
                    placeholder={t(
                      "Paste your experience, education, and skills here…",
                      "Pega aquí tu experiencia, educación y habilidades…",
                    )}
                  />
                  <div className="action-row">
                    <Button
                      variant="ghost"
                      className="px-0"
                      onClick={() => {
                        loadSample();
                        setFile("");
                        toast.success(
                          t(
                            "Daniela’s sample profile loaded",
                            "Perfil de ejemplo de Daniela cargado",
                          ),
                        );
                      }}
                    >
                      <FileText />
                      {t("Try a sample resume", "Probar un ejemplo")}
                    </Button>
                    <Button disabled={busy || (!state.resume.trim() && !file)} onClick={analyze}>
                      {busy ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}
                      {busy
                        ? t("Analyzing…", "Analizando…")
                        : t("Analyze my resume", "Analizar mi currículum")}
                    </Button>
                  </div>
                  <p className="helper">
                    <LockKeyhole size={11} />
                    {t(
                      "Analyzed by Gemini AI · skill levels are estimates.",
                      "Analizado con IA de Gemini · los niveles son estimaciones.",
                    )}
                  </p>
                </div>
              </section>
            )}
            <section className="panel">
              <div className="panel-head">
                <h2>{t("Your skill snapshot", "Tu resumen de habilidades")}</h2>
                <div className="flex items-center gap-2">
                  <span className="pill sample">
                    {state.source === "sample"
                      ? t("Sample profile", "Perfil de ejemplo")
                      : t("From your resume", "De tu currículum")}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
                    <Upload />
                    {t("Upload new resume", "Subir nuevo currículum")}
                  </Button>
                </div>
              </div>
              <div className="panel-body">
                <div className="profile-summary">
                  <div className="avatar">{initials(state.profile.name)}</div>
                  <div>
                    <h3 className="profile-name">
                      {state.profile.name || t("Your profile", "Tu perfil")}
                    </h3>
                    {state.profile.headline && (
                      <p className="profile-meta">{state.profile.headline}</p>
                    )}
                  </div>
                </div>
                <div className="tags">
                  <span className="tag">
                    {t(
                      `${state.profile.years} years of experience`,
                      `${state.profile.years} años de experiencia`,
                    )}
                  </span>
                  {state.profile.languages.length > 0 && (
                    <span className="tag">{state.profile.languages.join(" + ")}</span>
                  )}
                </div>
                <div className="stat-row">
                  <div className="stat">
                    <strong className="text-bay">{Object.keys(state.profile.skills).length}</strong>
                    <span>{t("Skills identified", "Habilidades")}</span>
                  </div>
                  <div className="stat">
                    <strong>{matches.length}</strong>
                    <span>{t("Local job matches", "Empleos locales")}</span>
                  </div>
                  <div className="stat">
                    <strong className="text-sun">
                      {matches[0]?.fit.score ?? 0}
                      <span className="text-[11px] inline">%</span>
                    </strong>
                    <span>{t("Best current fit", "Mejor afinidad actual")}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{t("TRANSFERABLE STRENGTHS", "FORTALEZAS TRANSFERIBLES")}</span>
                  <span>{t("SKILL LEVEL", "NIVEL")}</span>
                </div>
                <div
                  className="skill-scroll"
                  role="region"
                  tabIndex={0}
                  aria-label={t("Your skills", "Tus habilidades")}
                >
                  {Object.entries(state.profile.skills).map(([skill, v]) => (
                    <div className="skill-preview" key={skill}>
                      <span>
                        {skill === "CRM (Salesforce/HubSpot)"
                          ? "CRM (Salesforce / HubSpot)"
                          : skill}
                      </span>
                      <BloomBar level={skillLevel(state.profile, state.evidence, skill).level} />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-bay text-[11px] mt-1"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded
                    ? t("Hide skill details", "Ocultar detalles")
                    : t("Edit skill details", "Editar habilidades")}
                  <ChevronDown size={13} />
                </Button>
                <p className="helper mt-3">
                  {t(
                    "Skills are a starting point, not a ceiling.",
                    "Tus habilidades son un punto de partida, no un límite.",
                  )}
                </p>
              </div>
            </section>
          </div>
          {expanded && (
            <section>
              <div className="section-heading">
                <div>
                  <h2>{t("Review your skills", "Revisa tus habilidades")}</h2>
                  <p>
                    {t(
                      "Correct a level before continuing. Changes update every job fit.",
                      "Corrige los niveles antes de continuar. Los cambios actualizan la afinidad.",
                    )}
                  </p>
                </div>
              </div>
              <div className="skill-cards">
                {Object.entries(state.profile.skills).map(([skill, v]) => (
                  <div key={skill} className="skill-card">
                    <h3>{skill}</h3>
                    <BloomBar level={v.level} />
                    <p>“{v.evidence}”</p>
                    <select
                      aria-label={`Level for ${skill}`}
                      value={v.level}
                      onChange={(e) =>
                        update({
                          profile: {
                            ...state.profile,
                            skills: {
                              ...state.profile.skills,
                              [skill]: { ...v, level: Number(e.target.value) },
                            },
                          },
                        })
                      }
                    >
                      {BLOOM.map((name, i) => (
                        <option key={name} value={i}>
                          L{i} {name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <section
          className="journey-chapter"
          data-journey-chapter="1"
          aria-labelledby="top-matches-heading"
        >
          <JourneyChapter
            step={t("02 · Your possibilities", "02 · Tus posibilidades")}
            title={t("Find your fit.", "Encuentra tu puesto.")}
            description={t(
              "Your strengths open more doors than you think.",
              "Tus fortalezas abren más puertas de las que imaginas.",
            )}
          />
          <div className="section-heading">
            <div>
              <h2 id="top-matches-heading">
                {t("Your top job matches", "Tus mejores empleos afines")}
              </h2>
              <p>
                {t(
                  "Composite sample listings · ranked by your current fit",
                  "Ofertas ficticias de ejemplo · ordenadas por tu afinidad actual",
                )}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/jobs">
                {t("View all jobs", "Ver todos los empleos")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="job-grid">
            {matches.slice(0, 4).map(({ job, fit }) => (
              <article key={job.id} className="job-card">
                <h3>{job.title}</h3>
                <p className="job-employer">{job.employer}</p>
                <div className="job-details">
                  <span>
                    <MapPin />
                    {job.hood}
                  </span>
                  <span>
                    ${job.pay[0]}–{job.pay[1]}k{t(" / year", " / año")}
                  </span>
                </div>
                <div className="job-bottom">
                  <div className="job-fit">
                    <strong>{fit.score}</strong>
                    <div>
                      <small>{t("job fit / 100", "afinidad / 100")}</small>
                      <div className="mt-1">
                        <Status status={fit.status} />
                      </div>
                    </div>
                  </div>
                  <div className="job-actions">
                    <Button
                      variant={state.saved.includes(job.id) ? "bay" : "outline"}
                      size="icon-sm"
                      aria-label={t(
                        `${state.saved.includes(job.id) ? "Unsave" : "Save"} ${job.title}`,
                        `${state.saved.includes(job.id) ? "Quitar" : "Guardar"} ${job.title}`,
                      )}
                      title={t("Save job", "Guardar empleo")}
                      onClick={() =>
                        update({
                          saved: state.saved.includes(job.id)
                            ? state.saved.filter((id) => id !== job.id)
                            : [...state.saved, job.id],
                        })
                      }
                    >
                      <Bookmark />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      onClick={() => update({ focus: job.id })}
                    >
                      <Link to="/gap">
                        {t("View fit", "Ver afinidad")}
                        <ArrowUpRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="journey-chapter" data-journey-chapter="2">
          <JourneyChapter
            step={t("03 · Your next move", "03 · Tu próximo paso")}
            title={t("Close the gap.", "Cierra la brecha.")}
            description={t(
              "A little practice. More confidence. Your next opportunity.",
              "Un poco de práctica. Más confianza. Tu próxima oportunidad.",
            )}
          />
          <div className="section-heading">
            <div>
              <h2>{t("Where do you want to go next?", "¿Cuál será tu siguiente paso?")}</h2>
              <p>
                {t(
                  "Two ways forward. One goal: your next opportunity.",
                  "Dos caminos. Una meta: tu próxima oportunidad.",
                )}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="text-bay">●</span>
              {t("Personalized to your skills", "Personalizado a tus habilidades")}
            </span>
          </div>
          <div className="next-paths">
            <section className="path-card">
              <div className="path-icon">
                <BriefcaseBusiness size={20} />
              </div>
              <div>
                <h3>{t("Explore the Miami job market", "Explora empleos en Miami")}</h3>
                <p>
                  {t(
                    "Compare local roles, see your fit, and learn the skills that matter for the jobs you want.",
                    "Compara puestos, descubre tu afinidad y aprende las habilidades que necesitas.",
                  )}
                </p>
                <Button variant="bay" size="sm" asChild>
                  <Link to="/jobs">
                    {t("Find my next role", "Encontrar mi próximo puesto")}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              <ArrowUpRight className="path-arrow" />
            </section>
            <section className="path-card">
              <CoachAvatar compact />
              <div>
                <h3>{t("Meet your personal career coach", "Conoce a tu coach personal")}</h3>
                <p>
                  {t(
                    "Not sure where to start? Get a guided path from your experience to your next chapter.",
                    "¿No sabes por dónde empezar? Recibe una ruta desde tu experiencia a tu próximo capítulo.",
                  )}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/coach" search={{ mode: "coach" }}>
                    {t("Build my learning path", "Crear mi ruta de aprendizaje")}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              <ArrowUpRight className="path-arrow" />
            </section>
          </div>
        </section>
      </ScrollJourney>
      <div className="cover">
        <img
          src={miamiBay}
          width={1536}
          height={512}
          alt={t(
            "Miami skyline over Biscayne Bay at sunset",
            "Miami sobre la bahía de Biscayne al atardecer",
          )}
          loading="lazy"
        />
        <div className="cover-copy">
          <h3>{t("Your next chapter is local.", "Tu próximo capítulo está aquí.")}</h3>
          <p>
            {t(
              "Miami opportunities. Your experience. A clearer way forward.",
              "Oportunidades en Miami. Tu experiencia. Un camino más claro.",
            )}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-6">
        <p className="helper m-0">
          {t(
            "Built for Miami. Designed for possibility.",
            "Hecho para Miami. Diseñado para nuevas posibilidades.",
          )}
        </p>
        {confirm ? (
          <div className="flex items-center gap-2 text-xs">
            <span>{t("Reset all progress?", "¿Borrar todo el progreso?")}</span>
            <Button
              size="icon-sm"
              variant="destructive"
              aria-label="Confirm reset"
              onClick={() => {
                reset();
                setFile("");
                setConfirm(false);
              }}
            >
              <Check />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Cancel reset"
              onClick={() => setConfirm(false)}
            >
              <X />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground"
            onClick={() => setConfirm(true)}
          >
            <RotateCcw size={12} />
            {t("Reset progress", "Reiniciar progreso")}
          </Button>
        )}
      </div>
    </>
  );
}
