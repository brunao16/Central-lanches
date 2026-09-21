import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  active: integer("active").notNull().default(1),
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  created: text("created").notNull(),
  day: text("day").notNull(),
  lines: text("lines").notNull(),
  payment: text("payment").notNull(),
  total: integer("total").notNull(),
  received: integer("received").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  merchant: text("merchant").notNull(),
  amount: integer("amount").notNull(),
  receipt: text("receipt"),
  created: text("created").notNull(),
});
