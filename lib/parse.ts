// 엑셀 파일 파싱 — 브라우저 안에서만 실행되며 데이터는 외부로 전송되지 않는다.
// 시트명/헤더명은 data/sj-data.xlsx의 규격과 일치해야 한다 (사용안내 시트 참고).
import * as XLSX from "xlsx";
import type { SJData, Sale, Purchase } from "./types";
import { payStatus } from "./recompute";

const REQUIRED_SHEETS = ["거래처", "프로젝트", "매출", "매입", "자금일보", "인사명부", "급여대장"];

type Row = Record<string, unknown>;

function num(v: unknown): number {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[,\s원]/g, ""));
    return isFinite(n) ? n : 0;
  }
  return 0;
}

// 셀이 비어있으면 fallback(웹 재계산값), 값이 있으면 그 값을 사용
function numOr(v: unknown, fallback: number): number {
  return v === null || v === undefined || v === "" ? fallback : num(v);
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

// SheetJS가 날짜 셀을 읽을 때 타임존 보정 오차(수십 초)로 자정 직전 시각이 나올 수 있다.
// 데이터 파일의 날짜는 전부 순수 날짜이므로, 로컬 기준 가장 가까운 자정으로 반올림해 보정한다.
function normalizeDate(d: Date): Date {
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (d.getHours() >= 12) midnight.setDate(midnight.getDate() + 1);
  return midnight;
}

function asDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : normalizeDate(v);
  if (typeof v === "number" && v > 0) {
    // 엑셀 날짜 일련번호 fallback
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : normalizeDate(d);
  }
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v.trim());
    return isNaN(d.getTime()) ? null : normalizeDate(d);
  }
  return null;
}

export function parseWorkbook(buf: ArrayBuffer, fileName: string): SJData {
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
  if (missing.length > 0) {
    throw new Error(
      `필수 시트가 없습니다: ${missing.join(", ")}\n데이터 규격 파일(sj-data.xlsx)이 맞는지 확인하세요.`
    );
  }

  const rows = (name: string): Row[] =>
    XLSX.utils.sheet_to_json<Row>(wb.Sheets[name], { defval: null });

  const clients = rows("거래처")
    .filter((r) => str(r["거래처코드"]))
    .map((r) => ({
      code: str(r["거래처코드"]),
      name: str(r["거래처명"]),
      type: str(r["구분"]),
      bizNo: str(r["사업자번호"]),
      ceo: str(r["대표자"]),
      manager: str(r["담당자"]),
      phone: str(r["연락처"]),
      email: str(r["이메일"]),
      scope: str(r["주요거래내용"]),
      terms: str(r["결제조건"]),
      note: str(r["비고"]),
    }));

  const clientName = (code: string) => clients.find((c) => c.code === code)?.name ?? "";

  const projects = rows("프로젝트")
    .filter((r) => str(r["프로젝트코드"]))
    .map((r) => {
      const amount = num(r["계약금액(공급가액,원)"]);
      const vat = numOr(r["부가세(원)"], Math.round(amount * 0.1));
      const code = str(r["발주처코드"]);
      return {
        code: str(r["프로젝트코드"]),
        name: str(r["프로젝트명"]),
        clientCode: code,
        clientName: str(r["발주처명"]) || clientName(code),
        type: str(r["공사구분"]),
        contractDate: asDate(r["계약일"]),
        startDate: asDate(r["착공일"]),
        endDate: asDate(r["준공예정일"]),
        amount,
        vat,
        total: amount + vat,
        status: str(r["진행상태"]),
        progress: num(r["진행률"]),
        manager: str(r["담당자"]),
        note: str(r["비고"]),
      };
    });

  const projectName = (code: string) => projects.find((p) => p.code === code)?.name ?? "";

  const sales: Sale[] = rows("매출")
    .filter((r) => str(r["매출ID"]))
    .map((r) => {
      const supply = num(r["공급가액(원)"]);
      const vat = numOr(r["부가세(원)"], Math.round(supply * 0.1));
      const total = supply + vat;
      const paid = num(r["수금액(원)"]);
      const pjCode = str(r["프로젝트코드"]);
      const clCode = str(r["거래처코드"]);
      return {
        id: str(r["매출ID"]),
        date: asDate(r["청구일자"]),
        projectCode: pjCode,
        projectName: str(r["프로젝트명"]) || projectName(pjCode),
        clientCode: clCode,
        clientName: str(r["거래처명"]) || clientName(clCode),
        category: str(r["청구구분"]),
        desc: str(r["내용"]),
        supply,
        vat,
        total,
        invoiced: str(r["계산서발행"]),
        dueDate: asDate(r["수금예정일"]),
        paidDate: asDate(r["수금일"]),
        paid,
        unpaid: total - paid,
        status: payStatus(total, paid, "수금완료", "부분수금", "미수"),
        note: str(r["비고"]),
      };
    });

  const purchases: Purchase[] = rows("매입")
    .filter((r) => str(r["매입ID"]))
    .map((r) => {
      const supply = num(r["공급가액(원)"]);
      const vat = numOr(r["부가세(원)"], Math.round(supply * 0.1));
      const total = supply + vat;
      const paid = num(r["지급액(원)"]);
      const pjCode = str(r["프로젝트코드"]);
      const clCode = str(r["거래처코드"]);
      return {
        id: str(r["매입ID"]),
        date: asDate(r["일자"]),
        projectCode: pjCode,
        projectName: str(r["프로젝트명"]) || projectName(pjCode),
        clientCode: clCode,
        clientName: str(r["거래처명"]) || clientName(clCode),
        account: str(r["계정과목"]),
        desc: str(r["내용"]),
        supply,
        vat,
        total,
        dueDate: asDate(r["지급예정일"]),
        paidDate: asDate(r["지급일"]),
        paid,
        unpaid: total - paid,
        status: payStatus(total, paid, "지급완료", "부분지급", "미지급"),
        note: str(r["비고"]),
      };
    });

  // 자금일보: 잔액은 엑셀 수식 캐시에 의존하지 않고 웹에서 누계 재계산
  let running = 0;
  const cash = rows("자금일보")
    .filter((r) => asDate(r["일자"]) !== null)
    .map((r) => {
      const inAmt = num(r["입금액(원)"]);
      const outAmt = num(r["출금액(원)"]);
      running += inAmt - outAmt;
      return {
        date: asDate(r["일자"]),
        kind: str(r["구분"]),
        account: str(r["계좌"]),
        category: str(r["항목"]),
        desc: str(r["내용"]),
        client: str(r["관련거래처"]),
        inAmt,
        outAmt,
        balance: running,
      };
    });

  const employees = rows("인사명부")
    .filter((r) => str(r["사번"]))
    .map((r) => ({
      id: str(r["사번"]),
      name: str(r["성명"]),
      dept: str(r["부서"]),
      rank: str(r["직급"]),
      joined: asDate(r["입사일"]),
      status: str(r["재직상태"]),
      phone: str(r["휴대폰"]),
      email: str(r["이메일"]),
      note: str(r["비고"]),
    }));

  const empOf = (id: string) => employees.find((e) => e.id === id);

  const payroll = rows("급여대장")
    .filter((r) => str(r["사번"]))
    .map((r) => {
      const base = num(r["기본급(원)"]);
      const allowance = num(r["제수당(원)"]);
      const gross = numOr(r["지급총액(원)"], base + allowance);
      const pension = num(r["국민연금(원)"]);
      const health = num(r["건강보험(원)"]);
      const care = num(r["장기요양(원)"]);
      const employment = num(r["고용보험(원)"]);
      const incomeTax = num(r["소득세(원)"]);
      const localTax = num(r["지방소득세(원)"]);
      const deductions = numOr(
        r["공제총액(원)"],
        pension + health + care + employment + incomeTax + localTax
      );
      const empId = str(r["사번"]);
      return {
        month: asDate(r["귀속연월"]),
        empId,
        name: str(r["성명"]) || empOf(empId)?.name || "",
        dept: str(r["부서"]) || empOf(empId)?.dept || "",
        base,
        allowance,
        gross,
        pension,
        health,
        care,
        employment,
        incomeTax,
        localTax,
        deductions,
        net: numOr(r["실지급액(원)"], gross - deductions),
        payDate: asDate(r["지급일"]),
        note: str(r["비고"]),
      };
    });

  return {
    fileName,
    loadedAt: new Date().toISOString(),
    clients,
    projects,
    sales,
    purchases,
    cash,
    employees,
    payroll,
  };
}
