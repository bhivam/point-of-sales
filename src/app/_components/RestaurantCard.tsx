import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DayHours } from "@/server/db/schema";
import { Badge, Building2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { type RouterOutputs } from "@/trpc/react";
import Link from "next/link";

type Unpacked<T> = T extends (infer U)[] ? U : T;
type createRestaurantInput = Unpacked<
  RouterOutputs["restaurantRouter"]["getRestaurants"]
>;

export function RestaurantCard({
  restaurantDetails,
}: {
  restaurantDetails: createRestaurantInput;
}) {
  function getTodaysHours() {
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayKey = today as keyof DayHours;
    const hourRanges = restaurantDetails.openingHours[todayKey];

    if (hourRanges.length === 0) return "Closed";

    // TODO use am/pm
    return hourRanges
      .map(
        (range) =>
          `${range.openHour}:${range.openMinute}-${range.openHour}:${range.openMinute}`,
      )
      .join(", ");
  }

  return (
    <Link href={`dashboard/${restaurantDetails.id}`}>
      <Card className="cursor-pointer transition-shadow duration-500 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-bold">
              {restaurantDetails.name}
            </CardTitle>
            <Badge className={`text-white`}>{restaurantDetails.role}</Badge>
          </div>
          {restaurantDetails.type && (
            <p className="mt-1 flex items-center text-sm text-gray-500">
              <Building2 size={16} className="mr-1" />
              {restaurantDetails.type}
            </p>
          )}
        </CardHeader>

        <CardContent className="pb-2">
          <div className="space-y-2">
            {restaurantDetails.address && (
              <div className="flex items-center text-sm">
                <MapPin
                  size={16}
                  className="mr-2 flex-shrink-0 text-gray-500"
                />
                <span className="line-clamp-1">
                  {restaurantDetails.address}
                </span>
              </div>
            )}

            {restaurantDetails.phone && (
              <div className="flex items-center text-sm">
                <Phone size={16} className="mr-2 flex-shrink-0 text-gray-500" />
                <span>{restaurantDetails.phone}</span>
              </div>
            )}

            {restaurantDetails.email && (
              <div className="flex items-center text-sm">
                <Mail size={16} className="mr-2 flex-shrink-0 text-gray-500" />
                <span className="line-clamp-1">{restaurantDetails.email}</span>
              </div>
            )}

            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-2 flex-shrink-0 text-gray-500" />
              <span>Today: {getTodaysHours()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter />
      </Card>
    </Link>
  );
}
