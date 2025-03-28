import OrderTaker from "@/app/_components/OrderTaker";
import { api } from "@/trpc/server";

export default async function MenuChoice({
  params,
}: {
  params: Promise<{ menuId: string; restaurantId: string }>;
}) {
  const paramsResult = await params;
  const menuId = parseInt(paramsResult.menuId, 10);
  const restaurantId = parseInt(paramsResult.restaurantId, 10);

  const menu = await api.menuRouter.getMenuById({ restaurantId, menuId });
  const restaurantDetails = await api.restaurantRouter.getRestaurantById({
    id: restaurantId,
  });

  return (
    <div className="h-full w-full">
      <OrderTaker menu={menu} restaurantDetails={restaurantDetails} />
    </div>
  );
}
