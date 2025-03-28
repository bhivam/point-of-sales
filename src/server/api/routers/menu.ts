import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  itemModifiers,
  menu,
  menuItems,
  menuSections,
  restaurantStaff,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

// TODO put restaurant id in all objects associated with restaurant to speed up
// the verification process. We shouldn't be doing a length 3 chain of db lookups
// to see what restaurant an item is from

const checkUserAccess = async (
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

const menuSchema = z.object({
  restaurantId: z.number(),
  name: z.string().min(1, "Menu name is required").max(100),
});

const menuSectionSchema = z.object({
  menuId: z.number(),
  name: z.string().min(1, "Section name is required").max(100),
  description: z.string().nonempty(),
  displayOrder: z.number().nonnegative().default(0),
});

const menuItemSchema = z.object({
  sectionId: z.number(),
  name: z.string().min(1, "Item name is required").max(255),
  description: z.string().nonempty(),
  price: z.number().min(0, "Price cannot be negative"),
  displayOrder: z.number().default(0),
  preparationTime: z.number(),
  ingredients: z.array(z.string()),
  allergens: z.array(z.string()),
  dietaryFlags: z.object({
    vegetarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    glutenFree: z.boolean().default(false),
    dairyFree: z.boolean().default(false),
  }),
  image: z.string().optional(),
});

const modifierSchema = z.object({
  menuItemId: z.number(),
  name: z.string().min(1, "Modifier name is required").max(100),
  priceAdjustment: z.number().default(0),
  isDefault: z.boolean().default(false),
});

export const menuRouter = createTRPCRouter({
  addMenu: protectedProcedure
    .input(menuSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId, ["owner", "manager"]);

        const result = await ctx.db
          .insert(menu)
          .values({
            restaurantId: input.restaurantId,
            name: input.name,
          })
          .returning({ id: menu.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create menu",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create menu",
        });
      }
    }),

  modifyMenu: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: menuSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, input.id))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .update(menu)
          .set(input.data)
          .where(eq(menu.id, input.id))
          .returning({ id: menu.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update menu",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update menu",
        });
      }
    }),

  deleteMenu: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, input.id))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .delete(menu)
          .where(eq(menu.id, input.id))
          .returning({ id: menu.id });

        if (!result.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete menu",
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete menu",
        });
      }
    }),

  getMenuById: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        menuId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId);

        const menuRes = await ctx.db
          .select()
          .from(menu)
          .where(
            and(
              eq(menu.restaurantId, input.restaurantId),
              eq(menu.id, input.menuId),
            ),
          )
          .limit(1);

        if (!menuRes.length || !menuRes[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch menu data",
          });
        }

        const sections = await ctx.db
          .select()
          .from(menuSections)
          .where(eq(menuSections.menuId, menuRes[0].id))
          .orderBy(menuSections.displayOrder);

        const sectionsWithItems = await Promise.all(
          sections.map(async (section) => {
            const items = await ctx.db
              .select()
              .from(menuItems)
              .where(eq(menuItems.sectionId, section.id))
              .orderBy(menuItems.displayOrder);

            const itemsWithModifiers = await Promise.all(
              items.map(async (item) => {
                const modifiers = await ctx.db
                  .select()
                  .from(itemModifiers)
                  .where(eq(itemModifiers.menuItemId, item.id));

                return {
                  ...item,
                  modifiers,
                };
              }),
            );

            return {
              ...section,
              items: itemsWithModifiers,
            };
          }),
        );

        return {
          ...menuRes[0],
          sections: sectionsWithItems,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch menu data",
        });
      }
    }),

  getMenus: protectedProcedure
    .input(
      z.object({
        restaurantId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        await checkUserAccess(ctx, input.restaurantId);

        const menus = await ctx.db
          .select()
          .from(menu)
          .where(eq(menu.restaurantId, input.restaurantId))
          .orderBy(menu.name);

        const results = await Promise.all(
          menus.map(async (menu) => {
            const sections = await ctx.db
              .select()
              .from(menuSections)
              .where(eq(menuSections.menuId, menu.id))
              .orderBy(menuSections.displayOrder);

            const sectionsWithItems = await Promise.all(
              sections.map(async (section) => {
                const items = await ctx.db
                  .select()
                  .from(menuItems)
                  .where(eq(menuItems.sectionId, section.id))
                  .orderBy(menuItems.displayOrder);

                const itemsWithModifiers = await Promise.all(
                  items.map(async (item) => {
                    const modifiers = await ctx.db
                      .select()
                      .from(itemModifiers)
                      .where(eq(itemModifiers.menuItemId, item.id));

                    return {
                      ...item,
                      modifiers,
                    };
                  }),
                );

                return {
                  ...section,
                  items: itemsWithModifiers,
                };
              }),
            );

            return {
              ...menu,
              sections: sectionsWithItems,
            };
          }),
        );

        return results;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch menu data",
        });
      }
    }),

  addSection: protectedProcedure
    .input(menuSectionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, input.menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .insert(menuSections)
          .values({
            menuId: input.menuId,
            name: input.name,
            description: input.description,
            displayOrder: input.displayOrder,
          })
          .returning({ id: menuSections.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create menu section",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create menu section",
        });
      }
    }),

  modifySection: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: menuSectionSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, input.id))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .update(menuSections)
          .set(input.data)
          .where(eq(menuSections.id, input.id))
          .returning({ id: menuSections.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update menu section",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update menu section",
        });
      }
    }),

  removeSection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, input.id))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .delete(menuSections)
          .where(eq(menuSections.id, input.id))
          .returning({ id: menuSections.id });

        if (!result.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete menu section",
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete menu section",
        });
      }
    }),

  addItem: protectedProcedure
    .input(menuItemSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, input.sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .insert(menuItems)
          .values({
            sectionId: input.sectionId,
            name: input.name,
            description: input.description,
            price: input.price,
            displayOrder: input.displayOrder,
            preparationTime: input.preparationTime,
            ingredients: input.ingredients,
            allergens: input.allergens,
            dietaryFlags: input.dietaryFlags,
            image: input.image,
          })
          .returning({ id: menuItems.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create menu item",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create menu item",
        });
      }
    }),

  modifyItem: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: menuItemSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const itemData = await ctx.db
          .select({
            sectionId: menuItems.sectionId,
          })
          .from(menuItems)
          .where(eq(menuItems.id, input.id))
          .limit(1);

        if (!itemData.length || !itemData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Menu item not found",
          });
        }

        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, itemData[0].sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .update(menuItems)
          .set(input.data)
          .where(eq(menuItems.id, input.id))
          .returning({ id: menuItems.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update menu item",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update menu item",
        });
      }
    }),

  removeItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const itemData = await ctx.db
          .select({
            sectionId: menuItems.sectionId,
          })
          .from(menuItems)
          .where(eq(menuItems.id, input.id))
          .limit(1);

        if (!itemData.length || !itemData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Menu item not found",
          });
        }

        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, itemData[0].sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .delete(menuItems)
          .where(eq(menuItems.id, input.id))
          .returning({ id: menuItems.id });

        if (!result.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete menu item",
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete menu item",
        });
      }
    }),

  addModifier: protectedProcedure
    .input(modifierSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const itemData = await ctx.db
          .select({
            sectionId: menuItems.sectionId,
          })
          .from(menuItems)
          .where(eq(menuItems.id, input.menuItemId))
          .limit(1);

        if (!itemData.length || !itemData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Menu item not found",
          });
        }

        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, itemData[0].sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .insert(itemModifiers)
          .values({
            menuItemId: input.menuItemId,
            name: input.name,
            priceAdjustment: input.priceAdjustment,
            isDefault: input.isDefault,
          })
          .returning({ id: itemModifiers.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create modifier",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create modifier",
        });
      }
    }),

  modifyModifier: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: modifierSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const modifierData = await ctx.db
          .select({
            menuItemId: itemModifiers.menuItemId,
          })
          .from(itemModifiers)
          .where(eq(itemModifiers.id, input.id))
          .limit(1);

        if (!modifierData.length || !modifierData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modifier not found",
          });
        }

        const itemData = await ctx.db
          .select({
            sectionId: menuItems.sectionId,
          })
          .from(menuItems)
          .where(eq(menuItems.id, modifierData[0].menuItemId))
          .limit(1);

        if (!itemData.length || !itemData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Menu item not found",
          });
        }

        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, itemData[0].sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .update(itemModifiers)
          .set(input.data)
          .where(eq(itemModifiers.id, input.id))
          .returning({ id: itemModifiers.id });

        if (!result.length || !result[0]) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update modifier",
          });
        }

        return { id: result[0].id };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update modifier",
        });
      }
    }),

  removeModifier: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const modifierData = await ctx.db
          .select({
            menuItemId: itemModifiers.menuItemId,
          })
          .from(itemModifiers)
          .where(eq(itemModifiers.id, input.id))
          .limit(1);

        if (!modifierData.length || !modifierData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Modifier not found",
          });
        }

        const itemData = await ctx.db
          .select({
            sectionId: menuItems.sectionId,
          })
          .from(menuItems)
          .where(eq(menuItems.id, modifierData[0].menuItemId))
          .limit(1);

        if (!itemData.length || !itemData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Menu item not found",
          });
        }

        const sectionData = await ctx.db
          .select({
            menuId: menuSections.menuId,
          })
          .from(menuSections)
          .where(eq(menuSections.id, itemData[0].sectionId))
          .limit(1);

        if (!sectionData.length || !sectionData[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Section not found",
          });
        }

        const menuData = await ctx.db
          .select({ restaurantId: menu.restaurantId })
          .from(menu)
          .where(eq(menu.id, sectionData[0].menuId))
          .limit(1);

        if (!menuData.length || !menuData[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Menu not found" });
        }

        await checkUserAccess(ctx, menuData[0].restaurantId, [
          "owner",
          "manager",
        ]);

        const result = await ctx.db
          .delete(itemModifiers)
          .where(eq(itemModifiers.id, input.id))
          .returning({ id: itemModifiers.id });

        if (!result.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete modifier",
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete modifier",
        });
      }
    }),
}););
