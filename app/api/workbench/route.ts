import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, socialPosts, taskLogs, tasks } from "@/db/schema";

type SaleInput = {
  soldOn: string;
  productName: string;
  sku?: string;
  quantity?: number;
  revenue: number;
  cost: number;
  channel?: string;
  note?: string;
};

function cents(value: number) {
  return Math.round(Number(value || 0) * 100);
}

export async function GET() {
  try {
    const db = getDb();
    const [taskRows, saleRows, productRows, socialRows, logRows] = await Promise.all([
      db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(100),
      db.select().from(sales).orderBy(desc(sales.soldOn), desc(sales.id)).limit(500),
      db.select().from(products).orderBy(desc(products.updatedAt)).limit(200),
      db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(200),
      db.select().from(taskLogs).orderBy(desc(taskLogs.createdAt)).limit(300),
    ]);
    return Response.json({ tasks: taskRows, sales: saleRows, products: productRows, socialPosts: socialRows, taskLogs: logRows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取数据失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const action = String(payload.action || "");
    const db = getDb();

    if (action === "create_task") {
      const title = String(payload.title || "").trim();
      if (!title) return Response.json({ error: "请输入事项名称" }, { status: 400 });
      const [task] = await db.insert(tasks).values({
        title,
        priority: String(payload.priority || "normal"),
        startDate: payload.startDate ? String(payload.startDate) : null,
        endDate: payload.endDate ? String(payload.endDate) : null,
        nextStep: String(payload.nextStep || ""),
        nextStepDate: payload.nextStepDate ? String(payload.nextStepDate) : null,
      }).returning();
      return Response.json({ task }, { status: 201 });
    }

    if (action === "toggle_task") {
      const id = Number(payload.id);
      const completed = Boolean(payload.completed);
      const [task] = await db.update(tasks).set({ completed, progress: completed ? 100 : Number(payload.progress || 0), updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).returning();
      return Response.json({ task });
    }

    if (action === "add_task_log") {
      const taskId = Number(payload.taskId);
      const note = String(payload.note || "").trim();
      const nextStep = String(payload.nextStep || "").trim();
      if (!taskId || !note) return Response.json({ error: "推进记录不能为空" }, { status: 400 });
      const [log] = await db.insert(taskLogs).values({ taskId, note, nextStep }).returning();
      await db.update(tasks).set({ nextStep, progress: Number(payload.progress || 0), nextStepDate: payload.nextStepDate ? String(payload.nextStepDate) : null, updatedAt: new Date().toISOString() }).where(eq(tasks.id, taskId));
      return Response.json({ log }, { status: 201 });
    }

    if (action === "import_sales") {
      const rows = Array.isArray(payload.rows) ? payload.rows as SaleInput[] : [];
      const cleanRows = rows.filter((row) => row.productName && row.soldOn).map((row) => ({
        soldOn: row.soldOn,
        productName: row.productName.trim(),
        sku: row.sku?.trim() || "",
        quantity: Math.max(1, Number(row.quantity || 1)),
        revenueCents: cents(row.revenue),
        costCents: cents(row.cost),
        channel: row.channel?.trim() || "逐光小店",
        note: row.note?.trim() || "",
      }));
      if (!cleanRows.length) return Response.json({ error: "没有可导入的销售记录" }, { status: 400 });
      const inserted = await db.insert(sales).values(cleanRows).returning();
      return Response.json({ imported: inserted.length }, { status: 201 });
    }

    if (action === "upsert_product") {
      const id = Number(payload.id || 0);
      const values = {
        name: String(payload.name || "").trim(),
        sku: String(payload.sku || "").trim(),
        specification: String(payload.specification || "").trim(),
        stockQuantity: Number(payload.stockQuantity || 0),
        unitCostCents: cents(Number(payload.unitCost || 0)),
        salePriceCents: cents(Number(payload.salePrice || 0)),
        lowStockThreshold: Number(payload.lowStockThreshold || 5),
        updatedAt: new Date().toISOString(),
      };
      if (!values.name || !values.sku) return Response.json({ error: "商品名称和 SKU 不能为空" }, { status: 400 });
      const [product] = id
        ? await db.update(products).set(values).where(eq(products.id, id)).returning()
        : await db.insert(products).values(values).returning();
      return Response.json({ product }, { status: id ? 200 : 201 });
    }

    if (action === "create_social_post") {
      const title = String(payload.title || "").trim();
      if (!title) return Response.json({ error: "请输入内容主题" }, { status: 400 });
      const [post] = await db.insert(socialPosts).values({
        platform: String(payload.platform || "douyin"),
        title,
        status: String(payload.status || "idea"),
        plannedAt: payload.plannedAt ? String(payload.plannedAt) : null,
        note: String(payload.note || ""),
      }).returning();
      return Response.json({ post }, { status: 201 });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 500 });
  }
}
