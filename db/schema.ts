import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  cost: integer("cost").notNull().default(0),
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
  tip: integer("tip").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  coupon: text("coupon"),
  split: integer("split").notNull().default(1),
  branch: text("branch").notNull().default("principal"),
  employee: text("employee").notNull().default(""),
  note: text("note"),
  customer_id: text("customer_id"),
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

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  created: text("created").notNull(),
  day: text("day").notNull(),
  items: text("items").notNull(),
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull().default(0),
  branch: text("branch").notNull().default("principal"),
  table_num: text("table_num").notNull().default(""),
  note: text("note"),
  ready_at: text("ready_at"),
  delivered_at: text("delivered_at"),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  visits: integer("visits").notNull().default(0),
  total_spent: integer("total_spent").notNull().default(0),
  created: text("created").notNull(),
  favorite: integer("favorite").notNull().default(0),
});

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"),
  value: integer("value").notNull().default(0),
  uses_left: integer("uses_left").notNull().default(1),
  valid_until: text("valid_until").notNull(),
  active: integer("active").notNull().default(1),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
