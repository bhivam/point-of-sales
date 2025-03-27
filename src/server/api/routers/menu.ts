import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

const menuSchema = z.object({
  restaurantId: z.number(),
  name: z.string().min(1, "Menu name is required").max(100),
  isActive: z.boolean().default(true),
});

const menuSectionSchema = z.object({
  menuId: z.number(),
  name: z.string().min(1, "Section name is required").max(100),
  description: z.string().nonempty(),
  displayOrder: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
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
  isAvailable: z.boolean().default(true),
});

const modifierSchema = z.object({
  menuItemId: z.number(),
  name: z.string().min(1, "Modifier name is required").max(100),
  priceAdjustment: z.number().default(0),
  isDefault: z.boolean().default(false),
});

export const menuRouter = createTRPCRouter({
  // addMenu
  // modifyMenu
  // deleteMenu (delete cascades to all sections, items, modifiers)
  // getMenu -> will grab menu, sections, and items
  // addSection
  // modifySection
  // removeSection (delete cascades to all items, modifiers)
  // addItem
  // modifyItem
  // removeItem (will remove all modifiers)
  // addModifier
  // modifyModifier
  // removeModifier
});
