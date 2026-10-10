import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/tesa/portfolio";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/portfolio")({
  head: () =>
    leafHead(
      "Proof portfolio",
      "Review and export your resume, skill evidence, and workplace practice.",
    ),
  component: PortfolioPage,
});
