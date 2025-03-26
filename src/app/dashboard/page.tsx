import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <main className="min-h-screen"></main>
    </HydrateClient>
  );
}
