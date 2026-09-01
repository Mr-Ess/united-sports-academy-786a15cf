import { createServerFn } from "@tanstack/react-start";
import { openAdminAccess as requireSupabaseAuth } from "@/lib/open-admin-middleware";

const MODULES = [
  "trainees",
  "receipts",
  "attendance",
  "employees",
  "transactions",
  "leads",
  "payroll",
] as const;
type Module = (typeof MODULES)[number];

async function authorize(supabase: any, userId: string, branchId: string) {
  const { data: isAdmin } = await supabase.rpc("is_super_admin", { _user_id: userId });
  const { data: isBranchAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "branch_admin",
    _branch_id: branchId,
  });
  if (!isAdmin && !isBranchAdmin) throw new Error("Forbidden: branch admin required");
}

const FIRST_NAMES = ["Ahmed","Mariam","Omar","Youssef","Layla","Hana","Karim","Sara","Mostafa","Nour","Aya","Ziad","Tarek","Salma","Hassan","Rana"];
const LAST_NAMES = ["Saleh","Hassan","Khaled","Tarek","Mostafa","Adel","Nabil","Fathy","Farouk","Wahby","El-Sayed","Ghanam","Shaheen","El-Maadawy"];
const COACHES = ["Hager Shaheen","Ayman El-Maadawy","Mohamed El-Sayed","Yasmine Ghanam","Tamer Fouad","Rasha Saad"];
const PAY_METHODS = ["Cash","InstaPay","Wallet","Card"];
const CATEGORIES = ["Kids","Teens","Adults","Private"];
const LEVELS = ["Level 1","Level 2","Level 3","Level 4"];
const DAY_GROUPS = ["Sat-Mon-Wed","Sun-Tue-Thu","Fri-Sat"];
const TIME_SLOTS = ["4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

async function resetModule(supabase: any, branchId: string, mod: Module) {
  const stamp = new Date().toISOString();
  switch (mod) {
    case "receipts":
      await supabase.from("ac_invoices").update({ deleted_at: stamp }).eq("branch_id", branchId).is("deleted_at", null);
      break;
    case "trainees":
      await supabase.from("ac_subscriptions").update({ deleted_at: stamp }).eq("branch_id", branchId).is("deleted_at", null);
      await supabase.from("ac_invoices").update({ deleted_at: stamp }).eq("branch_id", branchId).is("deleted_at", null);
      await supabase.from("ac_trainees").update({ deleted_at: stamp, active: false }).eq("branch_id", branchId).is("deleted_at", null);
      break;
    case "attendance":
      await supabase.from("ac_attendance").delete().eq("branch_id", branchId);
      break;
    case "employees":
      await supabase.from("ac_payroll_items").delete().eq("branch_id", branchId);
      await supabase.from("ac_payroll_runs").delete().eq("branch_id", branchId);
      await supabase.from("ac_employees").delete().eq("branch_id", branchId);
      break;
    case "transactions":
      await supabase.from("ac_transactions").delete().eq("branch_id", branchId);
      break;
    case "leads":
      await supabase.from("ac_leads").delete().eq("branch_id", branchId);
      break;
    case "payroll":
      await supabase.from("ac_payroll_items").delete().eq("branch_id", branchId);
      await supabase.from("ac_payroll_runs").delete().eq("branch_id", branchId);
      break;
  }
}

async function ensureCoaches(supabase: any, branchId: string) {
  const { data: existing } = await supabase.from("ac_employees").select("id, full_name").eq("branch_id", branchId).eq("status", "active");
  if ((existing?.length ?? 0) >= 3) return existing!;
  const created: any[] = [];
  for (let i = 0; i < COACHES.length; i++) {
    const { data, error } = await supabase.from("ac_employees").insert({
      branch_id: branchId,
      employee_code: `EMP-${Date.now().toString().slice(-5)}${i}`,
      full_name: COACHES[i],
      phone: `0109${String(1000 + i).padStart(4, "0")}`,
      title: i === 0 ? "Head Coach" : "Coach",
      base_salary: 10000 + i * 1500,
      hire_date: daysAgo(90 + i * 10),
      status: "active",
    }).select("id, full_name").single();
    if (!error && data) created.push(data);
  }
  return [...(existing ?? []), ...created];
}

async function seedTrainees(supabase: any, branchId: string, n: number, coaches: any[]) {
  const trainees: any[] = [];
  for (let i = 0; i < n; i++) {
    const { data: codeRow } = await supabase.rpc("ac_generate_client_code");
    const fullName = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
    const cat = rand(CATEGORIES);
    const { data: tr, error } = await supabase.from("ac_trainees").insert({
      branch_id: branchId,
      client_code: codeRow as unknown as string,
      full_name: fullName,
      phone: `010${randInt(10000000, 99999999)}`,
      gender: i % 2 === 0 ? "male" : "female",
      category: cat.toLowerCase(),
      skill_level: rand(LEVELS).toLowerCase(),
      assigned_coach_id: coaches.length ? rand(coaches).id : null,
      birthdate: daysAgo(randInt(6, 35) * 365),
      active: true,
    }).select("id, full_name, client_code, phone, category, skill_level, assigned_coach_id").single();
    if (!error && tr) trainees.push(tr);
  }
  return trainees;
}

async function seedSubscriptionsAndReceipts(supabase: any, branchId: string, trainees: any[]) {
  for (const tr of trainees) {
    const total = rand([8, 12, 16]);
    const used = randInt(0, total);
    const price = total === 8 ? 1200 : total === 12 ? 1800 : 2400;
    const method = rand(PAY_METHODS);
    const start = daysAgo(randInt(1, 25));
    const end = new Date(new Date(start).getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: sub } = await supabase.from("ac_subscriptions").insert({
      branch_id: branchId,
      trainee_id: tr.id,
      package_name: `${total} Sessions`,
      package_type: "monthly",
      total_sessions: total,
      used_sessions: used,
      price,
      paid_amount: price,
      start_date: start,
      end_date: end,
      status: used >= total ? "expired" : "active",
      payment_method: method.toLowerCase(),
    }).select("id").single();

    const active = used < total;
    const meta = {
      clientId: tr.client_code,
      studentName: tr.full_name,
      membershipId: `M-${randInt(1000, 9999)}`,
      phone: tr.phone ?? "",
      address: "",
      emergencyContact: "",
      category: (tr.category ?? "kids").replace(/^\w/, (c: string) => c.toUpperCase()),
      age: randInt(6, 35),
      level: (tr.skill_level ?? "level 1").replace(/^\w/, (c: string) => c.toUpperCase()),
      type: total === 1 ? "Private" : "Group",
      sessionsCount: String(total),
      totalSessions: total,
      sessionsUsed: used,
      paymentMethod: method,
      dayGroup: rand(DAY_GROUPS),
      timeSlot: rand(TIME_SLOTS),
      coachId: tr.assigned_coach_id ?? null,
      skillRating: randInt(4, 10),
      notes: "",
    };
    await supabase.from("ac_invoices").insert({
      branch_id: branchId,
      subscription_id: sub?.id ?? null,
      trainee_id: tr.id,
      invoice_number: `R-${Date.now().toString().slice(-6)}${randInt(10, 99)}`,
      issue_date: start,
      due_date: end,
      subtotal: price,
      total: price,
      paid_amount: price,
      status: active ? "paid" : "expired",
      items: meta as any,
    });
  }
}

async function seedAttendance(supabase: any, branchId: string, trainees: any[], days: number) {
  const rows: any[] = [];
  for (let d = 0; d < days; d++) {
    const sample = trainees.slice().sort(() => 0.5 - Math.random()).slice(0, randInt(4, Math.min(10, trainees.length)));
    for (const tr of sample) {
      rows.push({
        branch_id: branchId,
        trainee_id: tr.id,
        attended_at: daysAgo(d),
        status: "present",
        method: Math.random() > 0.5 ? "qr" : "manual",
      });
    }
  }
  if (rows.length) await supabase.from("ac_attendance").insert(rows);
}

async function seedTransactions(supabase: any, branchId: string) {
  const { data: accs } = await supabase.from("ac_accounts").select("id, kind").eq("branch_id", branchId).limit(2);
  if (!accs?.length) return;
  const { data: cats } = await supabase.from("ac_expense_categories").select("id, kind").eq("branch_id", branchId);
  const inc = cats?.find((c: any) => c.kind === "income")?.id;
  const exp = cats?.find((c: any) => c.kind === "expense")?.id;
  const rows: any[] = [];
  for (let i = 0; i < 12; i++) {
    const isIncome = Math.random() > 0.4;
    rows.push({
      branch_id: branchId,
      account_id: rand(accs as any[]).id,
      category_id: isIncome ? inc : exp,
      kind: isIncome ? "income" : "expense",
      amount: isIncome ? randInt(800, 3500) : randInt(300, 2200),
      description: isIncome ? "Subscription payment" : rand(["Utilities", "Pool chemicals", "Maintenance", "Supplies"]),
      tx_date: daysAgo(randInt(0, 25)),
    });
  }
  await supabase.from("ac_transactions").insert(rows);
}

async function seedLeads(supabase: any, branchId: string, n: number) {
  const statuses = ["hot", "warm", "cold"];
  const sources = ["Instagram", "Facebook", "Referral", "Walk-in", "Website"];
  const rows = Array.from({ length: n }).map(() => ({
    branch_id: branchId,
    full_name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
    phone: `010${randInt(10000000, 99999999)}`,
    status: rand(statuses),
    source: rand(sources),
    notes: rand(["Asked about kids program", "Walk-in interested in adults fitness", "Inquired pricing", ""]),
  }));
  await supabase.from("ac_leads").insert(rows);
}

async function seedPayroll(supabase: any, branchId: string) {
  const { data: emps } = await supabase.from("ac_employees").select("id, base_salary").eq("branch_id", branchId).eq("status", "active");
  if (!emps?.length) return;
  const now = new Date();
  const { data: run } = await supabase.from("ac_payroll_runs").insert({
    branch_id: branchId,
    period_month: now.getMonth() + 1,
    period_year: now.getFullYear(),
    status: "draft",
    total_amount: 0,
  }).select("id").single();
  if (!run) return;
  let total = 0;
  const items = (emps as any[]).map((e: any) => {
    const base = Number(e.base_salary ?? 8000);
    const allow = randInt(200, 800);
    const ded = randInt(0, 400);
    const bonus = randInt(0, 600);
    const net = base + allow + bonus - ded;
    total += net;
    return { payroll_run_id: run.id, branch_id: branchId, employee_id: e.id, base_salary: base, allowances: allow, deductions: ded, bonuses: bonus, net_pay: net };
  });
  await supabase.from("ac_payroll_items").insert(items);
  await supabase.from("ac_payroll_runs").update({ total_amount: total }).eq("id", run.id);
}

/**
 * Original simple seeder — kept for backward compatibility.
 * Skips if branch already has trainees.
 */
export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await authorize(supabase, userId, data.branchId);
    const { count } = await supabase.from("ac_trainees").select("id", { count: "exact", head: true }).eq("branch_id", data.branchId).is("deleted_at", null);
    if ((count ?? 0) > 0) return { skipped: true, reason: "Branch already has trainees" };
    const coaches = await ensureCoaches(supabase, data.branchId);
    const trainees = await seedTrainees(supabase, data.branchId, 12, coaches);
    await seedSubscriptionsAndReceipts(supabase, data.branchId, trainees);
    await seedAttendance(supabase, data.branchId, trainees, 10);
    await seedTransactions(supabase, data.branchId);
    await seedLeads(supabase, data.branchId, 8);
    return { skipped: false, ok: true };
  });

/**
 * Top-up or reset specific modules for a branch.
 * - mode: "topup" → adds new rows on top of existing data (safe).
 * - mode: "reset" → soft-deletes/removes existing rows in the listed modules for this branch, then seeds fresh data.
 */
export const seedDemoModules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId: string; modules: Module[]; mode: "topup" | "reset" }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await authorize(supabase, userId, data.branchId);
    const mods = data.modules.length ? data.modules : (MODULES as unknown as Module[]);

    const summary: Record<string, number> = {};

    if (data.mode === "reset") {
      for (const m of mods) await resetModule(supabase, data.branchId, m);
    }

    const coaches = await ensureCoaches(supabase, data.branchId);

    let trainees: any[] = [];
    if (mods.includes("trainees") || mods.includes("receipts") || mods.includes("attendance")) {
      if (data.mode === "reset" || mods.includes("trainees")) {
        trainees = await seedTrainees(supabase, data.branchId, 10, coaches);
        summary.trainees = trainees.length;
      } else {
        const { data: existing } = await supabase
          .from("ac_trainees")
          .select("id, full_name, client_code, phone, category, skill_level, assigned_coach_id")
          .eq("branch_id", data.branchId).is("deleted_at", null).limit(40);
        trainees = existing ?? [];
        if (trainees.length === 0) {
          trainees = await seedTrainees(supabase, data.branchId, 10, coaches);
          summary.trainees = trainees.length;
        }
      }
    }

    if (mods.includes("receipts")) {
      const targets = trainees.slice(0, 10);
      await seedSubscriptionsAndReceipts(supabase, data.branchId, targets);
      summary.receipts = targets.length;
    }

    if (mods.includes("attendance")) {
      await seedAttendance(supabase, data.branchId, trainees, 10);
      summary.attendance = trainees.length * 5;
    }

    if (mods.includes("employees")) {
      const created = await ensureCoaches(supabase, data.branchId);
      summary.employees = created.length;
    }

    if (mods.includes("transactions")) {
      await seedTransactions(supabase, data.branchId);
      summary.transactions = 12;
    }

    if (mods.includes("leads")) {
      await seedLeads(supabase, data.branchId, 10);
      summary.leads = 10;
    }

    if (mods.includes("payroll")) {
      await seedPayroll(supabase, data.branchId);
      summary.payroll = 1;
    }

    return { ok: true, mode: data.mode, modules: mods, summary };
  });
