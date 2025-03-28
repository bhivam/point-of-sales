import { api } from "@/trpc/server";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const restaurantDetails = await api.restaurantRouter.getRestaurantById({
    id: parseInt(restaurantId, 10),
  });

  return (
    <div>
      <pre>{JSON.stringify(restaurantDetails, null, 2)}</pre>
    </div>
  );
}
