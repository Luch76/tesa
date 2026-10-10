import { describe, expect, it } from "vitest";
import { JOBS, SAMPLE_PROFILE, SOFT, type Evidence, type Simulation } from "./data";
import { canEndSimulation, scoreJob, skillLevel } from "./scoring";

describe("brief sample acceptance scores", () => {
  for (const [id, score, status] of [
    ["gem", 79, "almost"],
    ["pe", 57, "building"],
    ["csm", 60, "building"],
    ["pa", 36, "building"],
  ] as const) {
    it(`${id} has exact sample fit`, () => {
      const job = JOBS.find((j) => j.id === id);
      if (!job) throw new Error("Missing sample job");
      expect(scoreJob(job, SAMPLE_PROFILE, [], [])).toMatchObject({ score, status });
    });
  }
  it("4/5 on every dimension gives Guest Experience fit 90, ready, percentile 100", () => {
    const job = JOBS.find((j) => j.id === "gem");
    if (!job) throw new Error("Missing job");
    const sim = { scores: Object.fromEntries(SOFT.map((k) => [k, 4])) } as Simulation;
    expect(scoreJob(job, SAMPLE_PROFILE, [], [sim])).toMatchObject({
      score: 90,
      status: "ready",
      pct: 100,
    });
  });
});

describe("evidence and simulation rules", () => {
  const ev = (level: number, confidence: number): Evidence => ({
    skill: "Insurance Verification",
    job: "pa",
    level,
    confidence,
    quote: "verified policy",
    at: "2026-10-10",
    session: "demo",
  });
  it("two answers at confidence 0.7 earn that level", () => {
    expect(skillLevel(SAMPLE_PROFILE, [ev(3, 0.7)], "Insurance Verification").level).toBe(0);
    expect(
      skillLevel(SAMPLE_PROFILE, [ev(3, 0.7), ev(3, 0.7)], "Insurance Verification").level,
    ).toBe(3);
  });
  it("answers below 0.7 confidence do not count", () => {
    expect(
      skillLevel(SAMPLE_PROFILE, [ev(4, 0.69), ev(4, 0.69)], "Insurance Verification").level,
    ).toBe(0);
  });
  it("evidence never lowers the resume baseline", () => {
    expect(skillLevel(SAMPLE_PROFILE, [], "Hospitality Operations").level).toBe(4);
  });
  it("end and score requires two learner replies", () => {
    expect(canEndSimulation([{ role: "assistant" }, { role: "user" }])).toBe(false);
    expect(canEndSimulation([{ role: "user" }, { role: "user" }])).toBe(true);
  });
});
