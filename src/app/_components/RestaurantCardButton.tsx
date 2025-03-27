"use client";

import { RestaurantCard } from "@/app/_components/RestaurantCard";
import { type RouterOutputs } from "@/trpc/react";

type Unpacked<T> = T extends (infer U)[] ? U : T;
type createRestaurantInput = Unpacked<
  RouterOutputs["restaurantRouter"]["getRestaurants"]
>;

export function RestaurantCardbutton({
  restaurantDetails,
}: {
  restaurantDetails: createRestaurantInput;
}) {
  return (
    <div onClick={() => {}}>
      <RestaurantCard restaurantDetails={restaurantDetails} />
    </div>
  );
}
