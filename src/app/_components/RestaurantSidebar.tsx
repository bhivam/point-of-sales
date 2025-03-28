"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CreditCard,
  Home,
  Settings,
  Users,
  Clock,
  Receipt,
  ShoppingBag,
  FileText,
  CalendarClock,
  Utensils,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { api } from "@/trpc/react";
import { type RouterOutputs } from "@/trpc/react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type RestaurantData = RouterOutputs["restaurantRouter"]["getRestaurantById"];

export default function RestaurantSidebar({
  restaurantId,
  initialData,
}: {
  restaurantId: number;
  initialData: RestaurantData;
}) {
  const pathname = usePathname();

  const restaurantDetails = api.restaurantRouter.getRestaurantById.useQuery(
    { id: restaurantId },
    {
      initialData,
      staleTime: 30 * 1000,
    },
  );

  const isActive = (path: string) => {
    return pathname === path;
  };

  const basePath = `/dashboard/${restaurantId}`;

  const navigationItems = [
    {
      category: "General",
      items: [
        {
          name: "Dashboard",
          href: basePath,
          icon: Home,
          roles: ["owner", "manager", "server"],
        },
      ],
    },
    {
      category: "Operations",
      items: [
        {
          name: "Place Order",
          href: `${basePath}/orders/new`,
          icon: ShoppingBag,
          roles: ["owner", "manager", "server"],
        },
        {
          name: "View Orders",
          href: `${basePath}/orders/view`,
          icon: Clock,
          roles: ["owner", "manager", "server"],
        },
      ],
    },
    {
      category: "Management",
      items: [
        {
          name: "Menu Editor",
          href: `${basePath}/menu`,
          icon: Utensils,
          roles: ["owner", "manager", "server"],
        },
        {
          name: "Staff",
          href: `${basePath}/staff`,
          icon: Users,
          roles: ["owner", "manager", "server"],
        },
      ],
    },
  ];

  return (
    <nav className="bg-sidebar w-64 flex-shrink-0 overflow-y-auto border-r">
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Navigation</h2>
          <Badge className="text-xs">{restaurantDetails.data.role}</Badge>
        </div>
        <Separator className="my-2" />

        <div className="space-y-6">
          {navigationItems.map((group) => (
            <div key={group.category}>
              <h3 className="text-gray-700 mb-3 text-xs font-medium uppercase">
                {group.category}
              </h3>
              <ul className="space-y-1">
                {group.items
                  .filter((item) =>
                    item.roles.includes(restaurantDetails.data.role),
                  )
                  .map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        {isActive(item.href) && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
