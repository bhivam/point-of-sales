import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { restaurants, restaurantStaff } from "@/server/db/schema";
import { z } from "zod";

const HoursSchema = z.array(
  z.object({
    openHour: z.number().min(0).max(23),
    openMinute: z.number().min(0).max(59),
    closeHour: z.number().min(0).max(23),
    closeMinute: z.number().min(0).max(59),
  }),
);

export const restaurantRouter = createTRPCRouter({
  getRestaurants: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const restaurantsResult = await ctx.db
      .select({
        restaurant: restaurants,
        role: restaurantStaff.role,
        staffId: restaurantStaff.id,
        isActive: restaurantStaff.isActive,
      })
      .from(restaurants)
      .innerJoin(
        restaurantStaff,
        eq(restaurants.id, restaurantStaff.restaurantId),
      )
      .where(eq(restaurantStaff.userId, userId));

    const result = restaurantsResult.map(
      ({ restaurant, role, staffId, isActive }) => ({
        ...restaurant,
        role,
        staffId,
        isActive,
      }),
    );

    return result;
  }),
  createRestaurant: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, "Restaurant name is required")
          .max(255, "Name cannot exceed 255 characters"),
        type: z.string().max(100, "Type cannot exceed 100 characters"),
        address: z.string(),
        phone: z.string().regex(/^[0-9]{10}$/, "Invalid phone number format"),
        email: z.string().email("Invalid email address").max(255),
        taxRate: z.number().min(0, "Tax rate cannot be negative").default(0.0),
        openingHours: z.object({
          monday: HoursSchema,
          tuesday: HoursSchema,
          wednesday: HoursSchema,
          thursday: HoursSchema,
          friday: HoursSchema,
          saturday: HoursSchema,
          sunday: HoursSchema,
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db.insert(restaurants).values({
        name: input.name,
        type: input.type,
        address: input.address,
        phone: input.phone,
        email: input.email,
        taxRate: input.taxRate,
        openingHours: input.openingHours,
        createdById: ctx.session.user.id,
      });

      return res.length > 0;
    }),
});
