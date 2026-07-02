// 편집 후 파생값 재계산 — 엑셀의 수식 열에 해당하는 값을 웹에서 다시 만든다.
// (합계, 미수/미지급, 상태, 거래처명·프로젝트명 조회, 자금 잔액 누계, 급여 합계)
import type { SJData } from "./types";

export function payStatus(
  total: number,
  paid: number,
  done: string,
  partial: string,
  none: string
): string {
  if (total <= 0) return "";
  if (paid >= total) return done;
  if (paid > 0) return partial;
  return none;
}

export function recomputeAll(d: SJData): SJData {
  const clientName = (code: string) => d.clients.find((c) => c.code === code)?.name ?? "";

  const projects = d.projects.map((p) => ({
    ...p,
    clientName: p.clientCode ? clientName(p.clientCode) || p.clientName : p.clientName,
    total: p.amount + p.vat,
  }));

  const projectName = (code: string) => projects.find((p) => p.code === code)?.name ?? "";

  const sales = d.sales.map((s) => {
    const total = s.supply + s.vat;
    return {
      ...s,
      projectName: s.projectCode ? projectName(s.projectCode) || s.projectName : s.projectName,
      clientName: s.clientCode ? clientName(s.clientCode) || s.clientName : s.clientName,
      total,
      unpaid: total - s.paid,
      status: payStatus(total, s.paid, "수금완료", "부분수금", "미수"),
    };
  });

  const purchases = d.purchases.map((p) => {
    const total = p.supply + p.vat;
    return {
      ...p,
      projectName: p.projectCode ? projectName(p.projectCode) || p.projectName : p.projectName,
      clientName: p.clientCode ? clientName(p.clientCode) || p.clientName : p.clientName,
      total,
      unpaid: total - p.paid,
      status: payStatus(total, p.paid, "지급완료", "부분지급", "미지급"),
    };
  });

  let balance = 0;
  const cash = d.cash.map((c) => {
    balance += c.inAmt - c.outAmt;
    return { ...c, balance };
  });

  const payroll = d.payroll.map((p) => {
    const emp = d.employees.find((e) => e.id === p.empId);
    const gross = p.base + p.allowance;
    const deductions =
      p.pension + p.health + p.care + p.employment + p.incomeTax + p.localTax;
    return {
      ...p,
      name: emp?.name ?? p.name,
      dept: emp?.dept ?? p.dept,
      gross,
      deductions,
      net: gross - deductions,
    };
  });

  return { ...d, projects, sales, purchases, cash, payroll };
}
