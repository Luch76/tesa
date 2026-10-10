import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/tesa/profile";
import { leafHead } from "@/components/tesa/shared";
export const Route = createFileRoute("/")({
  head: () =>
    leafHead(
      "My profile",
      "Explore your transferable skills and top matching Miami jobs, then plan your next career move.",
    ),
  component: ProfilePage,
});
