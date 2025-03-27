import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { restaurants, restaurantStaff } from "@/server/db/schema";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { restaurantInputSchema } from "@/server/api/zod-schemas";

// Create a common restaurant object schema
export const restaurantRouter = createTRPCRouter({
  // Get all restaurants (with pagination)
  getRestaurants: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Build query with pagination
      const query = ctx.db
        .select({
          restaurant: restaurants,
          role: restaurantStaff.role,
          staffId: restaurantStaff.id,
          activated: restaurantStaff.activated,
        })
        .from(restaurants)
        .innerJoin(
          restaurantStaff,
          eq(restaurants.id, restaurantStaff.restaurantId),
        )
        .where(eq(restaurantStaff.userId, userId))
        .orderBy(restaurants.name);

      const restaurantsResult = await query;

      const result = restaurantsResult.map(
        ({ restaurant, role, staffId, activated }) => ({
          ...restaurant,
          role,
          staffId,
          activated,
        }),
      );

      return result;
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch restaurants",
      });
    }
  }),

  // Get a single restaurant by ID
  getRestaurantById: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const restaurantAccess = await ctx.db
          .select({
            activated: restaurantStaff.activated,
            role: restaurantStaff.role,
          })
          .from(restaurantStaff)
          .where(
            and(
              eq(restaurantStaff.userId, userId),
              eq(restaurantStaff.restaurantId, input.id),
            ),
          )
          .limit(1);

        if (!restaurantAccess.length || !restaurantAccess[0]?.activated) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this restaurant",
          });
        }

        const restaurantResult = await ctx.db
          .select()
          .from(restaurants)
          .where(eq(restaurants.id, input.id))
          .limit(1);

        if (!restaurantResult.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          });
        }

        return {
          ...restaurantResult[0],
          role: restaurantAccess[0]?.role,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch restaurant details",
        });
      }
    }),

  // Create a new restaurant
  createRestaurant: protectedProcedure
    .input(restaurantInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Add validation to hours
      try {
        // Create the restaurant
        const result = await ctx.db.transaction(async (tx) => {
          // Insert restaurant record
          const restaurantResult = await tx
            .insert(restaurants)
            .values({
              name: input.name,
              type: input.type,
              address: input.address,
              phone: input.phone,
              email: input.email,
              taxRate: input.taxRate,
              openingHours: input.openingHours,
              createdById: ctx.session.user.id,
            })
            .returning({ id: restaurants.id });

          if (restaurantResult.length === 0 || !restaurantResult[0]) {
            throw new Error("Failed to create restaurant");
          }

          const restaurantId = restaurantResult[0].id;

          // Add creator as owner
          await tx.insert(restaurantStaff).values({
            restaurantId: restaurantId,
            userId: ctx.session.user.id,
            role: "owner",
            activated: true,
          });

          return restaurantId;
        });

        return { id: result };
      } catch (error) {
        console.error("Error creating restaurant:", error);
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create restaurant",
        });
      }
    }),

  // Update an existing restaurant
  updateRestaurant: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: restaurantInputSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Verify user has permission to update this restaurant
        const userAccess = await ctx.db
          .select({
            role: restaurantStaff.role,
            activated: restaurantStaff.activated,
          })
          .from(restaurantStaff)
          .where(
            and(
              eq(restaurantStaff.userId, userId),
              eq(restaurantStaff.restaurantId, input.id),
            ),
          )
          .limit(1);

        if (!userAccess.length || !userAccess[0]?.activated) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this restaurant",
          });
        }

        const userRole = userAccess[0].role;
        if (userRole !== "owner" && userRole !== "manager") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this restaurant",
          });
        }

        const result = await ctx.db
          .update(restaurants)
          .set({
            ...input.data,
          })
          .where(eq(restaurants.id, input.id))
          .returning({ id: restaurants.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          });
        }

        return { success: true, id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating restaurant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update restaurant",
        });
      }
    }),
});
