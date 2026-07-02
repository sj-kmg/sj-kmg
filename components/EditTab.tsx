"use client";

// 데이터 편집 탭 — 시트를 선택해 표에서 직접 수정/추가/삭제한다.
// 저장하면 page.tsx의 onUpdate → recomputeAll을 거쳐 모든 탭·localStorage에 반영된다.
import { useState } from "react";
import type { SJData, Client, Project, Sale, Purchase, CashEntry, Employee, Payroll } from "@/lib/types";
import {
  CLIENT_TYPES, PROJECT_TYPES, PROJECT_STATUSES, SALE_CATEGORIES, PURCHASE_ACCOUNTS,
  DEPTS, RANKS, EMP_STATUSES, CASH_KINDS, CASH_CATEGORIES, BANKS,
  VAT_RATE, INS_RATES, mergeOptions,
} from "@/lib/lists";
import EditTable, { type Col } from "./EditTable";

const SHEETS = [
  { key: "sales", label: "매출" },
  { key: "purchases", label: "매입" },
  { key: "projects", label: "프로젝트" },
  { key: "clients", label: "거래처" },
  { key: "cash", label: "자금일보" },
  { key: "employees", label: "인사명부" },
  { key: "payroll", label: "급여대장" },
] as const;

type SheetKey = (typeof SHEETS)[number]["key"];

const pad3 = (n: number) => String(n).padStart(3, "0");

function nextCode(codes: string[], re: RegExp, make: (n: number) => string): string {
  let max = 0;
  for (const s of codes) {
    const m = s.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return make(max + 1);
}

export default function EditTab({
  data,
  onUpdate,
}: {
  data: SJData;
  onUpdate: (patch: Partial<SJData>) => void;
}) {
  const [sheet, setSheet] = useState<SheetKey>("sales");
  const [savedAt, setSavedAt] = useState<string>("");

  const year = new Date().getFullYear();
  const projectCodes = data.projects.map((p) => p.code);
  const clientCodes = data.clients.map((c) => c.code);
  const empIds = data.employees.map((e) => e.id);

  const save = <K extends SheetKey>(key: K, rows: SJData[K]) => {
    onUpdate({ [key]: rows });
    setSavedAt(new Date().toLocaleTimeString("ko-KR"));
  };

  // ─── 시트별 컬럼 정의 ───────────────────────────────
  const clientCols: Col<Client>[] = [
    { key: "code", label: "거래처코드", width: 90 },
    { key: "name", label: "거래처명", width: 160 },
    { key: "type", label: "구분", type: "select", options: CLIENT_TYPES },
    { key: "bizNo", label: "사업자번호", width: 110 },
    { key: "ceo", label: "대표자", width: 80 },
    { key: "manager", label: "담당자", width: 80 },
    { key: "phone", label: "연락처", width: 110 },
    { key: "email", label: "이메일", width: 150 },
    { key: "scope", label: "주요거래내용", width: 150 },
    { key: "terms", label: "결제조건", width: 150 },
    { key: "note", label: "비고", width: 120 },
  ];

  const projectCols: Col<Project>[] = [
    { key: "code", label: "프로젝트코드", width: 110 },
    { key: "name", label: "프로젝트명", width: 220 },
    { key: "clientCode", label: "발주처코드", type: "select", options: clientCodes },
    { key: "clientName", label: "발주처명", readonly: true, width: 130 },
    { key: "type", label: "공사구분", type: "select", options: PROJECT_TYPES },
    { key: "contractDate", label: "계약일", type: "date" },
    { key: "startDate", label: "착공일", type: "date" },
    { key: "endDate", label: "준공예정일", type: "date" },
    { key: "amount", label: "계약금액(공급가)", type: "number", width: 130 },
    { key: "vat", label: "부가세", type: "number", width: 110 },
    { key: "total", label: "총계약금액", readonly: true, width: 110 },
    { key: "status", label: "진행상태", type: "select", options: PROJECT_STATUSES },
    { key: "progress", label: "진행률(%)", type: "percent", width: 70 },
    { key: "manager", label: "담당자", width: 80 },
    { key: "note", label: "비고", width: 140 },
  ];

  const saleCols: Col<Sale>[] = [
    { key: "id", label: "매출ID", width: 100 },
    { key: "date", label: "청구일자", type: "date" },
    { key: "projectCode", label: "프로젝트코드", type: "select", options: projectCodes },
    { key: "projectName", label: "프로젝트명", readonly: true, width: 170 },
    { key: "clientCode", label: "거래처코드", type: "select", options: clientCodes },
    { key: "clientName", label: "거래처명", readonly: true, width: 130 },
    { key: "category", label: "청구구분", type: "select", options: SALE_CATEGORIES },
    { key: "desc", label: "내용", width: 170 },
    { key: "supply", label: "공급가액", type: "number", width: 120 },
    { key: "vat", label: "부가세", type: "number", width: 100 },
    { key: "total", label: "합계", readonly: true, width: 110 },
    { key: "invoiced", label: "계산서", type: "select", options: ["Y", "N"], width: 55 },
    { key: "dueDate", label: "수금예정일", type: "date" },
    { key: "paidDate", label: "수금일", type: "date" },
    { key: "paid", label: "수금액", type: "number", width: 120 },
    { key: "unpaid", label: "미수금", readonly: true, width: 100 },
    { key: "status", label: "상태", readonly: true, width: 70 },
    { key: "note", label: "비고", width: 130 },
  ];

  const purchaseCols: Col<Purchase>[] = [
    { key: "id", label: "매입ID", width: 100 },
    { key: "date", label: "일자", type: "date" },
    { key: "projectCode", label: "프로젝트코드", type: "select", options: projectCodes },
    { key: "projectName", label: "프로젝트명", readonly: true, width: 170 },
    { key: "clientCode", label: "거래처코드", type: "select", options: clientCodes },
    { key: "clientName", label: "거래처명", readonly: true, width: 130 },
    { key: "account", label: "계정과목", type: "select", options: PURCHASE_ACCOUNTS },
    { key: "desc", label: "내용", width: 170 },
    { key: "supply", label: "공급가액", type: "number", width: 120 },
    { key: "vat", label: "부가세(면세=0)", type: "number", width: 100 },
    { key: "total", label: "합계", readonly: true, width: 110 },
    { key: "dueDate", label: "지급예정일", type: "date" },
    { key: "paidDate", label: "지급일", type: "date" },
    { key: "paid", label: "지급액", type: "number", width: 120 },
    { key: "unpaid", label: "미지급금", readonly: true, width: 100 },
    { key: "status", label: "상태", readonly: true, width: 70 },
    { key: "note", label: "비고", width: 130 },
  ];

  const cashCols: Col<CashEntry>[] = [
    { key: "date", label: "일자", type: "date" },
    { key: "kind", label: "구분", type: "select", options: CASH_KINDS, width: 70 },
    { key: "account", label: "계좌", type: "select", options: mergeOptions(BANKS, data.cash.map((c) => c.account)) },
    { key: "category", label: "항목", type: "select", options: mergeOptions(CASH_CATEGORIES, data.cash.map((c) => c.category)) },
    { key: "desc", label: "내용", width: 200 },
    { key: "client", label: "관련거래처", width: 140 },
    { key: "inAmt", label: "입금액", type: "number", width: 120 },
    { key: "outAmt", label: "출금액", type: "number", width: 120 },
    { key: "balance", label: "잔액", readonly: true, width: 110 },
  ];

  const employeeCols: Col<Employee>[] = [
    { key: "id", label: "사번", width: 70 },
    { key: "name", label: "성명", width: 90 },
    { key: "dept", label: "부서", type: "select", options: DEPTS },
    { key: "rank", label: "직급", type: "select", options: RANKS },
    { key: "joined", label: "입사일", type: "date" },
    { key: "status", label: "재직상태", type: "select", options: EMP_STATUSES, width: 80 },
    { key: "phone", label: "휴대폰", width: 120 },
    { key: "email", label: "이메일", width: 160 },
    { key: "note", label: "비고", width: 140 },
  ];

  const payrollCols: Col<Payroll>[] = [
    { key: "month", label: "귀속연월", type: "month" },
    { key: "empId", label: "사번", type: "select", options: empIds, width: 70 },
    { key: "name", label: "성명", readonly: true, width: 70 },
    { key: "dept", label: "부서", readonly: true, width: 90 },
    { key: "base", label: "기본급", type: "number", width: 110 },
    { key: "allowance", label: "제수당", type: "number", width: 100 },
    { key: "gross", label: "지급총액", readonly: true, width: 100 },
    { key: "pension", label: "국민연금", type: "number", width: 90 },
    { key: "health", label: "건강보험", type: "number", width: 90 },
    { key: "care", label: "장기요양", type: "number", width: 80 },
    { key: "employment", label: "고용보험", type: "number", width: 80 },
    { key: "incomeTax", label: "소득세", type: "number", width: 90 },
    { key: "localTax", label: "지방소득세", type: "number", width: 80 },
    { key: "deductions", label: "공제총액", readonly: true, width: 100 },
    { key: "net", label: "실지급액", readonly: true, width: 110 },
    { key: "payDate", label: "지급일", type: "date" },
    { key: "note", label: "비고", width: 120 },
  ];

  // ─── 입력 편의: 공급가 입력 시 부가세 10% 자동, 급여 입력 시 4대보험 자동 ───
  const saleAuto = (row: Sale, key: string): Sale =>
    key === "supply" ? { ...row, vat: Math.round(row.supply * VAT_RATE) } : row;

  const purchaseAuto = (row: Purchase, key: string): Purchase =>
    key === "supply" ? { ...row, vat: Math.round(row.supply * VAT_RATE) } : row;

  const projectAuto = (row: Project, key: string): Project =>
    key === "amount" ? { ...row, vat: Math.round(row.amount * VAT_RATE) } : row;

  const payrollAuto = (row: Payroll, key: string): Payroll => {
    if (key === "base" || key === "allowance") {
      const gross = row.base + row.allowance;
      const health = Math.round(gross * INS_RATES.health);
      return {
        ...row,
        pension: Math.round(gross * INS_RATES.pension),
        health,
        care: Math.round(health * INS_RATES.care),
        employment: Math.round(gross * INS_RATES.employment),
      };
    }
    if (key === "incomeTax") return { ...row, localTax: Math.round(row.incomeTax * 0.1) };
    return row;
  };

  // ─── 행 추가 기본값 ─────────────────────────────────
  const today = () => new Date();

  const newClient = (): Client => ({
    code: nextCode(clientCodes, /^C(\d+)$/, (n) => `C${pad3(n)}`),
    name: "", type: "발주처", bizNo: "", ceo: "", manager: "", phone: "", email: "", scope: "", terms: "", note: "",
  });

  const newProject = (): Project => ({
    code: nextCode(projectCodes, new RegExp(`^PJ${year}-(\\d+)$`), (n) => `PJ${year}-${pad3(n)}`),
    name: "", clientCode: "", clientName: "", type: "관급공사",
    contractDate: today(), startDate: null, endDate: null,
    amount: 0, vat: 0, total: 0, status: "견적/입찰", progress: 0, manager: "", note: "",
  });

  const newSale = (): Sale => ({
    id: nextCode(data.sales.map((s) => s.id), new RegExp(`^S-${year}-(\\d+)$`), (n) => `S-${year}-${pad3(n)}`),
    date: today(), projectCode: "", projectName: "", clientCode: "", clientName: "",
    category: "기성금", desc: "", supply: 0, vat: 0, total: 0, invoiced: "N",
    dueDate: null, paidDate: null, paid: 0, unpaid: 0, status: "미수", note: "",
  });

  const newPurchase = (): Purchase => ({
    id: nextCode(data.purchases.map((p) => p.id), new RegExp(`^P-${year}-(\\d+)$`), (n) => `P-${year}-${pad3(n)}`),
    date: today(), projectCode: "", projectName: "", clientCode: "", clientName: "",
    account: "자재비", desc: "", supply: 0, vat: 0, total: 0,
    dueDate: null, paidDate: null, paid: 0, unpaid: 0, status: "미지급", note: "",
  });

  const newCash = (): CashEntry => ({
    date: today(), kind: "입금", account: BANKS[0], category: "공사대금입금",
    desc: "", client: "", inAmt: 0, outAmt: 0, balance: 0,
  });

  const newEmployee = (): Employee => ({
    id: nextCode(empIds, /^E(\d+)$/, (n) => `E${pad3(n)}`),
    name: "", dept: "경영지원부", rank: "사원", joined: today(), status: "재직", phone: "", email: "", note: "",
  });

  const newPayroll = (): Payroll => ({
    month: new Date(year, new Date().getMonth(), 1),
    empId: "", name: "", dept: "", base: 0, allowance: 0, gross: 0,
    pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0,
    deductions: 0, net: 0, payDate: null, note: "",
  });

  return (
    <div className="card">
      <div className="filter-bar">
        <div className="sheet-picker">
          {SHEETS.map((s) => (
            <button
              key={s.key}
              className={`sheet-chip${sheet === s.key ? " active" : ""}`}
              onClick={() => setSheet(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {savedAt && <span className="saved-note">✓ {savedAt} 저장됨</span>}
      </div>

      <div className="hint">
        저장한 변경은 <b>이 브라우저에만</b> 반영됩니다. 엑셀 원본에 반영하려면 상단의{" "}
        <b>「엑셀 다운로드」</b>로 내려받아 기존 파일과 교체하세요. (다운로드 파일은 값만 담긴
        스냅샷으로, 원본의 수식·드롭다운은 포함되지 않습니다)
      </div>

      {sheet === "clients" && (
        <EditTable rows={data.clients} cols={clientCols} newRow={newClient}
          onSave={(rows) => save("clients", rows)} />
      )}
      {sheet === "projects" && (
        <EditTable rows={data.projects} cols={projectCols} newRow={newProject}
          onCellChange={projectAuto} onSave={(rows) => save("projects", rows)} />
      )}
      {sheet === "sales" && (
        <EditTable rows={data.sales} cols={saleCols} newRow={newSale}
          onCellChange={saleAuto} onSave={(rows) => save("sales", rows)} />
      )}
      {sheet === "purchases" && (
        <EditTable rows={data.purchases} cols={purchaseCols} newRow={newPurchase}
          onCellChange={purchaseAuto} onSave={(rows) => save("purchases", rows)} />
      )}
      {sheet === "cash" && (
        <EditTable rows={data.cash} cols={cashCols} newRow={newCash}
          onSave={(rows) => save("cash", rows)} />
      )}
      {sheet === "employees" && (
        <EditTable rows={data.employees} cols={employeeCols} newRow={newEmployee}
          onSave={(rows) => save("employees", rows)} />
      )}
      {sheet === "payroll" && (
        <EditTable rows={data.payroll} cols={payrollCols} newRow={newPayroll}
          onCellChange={payrollAuto} onSave={(rows) => save("payroll", rows)} />
      )}
    </div>
  );
}
