import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  active: integer("active").notNull().default(1),
  photo: text("photo"),
  category: text("category").notNull().default("Geral"),
  stock: integer("stock").notNull().default(-1),
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  created: text("created").notNull(),
  day: text("day").notNull(),
  lines: text("lines").notNull(),
  payment: text("payment").notNull(),
  total: integer("total").notNull(),
  received: integer("received").notNull(),
  branch: text("branch").notNull().default("principal"),
  employee: text("employee").notNull().default(""),
  note: text("note"),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  day: text("day").notNull(),
  merchant: text("merchant").notNull(),
  amount: integer("amount").notNull(),
  receipt: text("receipt"),
  created: text("created").notNull(),
  branch: text("branch").notNull().default("principal"),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("caixa"),
  branch: text("branch").notNull().default("principal"),
  active: integer("active").notNull().default(1),
});

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  active: integer("active").notNull().default(1),
});
