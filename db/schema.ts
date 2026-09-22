import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  specification: text("specification").notNull().default(""),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  unitCostCents: integer("unit_cost_cents").notNull().default(0),
  salePriceCents: integer("sale_price_cents").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_products_sku").on(table.sku)]);

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  soldOn: text("sold_on").notNull(),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  revenueCents: integer("revenue_cents").notNull(),
  costCents: integer("cost_cents").notNull(),
  channel: text("channel").notNull().default("逐光小店"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_sales_sold_on").on(table.soldOn)]);

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  priority: text("priority").notNull().default("normal"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  progress: integer("progress").notNull().default(0),
  nextStep: text("next_step").notNull().default(""),
  nextStepDate: text("next_step_date"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_tasks_completed_end_date").on(table.completed, table.endDate)]);

export const taskLogs = sqliteTable("task_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  nextStep: text("next_step").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_task_logs_task_id_created_at").on(table.taskId, table.createdAt)]);

export const socialPosts = sqliteTable("social_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("idea"),
  plannedAt: text("planned_at"),
  publishedAt: text("published_at"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  followersDelta: integer("followers_delta").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_social_posts_platform_planned_at").on(table.platform, table.plannedAt)]);
