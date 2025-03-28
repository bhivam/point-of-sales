import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { checkUserAccess } from "@/server/api/util";
import { z } from "zod";

const orderSchema = z.object({
  restaurantId: z.number()
})

export const orderRouter = createTRPCRouter({
  addOrder: protectedProcedure
    .input(orderSchema) 
    .mutation(async ({ctx, input}) => {
      try {
        await checkUserAccess(ctx, input.restaurantId, ["owner", "manager", "server"])
      }
    })
})
