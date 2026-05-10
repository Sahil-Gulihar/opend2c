// drizzle schema — add tables here as needed
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigserial,
} from "drizzle-orm/pg-core";

// ── better-auth required tables ─────────────────────────────────────────────

export const customerUser = pgTable("customer_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const customerSession = pgTable("customer_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => customerUser.id, { onDelete: "cascade" }),
});

export const customerAccount = pgTable("customer_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => customerUser.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const customerVerification = pgTable("customer_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ── Wishlist ─────────────────────────────────────────────────────────────────

export const wishlist = pgTable("wishlist", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => customerUser.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(),  // references scraper_products.id in main DB
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  image: text("image"),
  shop: text("shop").notNull(),
  price: text("price"),
  currency: text("currency"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
