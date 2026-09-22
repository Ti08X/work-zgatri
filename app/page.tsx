"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  CheckSquare2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  Megaphone,
  Moon,
  Plus,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const navItems = [
  { id: "dashboard", label: "总览", icon: LayoutDashboard },
  { id: "sales", label: "销售看台", icon: CircleDollarSign },
  { id: "tasks", label: "待办事项", icon: CheckSquare2 },
  { id: "media", label: "新媒体运营", icon: Megaphone },
];

type ViewId = (typeof navItems)[number]["id"];
type TaskRecord = { id: number; title: string; priority: string; startDate: string | null; endDate: string | null; progress: number; nextStep: string; nextStepDate: string | null; completed: boolean };
type SaleRecord = { id: number; soldOn: string; productName: string; sku: string; quantity: number; revenueCents: number; costCents: number; channel: string; note: string };
type ProductRecord = { id: number; name: string; sku: string; specification: string; stockQuantity: number; unitCostCents: number; salePriceCents: number; lowStockThreshold: number };
type TaskLog = { id: number; taskId: number; note: string; nextStep: string; createdAt: string };
type WorkbenchData = { tasks: TaskRecord[]; sales: SaleRecord[]; products: ProductRecord[]; taskLogs: TaskLog[] };

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [data, setData] = useState<WorkbenchData>({ tasks: [], sales: [], products: [], taskLogs: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [progressTask, setProgressTask] = useState<TaskRecord | null>(null);
  const [csvText, setCsvText] = useState("");
  const [today] = useState(() => localDate(0));
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/workbench");
      const result = await response.json() as WorkbenchData & { error?: string };
      if (!response.ok) throw new Error(result.error || "读取数据失败");
      setData(result);
    } catch {
      setMessage("本地数据库正在准备，当前显示结构预览。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedTheme = sessionStorage.getItem("zgatri-work-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else {
        const hour = new Date().getHours();
        setTheme(hour >= 7 && hour < 22 ? "light" : "dark");
      }
      void refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.workbenchTheme = theme;
    return () => {
      delete document.documentElement.dataset.workbenchTheme;
    };
  }, [theme]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    sessionStorage.setItem("zgatri-work-theme", next);
  }

  async function send(payload: Record<string, unknown>) {
    const response = await fetch("/api/workbench", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string; imported?: number };
    if (!response.ok) throw new Error(result.error || "保存失败");
    await refresh();
    return result;
  }

  const activeLabel = navItems.find((item) => item.id === activeView)?.label || "经营总览";
  const yesterday = today ? addDays(today, -1) : "";
  const yesterdaySales = data.sales.filter((sale) => sale.soldOn === yesterday);
  const yesterdayTotals = yesterdaySales.reduce((sum, row) => ({ orders: sum.orders + row.quantity, revenue: sum.revenue + row.revenueCents, profit: sum.profit + row.revenueCents - row.costCents }), { orders: 0, revenue: 0, profit: 0 });
  const inventoryValue = data.products.reduce((sum, product) => sum + product.stockQuantity * product.unitCostCents, 0);
  const inventoryCount = data.products.reduce((sum, product) => sum + product.stockQuantity, 0);
  const openTasks = data.tasks.filter((task) => !task.completed);

  return (
    <SidebarProvider className={`workbench-theme ${theme}`}>
      <Sidebar collapsible="icon" className="border-r border-white/8">
        <SidebarHeader className="px-4 py-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid size-9 shrink-0 place-items-center border border-cyan-300/45 bg-cyan-300/8 font-mono text-lg font-semibold text-cyan-200">
              Z
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-mono text-[15px] tracking-[0.14em] text-white">ZGATRI</p>
              <p className="truncate text-xs text-slate-500">PERSONAL OS</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[11px] tracking-[0.16em] text-slate-600">
              WORKSPACE
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={item.id === activeView}
                      tooltip={item.label}
                      className="h-10 text-slate-400 data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-200"
                      onClick={() => setActiveView(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3 group-data-[collapsible=icon]:hidden">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>本月目标</span>
              <span>68%</span>
            </div>
            <Progress value={68} className="h-1 bg-white/8 [&>div]:bg-cyan-300" />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/8 bg-[#07101f]/85 px-4 backdrop-blur-xl md:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-400 hover:bg-white/5 hover:text-white" />
            <div>
              <p className="text-sm font-medium text-white">{activeLabel}</p>
              <p className="font-mono text-[11px] tracking-[0.1em] text-slate-600">{today ? today.replaceAll("-", ".") : "----.--.--"} / WORK</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              className="theme-toggle border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              aria-label={theme === "light" ? "切换到夜间模式" : "切换到白天模式"}
              title={theme === "light" ? "切换到夜间模式" : "切换到白天模式"}
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </Button>
            <Button onClick={() => setImportOpen(true)} variant="outline" className="hidden border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white sm:flex">
              <FileUp /> 批量导入
            </Button>
            <Button onClick={() => setTaskOpen(true)} className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">
              <Plus /> 快速记录
            </Button>
          </div>
        </header>

        <main className="min-h-[calc(100svh-4rem)] bg-[#07101f] px-4 py-6 md:px-7 md:py-7">
          {message && <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/80"><span>{message}</span><button aria-label="关闭提示" onClick={() => setMessage("")}><X className="size-4" /></button></div>}
          {activeView === "dashboard" ? <>
          <section className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-cyan-300/80">
                <Sparkles className="size-3.5" /> CONTROL CENTER
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">今天，把经营的每一步看清楚。</h1>
              <p className="mt-2 text-sm text-slate-500">销售、待办事项和新媒体运营汇总于此。</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.8)]" />
              数据已从本地台账读取
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="昨日订单" value={`${yesterdayTotals.orders}`} change={`${yesterday} 的销售数量`} icon={ClipboardList} />
            <MetricCard label="昨日营业额" value={money(yesterdayTotals.revenue)} change={`${yesterdaySales.length} 条销售记录`} icon={TrendingUp} />
            <MetricCard label="昨日净利润" value={money(yesterdayTotals.profit)} change={yesterdayTotals.revenue ? `利润率 ${Math.round(yesterdayTotals.profit / yesterdayTotals.revenue * 100)}%` : "等待导入数据"} icon={CircleDollarSign} />
            <MetricCard label="当前库存价值" value={money(inventoryValue)} change={`共 ${inventoryCount} 件库存`} icon={Boxes} />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
            <Card className="dashboard-card gap-0 py-0">
              <CardHeader className="border-b border-white/8 py-5">
                <CardTitle className="text-base text-white">今日待办</CardTitle>
                <CardDescription>{openTasks.length} 件未完成</CardDescription>
                <CardAction>
                  <Button onClick={() => setActiveView("tasks")} variant="ghost" size="sm" className="text-slate-400 hover:bg-white/5 hover:text-white">
                    查看全部 <ChevronRight />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                {!openTasks.length ? <div className="p-5"><EmptyBlock text="暂时没有未完成事项" /></div> : openTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 border-b border-white/6 px-5 py-4 last:border-b-0">
                    <span className="size-2 shrink-0 rounded-full bg-cyan-300/70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">{task.title}</p>
                    </div>
                    <Badge variant="outline" className={priorityClass(task.priority)}>
                      {priorityLabel(task.priority)}
                    </Badge>
                    <span className="w-20 text-right font-mono text-xs text-slate-600">{task.endDate || "未定期"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="dashboard-card gap-0 py-0">
              <CardHeader className="border-b border-white/8 py-5">
                <CardTitle className="text-base text-white">事项周期</CardTitle>
                <CardDescription>重要程度决定建议周期</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 py-5">
                <CycleRow label="重要" days="3 天" count={openTasks.filter((task) => task.priority === "high").length} tone="text-amber-200" />
                <CycleRow label="普通" days="14 天" count={openTasks.filter((task) => task.priority === "normal").length} tone="text-cyan-200" />
                <CycleRow label="不紧急" days="30 天" count={openTasks.filter((task) => task.priority === "low").length} tone="text-slate-400" />
                <p className="pt-2 text-xs leading-5 text-slate-600">新建事项时自动给出截止日期，也可以按实际情况手动修改。</p>
              </CardContent>
            </Card>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="dashboard-card gap-0 py-0">
              <CardHeader className="border-b border-white/8 py-5">
                <CardTitle className="text-base text-white">昨日销售明细</CardTitle>
                <CardDescription>{yesterdaySales.length} 条记录 · {yesterday}</CardDescription>
                <CardAction>
                  <Button onClick={() => setActiveView("sales")} variant="ghost" size="sm" className="text-slate-400 hover:bg-white/5 hover:text-white">
                    销售看台 <ChevronRight />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-5 py-2">
                <div className="grid grid-cols-[1fr_68px_90px_80px] gap-3 border-b border-white/8 py-3 font-mono text-[11px] tracking-wide text-slate-600">
                  <span>商品</span><span>订单</span><span>营业额</span><span>净利润</span>
                </div>
                {!yesterdaySales.length ? <EmptyBlock text="昨日没有销售记录，可通过 CSV 批量导入" /> : yesterdaySales.slice(0, 6).map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_68px_90px_80px] gap-3 border-b border-white/6 py-4 text-sm last:border-b-0">
                    <span className="truncate text-slate-300">{item.productName}</span>
                    <span className="font-mono text-slate-500">{item.quantity}</span>
                    <span className="font-mono text-slate-300">{money(item.revenueCents)}</span>
                    <span className="font-mono text-emerald-300">{money(item.revenueCents - item.costCents)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="dashboard-card gap-0 py-0">
              <CardHeader className="border-b border-white/8 py-5">
                <CardTitle className="text-base text-white">库存提醒</CardTitle>
                <CardDescription>{data.products.length} 个商品规格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-5">
                {!data.products.length ? <EmptyBlock text="库存只做简单记录，按需添加即可" /> : data.products.slice(0, 5).map((product) => <InventoryRow key={product.id} name={`${product.name}${product.specification ? ` / ${product.specification}` : ""}`} stock={product.stockQuantity} value={money(product.stockQuantity * product.unitCostCents)} warning={product.stockQuantity <= product.lowStockThreshold} />)}
              </CardContent>
            </Card>
          </section>
          </> : activeView === "sales" ? (
            <SalesView sales={data.sales} products={data.products} loading={loading} onImport={() => setImportOpen(true)} onAddProduct={() => setProductOpen(true)} />
          ) : activeView === "tasks" ? (
            <TasksView tasks={data.tasks} loading={loading} onAdd={() => setTaskOpen(true)} onToggle={async (task) => {
              try { await send({ action: "toggle_task", id: task.id, completed: !task.completed, progress: task.progress }); }
              catch (error) { setMessage(error instanceof Error ? error.message : "更新失败"); }
            }} onProgress={setProgressTask} />
          ) : (
            <MediaView />
          )}
        </main>
      </SidebarInset>

      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} onSubmit={async (payload) => {
        try { await send({ action: "create_task", ...payload }); setTaskOpen(false); setMessage("待办事项已保存"); }
        catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
      }} />
      <SalesImportDialog open={importOpen} onOpenChange={setImportOpen} csvText={csvText} setCsvText={setCsvText} onSubmit={async (rows) => {
        try { const result = await send({ action: "import_sales", rows }); setImportOpen(false); setCsvText(""); setMessage(`已导入 ${result.imported || rows.length} 条销售记录`); }
        catch (error) { setMessage(error instanceof Error ? error.message : "导入失败"); }
      }} />
      <ProductDialog open={productOpen} onOpenChange={setProductOpen} onSubmit={async (payload) => {
        try { await send({ action: "upsert_product", ...payload }); setProductOpen(false); setMessage("库存商品已保存"); }
        catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
      }} />
      <ProgressDialog task={progressTask} logs={progressTask ? data.taskLogs.filter((log) => log.taskId === progressTask.id) : []} onOpenChange={(open) => { if (!open) setProgressTask(null); }} onSubmit={async (payload) => {
        try { await send({ action: "add_task_log", taskId: progressTask?.id, ...payload }); setProgressTask(null); setMessage("推进记录已保存"); }
        catch (error) { setMessage(error instanceof Error ? error.message : "保存失败"); }
      }} />
    </SidebarProvider>
  );
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="mb-2 font-mono text-xs tracking-[0.16em] text-cyan-300/70">{eyebrow}</p>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-white/10 text-sm text-slate-600">{text}</div>;
}

function SalesView({ sales, products, loading, onImport, onAddProduct }: { sales: SaleRecord[]; products: ProductRecord[]; loading: boolean; onImport: () => void; onAddProduct: () => void }) {
  const totals = useMemo(() => sales.reduce((sum, row) => ({ orders: sum.orders + row.quantity, revenue: sum.revenue + row.revenueCents, profit: sum.profit + row.revenueCents - row.costCents }), { orders: 0, revenue: 0, profit: 0 }), [sales]);
  const inventoryValue = products.reduce((sum, product) => sum + product.stockQuantity * product.unitCostCents, 0);
  const inventoryCount = products.reduce((sum, product) => sum + product.stockQuantity, 0);
  return <>
    <PageIntro eyebrow="SALES DESK" title="销售看台" description="每天过账一次，订单、营业额和净利润会自动汇总。" action={<Button onClick={onImport} className="bg-cyan-200 text-slate-950 hover:bg-cyan-100"><FileUp /> 批量导入销售记录</Button>} />
    <section className="grid gap-3 sm:grid-cols-3">
      <MetricCard label="累计售出" value={`${totals.orders} 单`} change="按商品数量合计" icon={ClipboardList} />
      <MetricCard label="累计营业额" value={money(totals.revenue)} change="已录入销售记录" icon={TrendingUp} />
      <MetricCard label="累计净利润" value={money(totals.profit)} change={totals.revenue ? `利润率 ${Math.round(totals.profit / totals.revenue * 100)}%` : "等待录入"} icon={CircleDollarSign} />
    </section>
    <Card className="dashboard-card mt-4 gap-0 py-0">
      <CardHeader className="border-b border-white/8 py-5"><CardTitle className="text-base text-white">销售记录</CardTitle><CardDescription>{loading ? "正在读取" : `${sales.length} 条记录`}</CardDescription></CardHeader>
      <CardContent className="px-0">
        {!sales.length ? <div className="p-5"><EmptyBlock text="还没有销售记录，使用右上角按钮批量导入 CSV" /></div> : <Table>
          <TableHeader><TableRow className="border-white/8 hover:bg-transparent"><TableHead>日期</TableHead><TableHead>商品 / 规格</TableHead><TableHead>数量</TableHead><TableHead>营业额</TableHead><TableHead>成本</TableHead><TableHead>净利润</TableHead><TableHead>渠道</TableHead></TableRow></TableHeader>
          <TableBody>{sales.map(row => <TableRow key={row.id} className="border-white/6 hover:bg-white/[0.025]"><TableCell className="font-mono text-slate-500">{row.soldOn}</TableCell><TableCell><p className="text-slate-200">{row.productName}</p><p className="text-xs text-slate-600">{row.sku || "未填写 SKU"}</p></TableCell><TableCell>{row.quantity}</TableCell><TableCell>{money(row.revenueCents)}</TableCell><TableCell className="text-slate-500">{money(row.costCents)}</TableCell><TableCell className="text-emerald-300">{money(row.revenueCents - row.costCents)}</TableCell><TableCell>{row.channel}</TableCell></TableRow>)}</TableBody>
        </Table>}
      </CardContent>
    </Card>

    <Card className="dashboard-card mt-4 gap-0 py-0">
      <CardHeader className="border-b border-white/8 py-5">
        <CardTitle className="text-base text-white">库存小账本</CardTitle>
        <CardDescription>简单记一下手里有什么货，做到心中有数。</CardDescription>
        <CardAction><Button onClick={onAddProduct} variant="outline" size="sm" className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"><Plus /> 添加库存</Button></CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid gap-3 border-b border-white/8 p-5 sm:grid-cols-3">
          <MiniStat label="商品规格" value={`${products.length} 个`} />
          <MiniStat label="库存数量" value={`${inventoryCount} 件`} />
          <MiniStat label="库存成本价值" value={money(inventoryValue)} />
        </div>
        {!products.length ? <div className="p-5"><EmptyBlock text="还没有库存记录，需要时随手记一笔即可" /></div> : <Table>
          <TableHeader><TableRow className="border-white/8 hover:bg-transparent"><TableHead>商品</TableHead><TableHead>参数 / 规格</TableHead><TableHead>库存</TableHead><TableHead>单位成本</TableHead><TableHead>销售价</TableHead><TableHead>库存价值</TableHead></TableRow></TableHeader>
          <TableBody>{products.map(product => <TableRow key={product.id} className="border-white/6 hover:bg-white/[0.025]"><TableCell><p className="text-slate-200">{product.name}</p><p className="font-mono text-xs text-slate-600">{product.sku || "未填写 SKU"}</p></TableCell><TableCell>{product.specification || "—"}</TableCell><TableCell><Badge variant="outline" className={product.stockQuantity <= product.lowStockThreshold ? "border-amber-300/25 text-amber-200" : "border-white/8 text-slate-300"}>{product.stockQuantity} 件</Badge></TableCell><TableCell>{money(product.unitCostCents)}</TableCell><TableCell>{money(product.salePriceCents)}</TableCell><TableCell className="text-cyan-200">{money(product.stockQuantity * product.unitCostCents)}</TableCell></TableRow>)}</TableBody>
        </Table>}
      </CardContent>
    </Card>
  </>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/6 bg-white/[0.02] px-4 py-3"><p className="text-xs text-slate-600">{label}</p><p className="mt-1 font-mono text-base text-slate-200">{value}</p></div>;
}

function MediaView() {
  return <>
    <PageIntro eyebrow="MEDIA OPS" title="新媒体运营" description="先把抖音和 X 的运营节奏装进工作台，后续再逐步接入内容采集、拆解与自动化。" />
    <div className="grid gap-4 xl:grid-cols-2">
      <MediaPlatformCard
        platform="抖音"
        code="DOUYIN"
        description="围绕对标账号、待拆作品和待发布内容建立每日内容池。"
        rows={[["对标账号", "待添加"], ["待拆作品", "0 条"], ["待发布内容", "0 条"]]}
      />
      <MediaPlatformCard
        platform="X"
        code="X / TWITTER"
        description="重点经营的平台，先沉淀对标博主与内容素材，逐步形成稳定输出节奏。"
        rows={[["对标博主", "待添加"], ["已收集帖子", "0 条"], ["今日内容目标", "30+ 条"]]}
      />
    </div>
    <Card className="dashboard-card mt-4 gap-3 px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/5"><Sparkles className="size-4 text-cyan-300" /></div>
        <div><p className="text-sm font-medium text-slate-200">后续能力</p><p className="mt-1 text-sm leading-6 text-slate-500">对标账号采集、作品拆解、风格沉淀、批量生成和发布流程会逐步接进这里。当前先把工作台骨架定稳。</p></div>
      </div>
    </Card>
  </>;
}

function MediaPlatformCard({ platform, code, description, rows }: { platform: string; code: string; description: string; rows: [string, string][] }) {
  return <Card className="dashboard-card gap-0 py-0"><CardHeader className="border-b border-white/8 py-5"><div><p className="font-mono text-[11px] tracking-[0.14em] text-cyan-300/70">{code}</p><CardTitle className="mt-2 text-lg text-white">{platform}</CardTitle><CardDescription className="mt-1 max-w-lg leading-6">{description}</CardDescription></div></CardHeader><CardContent className="space-y-3 py-5">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-4 py-3"><span className="text-sm text-slate-500">{label}</span><span className="font-mono text-sm text-slate-200">{value}</span></div>)}</CardContent></Card>;
}

function TasksView({ tasks, loading, onAdd, onToggle, onProgress }: { tasks: TaskRecord[]; loading: boolean; onAdd: () => void; onToggle: (task: TaskRecord) => void; onProgress: (task: TaskRecord) => void }) {
  return <>
    <PageIntro eyebrow="TASKS" title="待办事项" description="状态只保留未完成与已完成，用周期、重要程度和推进记录表达过程。" action={<Button onClick={onAdd} className="bg-cyan-200 text-slate-950 hover:bg-cyan-100"><Plus /> 新建事项</Button>} />
    {!tasks.length ? <EmptyBlock text={loading ? "正在读取事项" : "还没有事项，先记录今天要推进的第一件事"} /> : <div className="grid gap-3 lg:grid-cols-2">{tasks.map(task => <Card key={task.id} className="dashboard-card gap-4 px-5 py-5"><div className="flex items-start gap-3"><Checkbox checked={task.completed} onCheckedChange={() => onToggle(task)} aria-label={`完成 ${task.title}`} className="mt-1 border-slate-600 data-[state=checked]:border-cyan-200 data-[state=checked]:bg-cyan-200 data-[state=checked]:text-slate-950"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={task.completed ? "text-slate-600 line-through" : "text-slate-100"}>{task.title}</h3><Badge variant="outline" className={priorityClass(task.priority)}>{priorityLabel(task.priority)}</Badge></div><p className="mt-2 text-xs text-slate-600">周期：{task.startDate || "未设置"} → {task.endDate || "未设置"}</p></div><span className="font-mono text-xs text-cyan-300/70">{task.progress}%</span></div><Progress value={task.progress} className="h-1 bg-white/8 [&>div]:bg-cyan-300"/><div className="rounded-lg border border-white/6 bg-white/[0.02] p-3"><p className="text-xs text-slate-600">下一步</p><p className="mt-1 text-sm text-slate-300">{task.nextStep || "尚未填写下一步"}</p>{task.nextStepDate && <p className="mt-2 font-mono text-[11px] text-slate-600">预计 {task.nextStepDate}</p>}</div><Button variant="outline" size="sm" onClick={() => onProgress(task)} disabled={task.completed} className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white">记录推进</Button></Card>)}</div>}
  </>;
}

function TaskDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [priority, setPriority] = useState("normal");
  const [startDate, setStartDate] = useState(localDate(0));
  const [endDate, setEndDate] = useState(addDays(localDate(0), 14));
  const cycleDays = priority === "high" ? 3 : priority === "low" ? 30 : 14;

  function resetForm() {
    const start = localDate(0);
    setPriority("normal");
    setStartDate(start);
    setEndDate(addDays(start, 14));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function changePriority(value: string) {
    setPriority(value);
    setEndDate(addDays(startDate, value === "high" ? 3 : value === "low" ? 30 : 14));
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    setEndDate(addDays(value, cycleDays));
  }

  return <Dialog open={open} onOpenChange={handleOpenChange}><DialogContent className="border-white/10 bg-[#0a1627] text-slate-100 sm:max-w-xl"><DialogHeader><DialogTitle>新建待办事项</DialogTitle><DialogDescription>重要事项默认 3 天，普通事项 14 天，不紧急事项 30 天；截止日期仍可手动调整。</DialogDescription></DialogHeader><form id="task-form" className="grid gap-4" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit(Object.fromEntries(form)); resetForm(); }}><Field label="事项名称"><Input name="title" required placeholder="例如：完成域名邮箱搭建" /></Field><Field label="重要程度"><Select value={priority} onValueChange={changePriority}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">重要 · 建议 3 天</SelectItem><SelectItem value="normal">普通 · 建议 14 天</SelectItem><SelectItem value="low">不紧急 · 建议 30 天</SelectItem></SelectContent></Select><input type="hidden" name="priority" value={priority}/></Field><div className="grid grid-cols-2 gap-3"><Field label="开始日期"><Input name="startDate" type="date" value={startDate} onChange={(event) => changeStartDate(event.target.value)} /></Field><Field label="截止日期"><Input name="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field></div><div className="grid grid-cols-[1fr_150px] gap-3"><Field label="下一步"><Input name="nextStep" placeholder="下一步预计做什么" /></Field><Field label="预计日期"><Input name="nextStepDate" type="date" /></Field></div></form><DialogFooter><Button variant="outline" onClick={() => handleOpenChange(false)}>取消</Button><Button form="task-form" type="submit">保存事项</Button></DialogFooter></DialogContent></Dialog>;
}

function SalesImportDialog({ open, onOpenChange, csvText, setCsvText, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; csvText: string; setCsvText: (value: string) => void; onSubmit: (rows: Record<string, unknown>[]) => void }) {
  const rows = parseSalesCsv(csvText);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#0a1627] text-slate-100 sm:max-w-2xl"><DialogHeader><DialogTitle>批量导入销售记录</DialogTitle><DialogDescription>CSV 列顺序：日期、商品、SKU、数量、营业额、成本、渠道、备注。第一行可以放表头。</DialogDescription></DialogHeader><div className="grid gap-4"><Input type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0]; if (file) void file.text().then(setCsvText); }} /><Textarea value={csvText} onChange={event => setCsvText(event.target.value)} className="min-h-48 font-mono text-xs" placeholder={"日期,商品,SKU,数量,营业额,成本,渠道,备注\n2026-09-22,ChatGPT Plus 月卡,GPT-1M,2,396,288,逐光小店,"}/><div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">识别到 <span className="font-mono text-cyan-200">{rows.length}</span> 条可导入记录</div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button disabled={!rows.length} onClick={() => onSubmit(rows)}>确认导入</Button></DialogFooter></DialogContent></Dialog>;
}

function ProductDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#0a1627] text-slate-100 sm:max-w-xl"><DialogHeader><DialogTitle>添加库存商品</DialogTitle><DialogDescription>不同周期或参数建议使用不同 SKU 分开记录。</DialogDescription></DialogHeader><form id="product-form" className="grid gap-4" onSubmit={event => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}><div className="grid grid-cols-2 gap-3"><Field label="商品名称"><Input required name="name" placeholder="ChatGPT Plus" /></Field><Field label="SKU"><Input required name="sku" placeholder="GPT-1M" /></Field></div><Field label="参数 / 规格"><Input name="specification" placeholder="月卡 / 独享 / 官网充值" /></Field><div className="grid grid-cols-3 gap-3"><Field label="库存数量"><Input name="stockQuantity" type="number" min="0" defaultValue="0" /></Field><Field label="单位成本"><Input name="unitCost" type="number" min="0" step="0.01" /></Field><Field label="销售价"><Input name="salePrice" type="number" min="0" step="0.01" /></Field></div><Field label="低库存预警值"><Input name="lowStockThreshold" type="number" min="0" defaultValue="5" /></Field></form><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button form="product-form" type="submit">保存商品</Button></DialogFooter></DialogContent></Dialog>;
}

function ProgressDialog({ task, logs, onOpenChange, onSubmit }: { task: TaskRecord | null; logs: TaskLog[]; onOpenChange: (open: boolean) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  return <Dialog open={Boolean(task)} onOpenChange={onOpenChange}><DialogContent className="border-white/10 bg-[#0a1627] text-slate-100 sm:max-w-2xl"><DialogHeader><DialogTitle>记录推进 · {task?.title}</DialogTitle><DialogDescription>写下今天推进到哪里、当前完成度和下一步动作。</DialogDescription></DialogHeader><form id="progress-form" className="grid gap-4" onSubmit={event => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}><Field label="今天推进了什么"><Textarea name="note" required className="min-h-24" placeholder="例如：已完成服务商配置并验证收信" /></Field><div className="grid grid-cols-[120px_1fr_150px] gap-3"><Field label="完成度"><Input name="progress" type="number" min="0" max="100" defaultValue={task?.progress || 0} /></Field><Field label="下一步"><Input name="nextStep" defaultValue={task?.nextStep || ""} placeholder="下一步预计做什么" /></Field><Field label="预计日期"><Input name="nextStepDate" type="date" defaultValue={task?.nextStepDate || ""} /></Field></div></form>{logs.length > 0 && <div className="max-h-48 space-y-2 overflow-y-auto border-t border-white/8 pt-4"><p className="text-xs text-slate-500">历史推进记录</p>{logs.map((log) => <div key={log.id} className="rounded-lg border border-white/6 bg-white/[0.02] p-3"><div className="flex justify-between gap-3"><p className="text-sm text-slate-300">{log.note}</p><span className="shrink-0 font-mono text-[11px] text-slate-600">{log.createdAt.replace("T", " ").slice(0, 16)}</span></div>{log.nextStep && <p className="mt-2 text-xs text-cyan-200/70">下一步：{log.nextStep}</p>}</div>)}</div>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button form="progress-form" type="submit">保存推进记录</Button></DialogFooter></DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm text-slate-400"><span>{label}</span>{children}</label>; }
function money(cents: number) { return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 2 }).format(cents / 100); }
function priorityLabel(priority: string) { return priority === "high" ? "重要" : priority === "low" ? "不紧急" : "普通"; }
function priorityClass(priority: string) { return priority === "high" ? "border-amber-300/25 bg-amber-300/8 text-amber-200" : priority === "low" ? "border-white/8 text-slate-600" : "border-cyan-300/20 bg-cyan-300/5 text-cyan-200"; }
function localDate(offsetDays: number) { const date = new Date(Date.now() + 8 * 60 * 60 * 1000); date.setUTCDate(date.getUTCDate() + offsetDays); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`; }
function addDays(dateString: string, days: number) { const [year, month, day] = dateString.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day + days)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`; }
function parseSalesCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const dataLines = /日期|date/i.test(lines[0]) ? lines.slice(1) : lines;
  return dataLines.map(line => line.split(/,|\t/).map(cell => cell.trim().replace(/^"|"$/g, ""))).filter(cells => cells.length >= 6 && cells[0] && cells[1]).map(cells => ({ soldOn: cells[0], productName: cells[1], sku: cells[2] || "", quantity: Number(cells[3] || 1), revenue: Number(cells[4] || 0), cost: Number(cells[5] || 0), channel: cells[6] || "逐光小店", note: cells[7] || "" }));
}

function MetricCard({ label, value, change, icon: Icon }: { label: string; value: string; change: string; icon: typeof BarChart3 }) {
  return (
    <Card className="dashboard-card gap-3 px-5 py-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon className="size-4 text-cyan-300/70" />
      </div>
      <p className="font-mono text-2xl font-medium tracking-tight text-white">{value}</p>
      <p className="text-xs text-slate-600">{change}</p>
    </Card>
  );
}

function CycleRow({ label, days, count, tone }: { label: string; days: string; count: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-4 py-3">
      <div><p className={`text-sm ${tone}`}>{label}</p><p className="mt-0.5 text-xs text-slate-600">默认周期 {days}</p></div>
      <span className="font-mono text-sm text-slate-400">{count} 件</span>
    </div>
  );
}

function InventoryRow({ name, stock, value, warning = false }: { name: string; stock: number; value: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-sm text-slate-300">{name}</p><p className="mt-0.5 text-xs text-slate-600">库存价值 {value}</p></div>
      <Badge variant="outline" className={warning ? "border-amber-300/25 bg-amber-300/8 text-amber-200" : "border-white/8 text-slate-400"}>{stock} 件</Badge>
    </div>
  );
}
