import { z } from "zod";

// TODO can use that inputs outputs thing so move this back to restaurant router later

export const HoursSchema = z
  .array(
    z.object({
      openHour: z.number().min(0).max(23),
      openMinute: z.number().min(0).max(59),
      closeHour: z.number().min(0).max(23),
      closeMinute: z.number().min(0).max(59),
    }),
  )
  .default([]);

export const restaurantInputSchema = z.object({
  name: z
    .string()
    .min(1, "Restaurant name is required")
    .max(255, "Name cannot exceed 255 characters"),
  type: z.string().max(100, "Type cannot exceed 100 characters").nonempty(),
  address: z.string().nonempty(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number format")
    .nonempty(),
  email: z.string().email("Invalid email address").max(255).nonempty(),
  taxRate: z.number().min(0, "Tax rate cannot be negative").default(0.0),
  openingHours: z
    .object({
      monday: HoursSchema,
      tuesday: HoursSchema,
      wednesday: HoursSchema,
      thursday: HoursSchema,
      friday: HoursSchema,
      saturday: HoursSchema,
      sunday: HoursSchema,
    })
    .default({
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }),
});
