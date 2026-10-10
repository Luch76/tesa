import { createFileRoute } from "@tanstack/react-router";
import { JobsPage } from "@/components/tesa/jobs";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/jobs")({
  head: () =>
    leafHead("Miami jobs", "Compare 15 sample Miami jobs by fit, pay, sector, and neighborhood."),
  component: JobsPage,
});
