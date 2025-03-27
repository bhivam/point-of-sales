import { api } from "@/trpc/server";

export default async function RestaurantPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const restaurantDetails = await api.restaurantRouter.getRestaurantById({
    id: parseInt(restaurantId, 10),
  });

  return (
    <div>
    </div>
  );
}
