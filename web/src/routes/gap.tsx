import { createFileRoute } from "@tanstack/react-router";
import { GapPage } from "@/components/tesa/gap";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/gap")({
  head: () =>
    leafHead(
      "Skill gap",
      "Understand your job-specific skill gaps and choose your next learning step.",
    ),
  component: GapPage,
});
