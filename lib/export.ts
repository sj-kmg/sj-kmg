// 현재 데이터를 원본과 동일한 시트/헤더 규격의 엑셀로 내보낸다.
// 값만 담긴 스냅샷이며(수식·서식·드롭다운 없음) 대시보드에 다시 불러올 수 있다.
import * as XLSX from "xlsx";
import type { SJData } from "./types";

type Kind = "text" | "num" | "date" | "ym" | "pct";

function makeSheet(headers: string[], kinds: Kind[], rows: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows], { cellDates: true });
  const ref = ws["!ref"];
  if (ref) {
    const range = XLSX.utils.decode_range(ref);
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        if (kinds[c] === "num" && cell.t === "n") cell.z = "#,##0";
        if (kinds[c] === "pct" && cell.t === "n") cell.z = "0%";
        if (kinds[c] === "date" && (cell.t === "d" || cell.t === "n")) cell.z = "yyyy-mm-dd";
        if (kinds[c] === "ym" && (cell.t === "d" || cell.t === "n")) cell.z = "yyyy-mm";
      }
    }
  }
  ws["!cols"] = headers.map((h, i) => ({
    wch: Math.max(10, h.length * 2 + (kinds[i] === "text" ? 6 : 4)),
  }));
  return ws;
}

export function buildWorkbook(d: SJData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["거래처코드", "거래처명", "구분", "사업자번호", "대표자", "담당자", "연락처", "이메일", "주요거래내용", "결제조건", "비고"],
      ["text", "text", "text", "text", "text", "text", "text", "text", "text", "text", "text"],
      d.clients.map((c) => [c.code, c.name, c.type, c.bizNo, c.ceo, c.manager, c.phone, c.email, c.scope, c.terms, c.note])
    ),
    "거래처"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["프로젝트코드", "프로젝트명", "발주처코드", "발주처명", "공사구분", "계약일", "착공일", "준공예정일",
       "계약금액(공급가액,원)", "부가세(원)", "총계약금액(원)", "진행상태", "진행률", "담당자", "비고"],
      ["text", "text", "text", "text", "text", "date", "date", "date", "num", "num", "num", "text", "pct", "text", "text"],
      d.projects.map((p) => [p.code, p.name, p.clientCode, p.clientName, p.type, p.contractDate, p.startDate, p.endDate,
        p.amount, p.vat, p.total, p.status, p.progress, p.manager, p.note])
    ),
    "프로젝트"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["매출ID", "청구일자", "프로젝트코드", "프로젝트명", "거래처코드", "거래처명", "청구구분", "내용",
       "공급가액(원)", "부가세(원)", "합계(원)", "계산서발행", "수금예정일", "수금일", "수금액(원)", "미수금(원)", "수금상태", "비고"],
      ["text", "date", "text", "text", "text", "text", "text", "text",
       "num", "num", "num", "text", "date", "date", "num", "num", "text", "text"],
      d.sales.map((s) => [s.id, s.date, s.projectCode, s.projectName, s.clientCode, s.clientName, s.category, s.desc,
        s.supply, s.vat, s.total, s.invoiced, s.dueDate, s.paidDate, s.paid, s.unpaid, s.status, s.note])
    ),
    "매출"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["매입ID", "일자", "프로젝트코드", "프로젝트명", "거래처코드", "거래처명", "계정과목", "내용",
       "공급가액(원)", "부가세(원)", "합계(원)", "지급예정일", "지급일", "지급액(원)", "미지급금(원)", "지급상태", "비고"],
      ["text", "date", "text", "text", "text", "text", "text", "text",
       "num", "num", "num", "date", "date", "num", "num", "text", "text"],
      d.purchases.map((p) => [p.id, p.date, p.projectCode, p.projectName, p.clientCode, p.clientName, p.account, p.desc,
        p.supply, p.vat, p.total, p.dueDate, p.paidDate, p.paid, p.unpaid, p.status, p.note])
    ),
    "매입"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["일자", "구분", "계좌", "항목", "내용", "관련거래처", "입금액(원)", "출금액(원)", "잔액(원)"],
      ["date", "text", "text", "text", "text", "text", "num", "num", "num"],
      d.cash.map((c) => [c.date, c.kind, c.account, c.category, c.desc, c.client,
        c.inAmt || null, c.outAmt || null, c.balance])
    ),
    "자금일보"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["사번", "성명", "부서", "직급", "입사일", "재직상태", "휴대폰", "이메일", "비고"],
      ["text", "text", "text", "text", "date", "text", "text", "text", "text"],
      d.employees.map((e) => [e.id, e.name, e.dept, e.rank, e.joined, e.status, e.phone, e.email, e.note])
    ),
    "인사명부"
  );

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["귀속연월", "사번", "성명", "부서", "기본급(원)", "제수당(원)", "지급총액(원)", "국민연금(원)", "건강보험(원)",
       "장기요양(원)", "고용보험(원)", "소득세(원)", "지방소득세(원)", "공제총액(원)", "실지급액(원)", "지급일", "비고"],
      ["ym", "text", "text", "text", "num", "num", "num", "num", "num",
       "num", "num", "num", "num", "num", "num", "date", "text"],
      d.payroll.map((p) => [p.month, p.empId, p.name, p.dept, p.base, p.allowance, p.gross, p.pension, p.health,
        p.care, p.employment, p.incomeTax, p.localTax, p.deductions, p.net, p.payDate, p.note])
    ),
    "급여대장"
  );

  return wb;
}

export function downloadExcel(d: SJData): void {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const name = `sj-data_${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}.xlsx`;
  XLSX.writeFile(buildWorkbook(d), name, { cellDates: true });
}
