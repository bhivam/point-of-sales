import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import RestaurantList from "@/components/restaurant-list";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const restaurants = await api.restaurantRouter.getRestaurants();
  console.log(restaurants);

  return (
    <HydrateClient>
      <main className="container mx-auto py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user?.name}
            </p>
          </div>
          <Button size="lg">
            <Link href="/dashboard/new-restaurant">Add Restaurant</Link>
          </Button>
        </div>

        <Separator className="my-6" />

        {restaurants.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Restaurants Found</CardTitle>
              <CardDescription>
                You don't have any restaurants yet. Create your first restaurant
                to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="mt-4">
                <Link href="/dashboard/new-restaurant">Create Restaurant</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // <RestaurantList restaurants={restaurants} />
          <p>{JSON.stringify(restaurants)}</p>
        )}
      </main>
    </HydrateClient>
  );
}
