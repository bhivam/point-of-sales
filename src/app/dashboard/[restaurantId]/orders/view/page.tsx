import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RouterOutputs } from "@/trpc/react";
import { api } from "@/trpc/server";
import { Separator } from "@radix-ui/react-separator";
import { ChevronRight, Clock, Coffee, User } from "lucide-react";
import Link from "next/link";

type Unpacked<T> = T extends (infer U)[] ? U : T;

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

function calculateOrderTotal(
  order: Unpacked<RouterOutputs["orderRouter"]["getOrders"]>,
) {
  return order.items.reduce((total, item) => {
    const itemPrice = item.menuItem.price;
    const modifiersPrice = item.modifiers.reduce(
      (modTotal, mod) => modTotal + mod.priceAdjustment,
      0,
    );
    return total + itemPrice + modifiersPrice;
  }, 0);
}

function getItemHash(
  item: Unpacked<Unpacked<RouterOutputs["orderRouter"]["getOrders"]>["items"]>,
) {
  return `${item.menuItem.name} ${item.modifiers.map((m) => m.name).join()}  ${item.specialInstructions}`;
}

function summarizeOrderItems(
  items: Unpacked<RouterOutputs["orderRouter"]["getOrders"]>["items"],
) {
  if (items.length === 0) return "No items";
  if (items.length === 1) return `1 x ${getItemHash(items[0]!)}`;

  const itemCounts = items.reduce(
    (acc, item) => {
      const name = getItemHash(item);
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const summary = Object.entries(itemCounts)
    .map(([name, count]) => `${count} × ${name}`)
    .join(", ");

  return summary;
}

export default async function OrdersList({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const restaurantId = parseInt((await params).restaurantId, 10);
  const orders = await api.orderRouter.getOrders({ restaurantId });

  if (!orders || orders.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <h3 className="text-xl font-medium">No orders found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Badge variant="outline" className="text-sm">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => {
          const totalPrice = calculateOrderTotal(order);
          const formattedTotal = formatPrice(totalPrice);
          const formattedDate = new Date(order.createdAt).toLocaleString();
          const itemSummary = summarizeOrderItems(order.items);

          return (
            <Card className="h-full" key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <Badge
                    variant={
                      order.location === "table" ? "default" : "secondary"
                    }
                  >
                    {order.location === "table"
                      ? `Table ${order.tableNumber}`
                      : "To-go"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedDate}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {order.location === "to_go" && (
                    <div className="mb-1 flex items-center text-sm">
                      <User className="mr-1 h-3 w-3" />
                      <span>
                        {order.name} • {order.phone}
                      </span>
                    </div>
                  )}

                  <div className="text-muted-foreground mb-2 flex items-center text-sm">
                    <Coffee className="mr-1 h-3 w-3" />
                    <span>Staff: {order.staff.name || order.staff.email}</span>
                  </div>

                  <Separator />

                  <div className="py-2">
                    <div className="font-medium">Items</div>
                    <div className="mt-1 text-sm">
                      {itemSummary}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-2">
                <div className="text-lg font-bold">${formattedTotal}</div>
                <div className="text-muted-foreground flex items-center text-sm">
                  View Details (Unimplemented)
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
