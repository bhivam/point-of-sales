import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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
