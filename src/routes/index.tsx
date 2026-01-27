import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (session.isLoggedIn) {
      throw redirect({ to: "/pos" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
  component: () => null,
});