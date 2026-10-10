import { getJob } from "@/lib/tesa/data";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Home,
  MapPin,
  Mic,
  Moon,
  Sun,
  Target,
  UserRound,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { JOBS, type Job } from "@/lib/tesa/data";
import { scoreJob } from "@/lib/tesa/scoring";
import type { ReactNode } from "react";
import { AccountMenu } from "./account-menu";

export const navItems = [
  { to: "/", en: "My profile", es: "Mi perfil", icon: UserRound },
  { to: "/jobs", en: "Miami jobs", es: "Empleos en Miami", icon: BriefcaseBusiness },
  { to: "/gap", en: "Skill gap", es: "Brecha de habilidades", icon: Target },
  { to: "/coach", en: "My personal coach", es: "Mi coach personal", icon: Mic },
  { to: "/simulations", en: "Practice Arena", es: "Arena de práctica", icon: Waves },
  { to: "/portfolio", en: "Proof portfolio", es: "Portafolio de evidencia", icon: FileCheck2 },
] as const;
export function Status({ status }: { status: string }) {
  const { t } = useTesa();
  return (
    <span className={`pill ${status}`}>
      <span className="text-[8px]">●</span>
      {status === "ready"
        ? t("Ready to apply", "Listo para postular")
        : status === "almost"
          ? t("Almost there", "Casi listo")
          : t("Building", "En desarrollo")}
    </span>
  );
}
export function BloomBar({ level, target }: { level: number; target?: number }) {
  return (
    <div
      className="bloom-bar"
      role="img"
      aria-label={`Bloom level ${level} of 6${target ? `, target ${target}` : ""}`}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className={`bloom-segment ${i < level ? "earned" : ""} ${target === i + 1 ? "target" : ""}`}
        />
      ))}
    </div>
  );
}
export function Gauge({ score }: { score: number }) {
  const { t } = useTesa();
  return (
    <div className="gauge">
      <svg viewBox="0 0 148 148" aria-hidden="true">
        <circle className="gauge-track" cx="74" cy="74" r="57" strokeDasharray="279 358" />
        <circle
          className="gauge-value"
          cx="74"
          cy="74"
          r="57"
          strokeDasharray={`${score * 2.79} 358`}
        />
      </svg>
      <div className="gauge-number">
        {score}
        <small>{t("Job fit / 100", "Afinidad / 100")}</small>
      </div>
    </div>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  const { state, update, t } = useTesa();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = navItems.find((n) => n.to === pathname) ?? navItems[0];
  const job = getJob(state.focus);
  const fit = scoreJob(job, state.profile, state.evidence, state.sims);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M3 11L16 4L29 11L16 18L3 11Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 15V23L16 28L25 23V15M29 11V22" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div className="brand-name">
              TESA<span className="text-bay">.</span>
            </div>
            <div className="brand-place">Miami</div>
          </div>
        </Link>
        <div className="nav-label">{t("Your next chapter", "Tu siguiente capítulo")}</div>
        <nav aria-label={t("Main navigation", "Navegación principal")}>
          {navItems.map((n) => (
            <Button
              key={n.to}
              variant={pathname === n.to ? "nav-active" : "nav"}
              className="nav-item"
              data-active={pathname === n.to}
              asChild
            >
              <Link to={n.to}>
                <n.icon />
                {t(n.en, n.es)}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-meter">
          <div className="meter-heading">
            <span>{t("COMPETITIVE METER", "MEDIDOR COMPETITIVO")}</span>
            <CircleHelp
              size={13}
              aria-label={t(
                "Scores and percentiles are modeled estimates",
                "Los puntajes y percentiles son estimaciones modeladas",
              )}
            />
          </div>
          <Gauge score={fit.score} />
          <div className="text-center">
            <Status status={fit.status} />
            <p className="text-[11px] mt-3 mb-1">{job.title}</p>
            <p className="text-[9px] text-muted-foreground">
              {t(`Ahead of ~${fit.pct}% · modeled`, `Por delante de ~${fit.pct}% · modelado`)}
            </p>
          </div>
          <div className="mt-4">
            {state.saved.map((id) => {
              const j = JOBS.find((x) => x.id === id);
              if (!j) return null;
              const f = scoreJob(j, state.profile, state.evidence, state.sims);
              return (
                <Button
                  key={id}
                  variant="ghost"
                  className="mini-job"
                  onClick={() => update({ focus: id })}
                >
                  <span className="mini-job-label">
                    <span>{j.title}</span>
                    <span className="font-mono">{f.score}</span>
                  </span>
                  <span className="mini-track block">
                    <span
                      className="mini-fill block"
                      ref={(node) => {
                        if (node) node.style.transform = `scaleX(${f.score / 100})`;
                      }}
                    />
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="user-footer">
          <div className="avatar">{state.analyzed ? "DR" : "YO"}</div>
          <div>
            <div className="text-[11px]">
              {state.analyzed
                ? state.profile.name
                : t("Your career starts here", "Tu carrera comienza aquí")}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">
              {t("Miami, Florida", "Miami, Florida")}
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <Link to="/" className="mobile-brand">
              TESA<span className="text-bay">.</span>
            </Link>
            <Home size={13} className="desktop-crumb" />
            <ChevronRight size={12} className="desktop-crumb" />
            <span className="desktop-crumb">{t("Your workspace", "Tu espacio")}</span>
            <span className="desktop-crumb text-muted-foreground">/</span>
            <span>{t(current.en, current.es)}</span>
          </div>
          <div className="topbar-actions">
            <span className="demo-label">
              <i className="demo-dot" />
              {t("Interactive demo", "Demo interactiva")}
            </span>
            <div className="language" aria-label="Language">
              <Button
                variant={state.language === "en" ? "secondary" : "ghost"}
                onClick={() => update({ language: "en" })}
              >
                EN
              </Button>
              <Button
                variant={state.language === "es" ? "secondary" : "ghost"}
                onClick={() => update({ language: "es" })}
              >
                ES
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={
                state.theme === "light"
                  ? t("Switch to dark mode", "Cambiar a modo oscuro")
                  : t("Switch to light mode", "Cambiar a modo claro")
              }
              title={
                state.theme === "light"
                  ? t("Switch to dark mode", "Cambiar a modo oscuro")
                  : t("Switch to light mode", "Cambiar a modo claro")
              }
              onClick={() => update({ theme: state.theme === "light" ? "dark" : "light" })}
            >
              {state.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title={t(
                "Notifications appear when saved-job readiness improves",
                "Las notificaciones aparecen al mejorar tu preparación",
              )}
              aria-label={t("Notifications", "Notificaciones")}
              onClick={() =>
                import("sonner").then(({ toast }) =>
                  toast.info(t("You’re all caught up", "Estás al día"), {
                    description: t(
                      "Job-readiness updates will appear here.",
                      "Aquí aparecerán tus avances de preparación laboral.",
                    ),
                  }),
                )
              }
            >
              <Bell size={16} />
            </Button>
            <AccountMenu />
          </div>
        </header>
        <main className="page">{children}</main>
      </div>
      <nav className="mobile-nav" aria-label={t("Mobile navigation", "Navegación móvil")}>
        {navItems.map((n) => (
          <Button variant={pathname === n.to ? "nav-active" : "ghost"} key={n.to} asChild>
            <Link to={n.to}>
              <n.icon />
              {t(n.en, n.es)}
            </Link>
          </Button>
        ))}
      </nav>
      <Link to="/gap" className="mobile-meter">
        <Target size={13} />
        {t("Job fit", "Afinidad")}
        <strong>{fit.score}/100</strong>
      </Link>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="page-eyebrow">
          <MapPin size={11} />
          {eyebrow}
        </div>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function NextStep({ job, skill }: { job?: Job; skill?: string }) {
  const { state, update, t } = useTesa();
  const j = job ?? getJob(state.focus);
  const s =
    skill ??
    j.reqs.find((r) => r.m && !((state.profile.skills[r.s]?.level ?? 0) >= r.t))?.s ??
    "Project Coordination";
  return (
    <section className="next-step">
      <div>
        <span className="eyebrow">{t("Your next best step", "Tu mejor siguiente paso")}</span>
        <h3>{t(`Build confidence in ${s}`, `Gana confianza en ${s}`)}</h3>
        <p>{t(`A focused session for ${j.title}.`, `Una sesión enfocada en ${j.title}.`)}</p>
      </div>
      <Button asChild onClick={() => update({ focus: j.id, skill: s })}>
        <Link to="/coach" search={{ mode: "tutor" }}>
          {t("Start learning", "Empezar a aprender")}
          <ArrowUpRight />
        </Link>
      </Button>
    </section>
  );
}
export function leafHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — TESA Miami` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — TESA Miami` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
