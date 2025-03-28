import { auth } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import RestaurantSidebar from "@/app/_components/RestaurantSidebar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const restaurantId = parseInt((await params).restaurantId, 10);


  try {
    const restaurantDetails = await api.restaurantRouter.getRestaurantById({
      id: restaurantId,
    });

    return (
      <div className="flex h-screen flex-col">
        <header className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">{restaurantDetails.name}</h1>
                <p className="text-muted-foreground text-sm">
                  {restaurantDetails.type}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <RestaurantSidebar
            restaurantId={restaurantId}
            initialData={restaurantDetails}
          />

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    redirect("/dashboard");
  }
}
