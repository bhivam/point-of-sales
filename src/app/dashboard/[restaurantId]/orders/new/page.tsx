import { api } from "@/trpc/server";
import Link from "next/link";
import React from "react";

export default async function MenuChoice({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const restaurantId = parseInt((await params).restaurantId, 10);
  const restaurantDetails = await api.restaurantRouter.getRestaurantById({
    id: restaurantId,
  });
  const menus = await api.menuRouter.getMenus({ restaurantId });

  return (
    <div className="grid h-full w-full grid-cols-3 gap-2">
      {menus.map((menu) => (
        <Link href={`/dashboard/1/orders/new/${menu.id}`}>
          <div className="bg-secondary flex h-full w-full items-center justify-center rounded-md hover:bg-primary cursor-pointer">
            <h1 className="text-2xl font-bold">{menu.name}</h1>
          </div>
        </Link>
      ))}
    </div>
  );
}
