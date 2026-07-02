// 집계·포맷 유틸 — 대시보드 KPI와 월별 시계열은 전부 여기서 계산한다.
import type { SJData } from "./types";

export const fmt = (n: number): string => Math.round(n).toLocaleString("ko-KR");

/** 1.2억 / 3,500만 / 9,000 형태의 축약 표기 */
export function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e8) {
    const v = n / 1e8;
    return `${v >= 100 ? Math.round(v).toLocaleString("ko-KR") : v.toFixed(1)}억`;
  }
  if (abs >= 1e4) return `${Math.round(n / 1e4).toLocaleString("ko-KR")}만`;
  return fmt(n);
}

const pad = (n: number) => String(n).padStart(2, "0");

export const fmtDate = (d: Date | null): string =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "-";

export const fmtYm = (d: Date | null): string =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : "-";

export interface Kpis {
  activeProjects: number;
  backlog: number;        // 진행중 프로젝트 계약금액(공급가) 합
  totalSales: number;     // 누적 매출(공급가)
  totalPurchases: number; // 누적 매입(공급가)
  grossProfit: number;
  receivables: number;    // 미수금
  payables: number;       // 미지급금
  cashBalance: number;    // 자금일보 최종 잔액
}

export function calcKpis(data: SJData): Kpis {
  const active = data.projects.filter((p) => p.status === "진행중");
  const totalSales = data.sales.reduce((s, r) => s + r.supply, 0);
  const totalPurchases = data.purchases.reduce((s, r) => s + r.supply, 0);
  return {
    activeProjects: active.length,
    backlog: active.reduce((s, p) => s + p.amount, 0),
    totalSales,
    totalPurchases,
    grossProfit: totalSales - totalPurchases,
    receivables: data.sales.reduce((s, r) => s + Math.max(r.unpaid, 0), 0),
    payables: data.purchases.reduce((s, r) => s + Math.max(r.unpaid, 0), 0),
    cashBalance: data.cash.length > 0 ? data.cash[data.cash.length - 1].balance : 0,
  };
}

export interface MonthRow {
  ym: string;      // "2026-01"
  label: string;   // "1월"
  sales: number;
  purchases: number;
  profit: number;
  collected: number;
  paid: number;
}

/** 데이터에 존재하는 연도 목록 (최신순) */
export function dataYears(data: SJData): number[] {
  const years = new Set<number>();
  for (const s of data.sales) if (s.date) years.add(s.date.getFullYear());
  for (const p of data.purchases) if (p.date) years.add(p.date.getFullYear());
  for (const c of data.cash) if (c.date) years.add(c.date.getFullYear());
  if (years.size === 0) years.add(new Date().getFullYear());
  return [...years].sort((a, b) => b - a);
}

export function monthlySeries(data: SJData, year: number): MonthRow[] {
  const out: MonthRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const inMonth = (d: Date | null) =>
      d !== null && d.getFullYear() === year && d.getMonth() + 1 === m;
    const sales = data.sales.filter((r) => inMonth(r.date)).reduce((s, r) => s + r.supply, 0);
    const purchases = data.purchases.filter((r) => inMonth(r.date)).reduce((s, r) => s + r.supply, 0);
    out.push({
      ym: `${year}-${String(m).padStart(2, "0")}`,
      label: `${m}월`,
      sales,
      purchases,
      profit: sales - purchases,
      collected: data.sales.filter((r) => inMonth(r.paidDate)).reduce((s, r) => s + r.paid, 0),
      paid: data.purchases.filter((r) => inMonth(r.paidDate)).reduce((s, r) => s + r.paid, 0),
    });
  }
  return out;
}

/** 급여대장에 존재하는 귀속연월 목록 (최신순, "yyyy-mm") */
export function payrollMonths(data: SJData): string[] {
  const set = new Set<string>();
  for (const p of data.payroll) if (p.month) set.add(fmtYm(p.month));
  return [...set].sort((a, b) => b.localeCompare(a));
}

export const isOverdue = (dueDate: Date | null, unpaid: number): boolean =>
  unpaid > 0 && dueDate !== null && dueDate.getTime() < Date.now();
