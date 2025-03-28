import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { checkUserAccess } from "@/server/api/util";
import { orderItems, orderItemsToModifiers, orders } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const orderItemSchema = z.object({
  restaurantId: z.number(),
  menuItemId: z.number(),
  restaurantStaffId: z.number(),
  orderId: z.number(),
  specialInstructions: z.string().optional(),
  modifierIds: z.number().array(),
});

const orderSchema = z.object({
  location: z.enum(["table", "to_go"]),
  tableNumber: z.number().optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number format")
    .optional(),
  name: z.string().optional(),
  restaurantId: z.number(),
  restaurantStaffId: z.number(),
  orderItems: orderItemSchema.omit({ orderId: true }).array(),
});

export const orderRouter = createTRPCRouter({
  addOrder: protectedProcedure
    .input(orderSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId, [
          "owner",
          "manager",
          "server",
        ]);

        switch (input.location) {
          case "table":
            if (!input.tableNumber)
              throw new TRPCError({
                message: "if location table, must have table number",
                code: "UNPROCESSABLE_CONTENT",
              });
            break;
          case "to_go":
            if (!input.name || !input.phone)
              throw new TRPCError({
                message: "if location to_go, must have name and phone",
                code: "UNPROCESSABLE_CONTENT",
              });
            break;
        }

        const result = await ctx.db
          .insert(orders)
          .values({
            location: input.location,
            tableNumber: input.tableNumber,
            phone: input.phone,
            name: input.name,
            restaurantId: input.restaurantId,
            restaurantStaffId: input.restaurantStaffId,
          })
          .returning({ id: orders.id });

        if (!result.length || !result[0]) {
          throw new Error("Failed to create order");
        }

        const orderItemsResult = await ctx.db
          .insert(orderItems)
          .values(
            input.orderItems.map((input) => ({
              restaurantId: input.restaurantId,
              menuItemId: input.menuItemId,
              restaurantStaffId: input.restaurantStaffId,
              orderId: result[0]!.id,
              specialInstructions: input.specialInstructions,
            })),
          )
          .returning({ id: orderItems.id });

        console.log(orderItemsResult);

        if (orderItemsResult.length !== input.orderItems.length) {
          throw new Error("Failed to create orderItems");
        }

        await ctx.db.insert(orderItemsToModifiers).values(
          input.orderItems
            .map((input, i) =>
              input.modifierIds.map((modifierId) => ({
                orderItemId: orderItemsResult[i]!.id,
                modifierId,
              })),
            )
            .flat(),
        );

        return result[0].id;
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order " + e,
        });
      }
    }),

  addOrderItem: protectedProcedure
    .input(orderItemSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId, [
          "owner",
          "manager",
          "server",
        ]);

        const result = await ctx.db
          .insert(orderItems)
          .values({
            restaurantId: input.restaurantId,
            menuItemId: input.menuItemId,
            restaurantStaffId: input.restaurantStaffId,
            orderId: input.orderId,
            specialInstructions: input.specialInstructions,
          })
          .returning({ id: orderItems.id });

        if (!result.length || !result[0]) {
          throw new Error("Failed to create orderItem");
        }

        await ctx.db.insert(orderItemsToModifiers).values(
          input.modifierIds.map((modifierId) => ({
            orderItemId: result[0]!.id,
            modifierId,
          })),
        );

        return result[0].id;
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  getOrders: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId, [
          "owner",
          "manager",
          "server",
        ]);

        const allOrders = await ctx.db.query.orders.findMany({
          where: eq(orders.restaurantId, input.restaurantId),
          with: {
            restaurantStaff: {
              with: {
                user: true,
              },
            },
            items: {
              with: {
                menuItem: true,
                orderItemsToModifiers: {
                  with: {
                    itemModifier: true,
                  },
                },
              },
            },
          },
        });

        return allOrders.map((order) => ({
          id: order.id,
          location: order.location,
          tableNumber: order.tableNumber,
          phone: order.phone,
          name: order.name,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          staff: {
            id: order.restaurantStaff.id,
            name: order.restaurantStaff.user.name,
            email: order.restaurantStaff.user.email,
          },
          items: order.items.map((item) => ({
            id: item.id,
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
              description: item.menuItem.description,
            },
            specialInstructions: item.specialInstructions,
            createdAt: item.createdAt,
            modifiers: item.orderItemsToModifiers.map((rel) => ({
              id: rel.itemModifier.id,
              name: rel.itemModifier.name,
              priceAdjustment: rel.itemModifier.priceAdjustment,
            })),
          })),
        }));
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders: " + e,
        });
      }
    }),
});
