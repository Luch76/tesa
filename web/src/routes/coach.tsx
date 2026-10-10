import { createFileRoute } from "@tanstack/react-router";
import { CoachPage } from "@/components/tesa/coach";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/coach")({
  validateSearch: (search: Record<string, unknown>): { mode: "coach" | "tutor" } => ({
    mode: search["mode"] === "tutor" ? "tutor" : "coach",
  }),
  head: () =>
    leafHead(
      "Personal career coach",
      "Plan your next career move and build job-specific skills with coaching and Socratic tutoring.",
    ),
  component: CoachPage,
});
