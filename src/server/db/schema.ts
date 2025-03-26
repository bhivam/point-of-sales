import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `point-of-sales_${name}`);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// POS SYSTEM TABLES

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "manager",
  "server",
  "kitchen",
]);

// empty means closed for the day
type Hours = {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}[];

type DayHours = {
  monday: Hours;
  tuesday: Hours;
  wednesday: Hours;
  thursday: Hours;
  friday: Hours;
  saturday: Hours;
  sunday: Hours;
};

export const restaurants = createTable(
  "restaurant",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 255 }).notNull(),
    type: d.varchar({ length: 100 }),
    address: d.text(),
    phone: d.varchar({ length: 20 }),
    email: d.varchar({ length: 255 }),
    taxRate: d.real().default(0.0),
    openingHours: d.json().$type<DayHours>(),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("restaurant_created_by_idx").on(t.createdById),
    index("restaurant_name_idx").on(t.name),
  ],
);

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  creator: one(users, {
    fields: [restaurants.createdById],
    references: [users.id],
  }),
  staff: many(restaurantStaff),
  menus: many(menu),
}));

export const restaurantStaff = createTable("restaurant_staff", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  restaurantId: d
    .integer()
    .notNull()
    .references(() => restaurants.id),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  role: userRoleEnum().notNull().default("server"),
  isActive: d.boolean().default(true),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const restaurantStaffRelations = relations(
  restaurantStaff,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [restaurantStaff.restaurantId],
      references: [restaurants.id],
    }),
    user: one(users, {
      fields: [restaurantStaff.userId],
      references: [users.id],
    }),
  }),
);

export const menu = createTable("menu", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  restaurantId: d
    .integer()
    .notNull()
    .references(() => restaurants.id),
  name: d.varchar({ length: 100 }).notNull(),
  hoursActive: d.json().$type<DayHours>(), // can prefer menu at particular times
  isActive: d.boolean().default(true),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const menuRelations = relations(menu, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menu.restaurantId],
    references: [restaurants.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItems = createTable("menu_item", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  categoryId: d
    .integer()
    .notNull()
    .references(() => menu.id),
  name: d.varchar({ length: 255 }).notNull(),
  description: d.text(),
  price: d.real().notNull(),
  preparationTime: d.integer(), // in minutes
  ingredients: d.json().$type<string[]>(),
  allergens: d.json().$type<string[]>(),
  dietaryFlags: d.json().$type<{
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
  }>(),
  image: d.varchar({ length: 255 }),
  isAvailable: d.boolean().default(true),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  menus: many(menu),
  modifiers: many(itemModifiers),
}));

export const itemModifiers = createTable(
  "item_modifier",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    menuItemId: d
      .integer()
      .notNull()
      .references(() => menuItems.id),
    name: d.varchar({ length: 100 }).notNull(),
    priceAdjustment: d.real().default(0.0),
    isDefault: d.boolean().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("modifier_item_idx").on(t.menuItemId)],
);

export const itemModifiersRelations = relations(itemModifiers, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [itemModifiers.menuItemId],
    references: [menuItems.id],
  }),
}));
