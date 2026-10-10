import { type Evidence, type Job, type Profile, type Simulation, SOFT } from "./data";

export function skillLevel(profile: Profile, evidence: Evidence[], skill: string) {
  const base = profile.skills[skill]?.level ?? 0;
  const ev = evidence.filter((e) => e.skill === skill && e.confidence >= 0.7 && e.level > 0);
  let earned = 0;
  for (let l = 6; l >= 1; l--) {
    if (ev.filter((e) => e.level >= l).length >= 2) {
      earned = l;
      break;
    }
  }
  const level = Math.max(base, earned);
  const nextL = Math.min(6, level + 1);
  return {
    level,
    base,
    earned,
    nextL,
    toward: level >= 6 ? 0 : ev.filter((e) => e.level >= nextL).length,
    last: ev.at(-1),
  };
}

export function normalCdf(z: number) {
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return (1 + (z < 0 ? -erf : erf)) / 2;
}

export function scoreJob(job: Job, profile: Profile, evidence: Evidence[], sims: Simulation[]) {
  let wsum = 0,
    hsum = 0;
  const short: string[] = [];
  for (const r of job.reqs) {
    const w = r.m ? 2 : 1;
    const level = skillLevel(profile, evidence, r.s).level;
    wsum += w;
    hsum += w * Math.min(level / r.t, 1);
    if (r.m && level < r.t) short.push(r.s);
  }
  const H = wsum ? hsum / wsum : 0;
  const avgs = Object.fromEntries(
    SOFT.map((key) => [
      key,
      sims.length ? sims.reduce((sum, sim) => sum + sim.scores[key], 0) / sims.length : null,
    ]),
  );
  const vals = job.soft.map((k) => avgs[k]).filter((v): v is number => v != null);
  const S = vals.length ? vals.reduce((a, b) => a + (b - 1) / 4, 0) / vals.length : 0.3;
  const yrs = job.years ? Math.min(profile.years / job.years, 1) : 1;
  const langOk = !job.lang || profile.languages.some((l) => new RegExp(job.lang, "i").test(l));
  const E = 0.7 * yrs + 0.3 * (langOk ? 1 : 0);
  const sc = 100 * (0.6 * H + 0.25 * S + 0.15 * E);
  const tiers = {
    entry: { mean: 55, sd: 12 },
    mid: { mean: 62, sd: 11 },
    lead: { mean: 68, sd: 10 },
  };
  const t = tiers[job.tier];
  const pct = Math.round(100 * normalCdf((sc - t.mean) / t.sd));
  const status: "ready" | "almost" | "building" =
    sc >= 80 && !short.length && pct >= 70
      ? "ready"
      : sc >= 70 && short.length <= 1
        ? "almost"
        : "building";
  return { score: Math.round(sc), H, S, E, pct, status, short };
}

export function canEndSimulation(turns: { role: string }[]) {
  return turns.filter((t) => t.role === "user").length >= 2;
}
