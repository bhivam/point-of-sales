import { restaurantStaff } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const checkUserAccess = async (
  ctx: any,
  restaurantId: number,
  requiredRoles: ("owner" | "manager" | "server")[] = [
    "owner",
    "manager",
    "server",
  ],
) => {
  const userId = ctx.session.user.id;

  const userAccess = await ctx.db
    .select({
      activated: restaurantStaff.activated,
      role: restaurantStaff.role,
    })
    .from(restaurantStaff)
    .where(
      and(
        eq(restaurantStaff.userId, userId),
        eq(restaurantStaff.restaurantId, restaurantId),
      ),
    )
    .limit(1);

  if (!userAccess.length || !userAccess[0]?.activated) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this restaurant",
    });
  }

  const role = userAccess[0].role;
  if (!requiredRoles.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to perform this action",
    });
  }

  return role;
};
