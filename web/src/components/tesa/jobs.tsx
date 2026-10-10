import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, Check, DollarSign, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTesa } from "@/lib/tesa/context";
import { JOBS } from "@/lib/tesa/data";
import { scoreJob, skillLevel } from "@/lib/tesa/scoring";
import { NextStep, PageHeading, Status } from "./shared";

export function JobsPage() {
  const { state, update, t } = useTesa();
  const [sector, setSector] = useState("All"),
    [query, setQuery] = useState(""),
    [hood, setHood] = useState("All"),
    [pay, setPay] = useState("0"),
    [sort, setSort] = useState("fit"),
    [onlySaved, setOnlySaved] = useState(false);
  const sectors: [string, string][] = [
    ["All", "Todos"],
    ["Healthcare", "Salud"],
    ["Professional services", "Servicios profesionales"],
    ["Logistics & trade", "Logística y comercio"],
    ["Hospitality", "Hospitalidad"],
    ["Tech & fintech", "Tecnología y fintech"],
  ];
  const jobs = useMemo(
    () =>
      JOBS.filter(
        (j) =>
          (sector === "All" || j.sector === sector) &&
          (hood === "All" || j.hood === hood) &&
          j.pay[1] >= Number(pay) &&
          (!onlySaved || state.saved.includes(j.id)) &&
          `${j.title} ${j.employer} ${j.hood}`.toLowerCase().includes(query.toLowerCase()),
      )
        .map((job) => ({
          job,
          fit: scoreJob(job, state.profile, state.evidence, state.sims),
          initial: scoreJob(job, state.profile, [], []),
        }))
        .sort((a, b) =>
          sort === "pay"
            ? b.job.pay[1] - a.job.pay[1]
            : sort === "value"
              ? b.job.pay[1] * b.fit.score - a.job.pay[1] * a.fit.score
              : b.fit.score - a.fit.score,
        ),
    [state, sector, query, hood, pay, sort, onlySaved],
  );
  return (
    <>
      <PageHeading
        eyebrow={t("Opportunities close to home", "Oportunidades cerca de ti")}
        title={t("Find your next Miami role.", "Encuentra tu próximo puesto en Miami.")}
        description={t(
          "A job market that starts with what you can do—not just what’s on your resume.",
          "Un mercado laboral que empieza con lo que puedes hacer, no solo tu currículum.",
        )}
      >
        <span className="pill sample">
          {t("Composite sample listings", "Ofertas ficticias de ejemplo")}
        </span>
      </PageHeading>
      <NextStep />
      <div className="filter-row">
        {sectors.map(([en, es]) => (
          <Button
            key={en}
            variant={sector === en ? "nav-active" : "secondary"}
            onClick={() => setSector(en)}
          >
            {t(en, es)}
          </Button>
        ))}
      </div>
      <div className="search-row">
        <label className="search-input">
          <Search size={15} />
          <input
            aria-label={t("Search jobs", "Buscar empleos")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Job title, company, or neighborhood", "Puesto, empresa o vecindario")}
          />
        </label>
        <select
          aria-label={t("Neighborhood", "Vecindario")}
          value={hood}
          onChange={(e) => setHood(e.target.value)}
        >
          <option value="All">{t("All neighborhoods", "Todos los vecindarios")}</option>
          {Array.from(new Set(JOBS.map((j) => j.hood)))
            .sort()
            .map((h) => (
              <option key={h}>{h}</option>
            ))}
        </select>
        <select
          aria-label={t("Minimum pay", "Salario mínimo")}
          value={pay}
          onChange={(e) => setPay(e.target.value)}
        >
          <option value="0">{t("Any salary", "Cualquier salario")}</option>
          <option value="50">$50k+</option>
          <option value="65">$65k+</option>
          <option value="80">$80k+</option>
        </select>
        <select
          aria-label={t("Sort jobs", "Ordenar empleos")}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="fit">{t("Best fit first", "Mejor afinidad")}</option>
          <option value="pay">{t("Highest salary", "Mayor salario")}</option>
          <option value="value">{t("Pay × fit", "Salario × afinidad")}</option>
        </select>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[11px] text-muted-foreground">
          {t(`${jobs.length} roles · ranked for you`, `${jobs.length} puestos · ordenados para ti`)}
        </span>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={onlySaved}
            onChange={(e) => setOnlySaved(e.target.checked)}
          />
          {t("Saved jobs only", "Solo empleos guardados")}
        </label>
      </div>
      <div className="job-grid">
        {jobs.map(({ job: j, fit, initial }) => (
          <article key={j.id} className="job-card">
            <div className="job-top">
              <span className="sector">
                {t(j.sector, sectors.find((s) => s[0] === j.sector)?.[1] ?? j.sector)}
              </span>
              <span className="tag">
                {t(
                  j.tier === "entry"
                    ? "Entry level"
                    : j.tier === "mid"
                      ? "Mid level"
                      : "Leadership",
                  j.tier === "entry" ? "Inicial" : j.tier === "mid" ? "Intermedio" : "Liderazgo",
                )}
              </span>
            </div>
            <h3>{j.title}</h3>
            <p className="job-employer">{j.employer}</p>
            <div className="job-details">
              <span>
                <MapPin />
                {j.hood}
              </span>
              <span>
                <DollarSign />${j.pay[0]}–{j.pay[1]}k{t(" / year", " / año")}
              </span>
              <span>{t(`${j.years}+ years`, `${j.years}+ años`)}</span>
            </div>
            <div className="tags">
              {j.reqs
                .filter((r) => r.m)
                .map((r) => (
                  <span
                    className={`tag ${skillLevel(state.profile, state.evidence, r.s).level >= r.t ? "met" : ""}`}
                    key={r.s}
                  >
                    {skillLevel(state.profile, state.evidence, r.s).level >= r.t && (
                      <Check size={10} />
                    )}{" "}
                    {r.s}
                  </span>
                ))}
            </div>
            {j.lang && (
              <div className="text-[10px] text-muted-foreground mt-3">
                {t("English + Spanish preferred", "Preferencia por inglés + español")}
              </div>
            )}
            <div className="job-bottom">
              <div className="job-fit">
                <strong>{fit.score}</strong>
                <div>
                  <small>{t("job fit", "afinidad")}</small>
                  <div className="mt-1">
                    <Status status={fit.status} />
                  </div>
                </div>
                {fit.score > initial.score && (
                  <span className="text-bay text-[10px]">+{fit.score - initial.score}</span>
                )}
              </div>
              <div className="job-actions">
                <Button
                  variant={state.saved.includes(j.id) ? "bay" : "outline"}
                  size="icon-sm"
                  title={
                    state.saved.includes(j.id)
                      ? t("Unsave job", "Dejar de guardar")
                      : t("Save job", "Guardar empleo")
                  }
                  aria-label={`${state.saved.includes(j.id) ? "Unsave" : "Save"} ${j.title}`}
                  onClick={() =>
                    update({
                      saved: state.saved.includes(j.id)
                        ? state.saved.filter((id) => id !== j.id)
                        : [...state.saved, j.id],
                    })
                  }
                >
                  <Bookmark fill={state.saved.includes(j.id) ? "currentColor" : "none"} />
                </Button>
                <Button variant="outline" asChild onClick={() => update({ focus: j.id })}>
                  <Link to="/gap">
                    {t("See gap", "Ver brecha")}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!jobs.length && (
        <div className="text-center py-20 text-muted-foreground">
          <Search size={25} className="mx-auto mb-4" />
          {t("No roles match those filters.", "No hay puestos con esos filtros.")}
          <Button
            variant="link"
            className="block mx-auto mt-2"
            onClick={() => {
              setQuery("");
              setSector("All");
              setHood("All");
              setPay("0");
              setOnlySaved(false);
            }}
          >
            {t("Clear filters", "Borrar filtros")}
          </Button>
        </div>
      )}
    </>
  );
}
