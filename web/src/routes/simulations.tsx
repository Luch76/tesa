import { createFileRoute } from "@tanstack/react-router";
import { SimulationsPage } from "@/components/tesa/simulations";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/simulations")({
  head: () =>
    leafHead(
      "Practice Arena",
      "Practice realistic Miami workplace situations and build soft-skill evidence.",
    ),
  component: SimulationsPage,
});
