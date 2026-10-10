import { createFileRoute, redirect } from "@tanstack/react-router";
import { TutorPage } from "@/components/tesa/learning-chat";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/tutor")({
  beforeLoad: () => {
    throw redirect({ to: "/coach", search: { mode: "tutor" }, replace: true });
  },
  head: () =>
    leafHead(
      "Socratic tutor",
      "Build job-specific skills with guided questions and Bloom-level progress.",
    ),
  component: TutorPage,
});
