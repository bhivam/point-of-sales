import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

// Import shadcn components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-extrabold">
              Restaurant POS
            </CardTitle>
            <CardDescription className="mt-3 text-xl">
              A complete point of sales system for restaurants. Manage your
              menu, staff, orders, and tables all in one place.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-6">
            {session ? (
              <>
                <p className="px-4 py-2 text-lg">
                  Welcome back,{" "}
                  <span className="ml-1 font-semibold">
                    {session.user?.name}
                  </span>
                </p>

                <div className="mt-4 flex gap-4">
                  <Button size="lg" className="hover:bg-primary/90">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>

                  <Button variant="outline" size="lg">
                    <Link href="/api/auth/signout">Sign out</Link>
                  </Button>
                </div>
              </>
            ) : (
              <Button size="lg" className="hover:bg-primary/90">
                <Link href="/api/auth/signin">Sign in</Link>
              </Button>
            )}
          </CardContent>

          <Separator className="my-2" />

          <CardFooter className="flex justify-center">
            <p className="text-center text-sm">
              Need help getting started? Contact our support team at{" "}
              <Link
                href=""
                className="font-medium underline underline-offset-4"
              >
                fake@email.com
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </HydrateClient>
  );
}
