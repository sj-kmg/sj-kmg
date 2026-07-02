"use client";

import { useState } from "react";
import type { SJData } from "@/lib/types";
import { fmt, fmtDate, fmtYm, payrollMonths } from "@/lib/calc";
import { Badge } from "./ui";

export default function HrTab({ data }: { data: SJData }) {
  const months = payrollMonths(data);
  const [month, setMonth] = useState(months[0] ?? "");

  const active = data.employees.filter((e) => e.status === "재직");
  const roster = data.employees;
  const pays = data.payroll.filter((p) => fmtYm(p.month) === month);
  const sum = (f: (p: (typeof pays)[number]) => number) => pays.reduce((a, r) => a + f(r), 0);

  return (
    <div>
      <div className="card">
        <h3>
          인사명부 — 재직 {active.length}명 / 전체 {roster.length}명
        </h3>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>사번</th>
                <th>성명</th>
                <th>부서</th>
                <th>직급</th>
                <th>입사일</th>
                <th>재직상태</th>
                <th>휴대폰</th>
                <th>이메일</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.name}</td>
                  <td>{e.dept}</td>
                  <td>{e.rank}</td>
                  <td>{fmtDate(e.joined)}</td>
                  <td>
                    <Badge value={e.status} />
                  </td>
                  <td>{e.phone}</td>
                  <td>{e.email}</td>
                  <td>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <h3 style={{ marginBottom: 0 }}>급여대장</h3>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <span className="chip-sum">
            {pays.length}명 · 지급총액 <b>{fmt(sum((p) => p.gross))}원</b> · 실지급{" "}
            <b>{fmt(sum((p) => p.net))}원</b>
          </span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>사번</th>
                <th>성명</th>
                <th>부서</th>
                <th className="num">기본급</th>
                <th className="num">제수당</th>
                <th className="num">지급총액</th>
                <th className="num">4대보험</th>
                <th className="num">소득세(지방포함)</th>
                <th className="num">공제총액</th>
                <th className="num">실지급액</th>
                <th>지급일</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p, i) => (
                <tr key={`${p.empId}-${i}`}>
                  <td>{p.empId}</td>
                  <td>{p.name}</td>
                  <td>{p.dept}</td>
                  <td className="num">{fmt(p.base)}</td>
                  <td className="num">{fmt(p.allowance)}</td>
                  <td className="num">{fmt(p.gross)}</td>
                  <td className="num">{fmt(p.pension + p.health + p.care + p.employment)}</td>
                  <td className="num">{fmt(p.incomeTax + p.localTax)}</td>
                  <td className="num">{fmt(p.deductions)}</td>
                  <td className="num">{fmt(p.net)}</td>
                  <td>{fmtDate(p.payDate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>합계</td>
                <td className="num">{fmt(sum((p) => p.base))}</td>
                <td className="num">{fmt(sum((p) => p.allowance))}</td>
                <td className="num">{fmt(sum((p) => p.gross))}</td>
                <td className="num">{fmt(sum((p) => p.pension + p.health + p.care + p.employment))}</td>
                <td className="num">{fmt(sum((p) => p.incomeTax + p.localTax))}</td>
                <td className="num">{fmt(sum((p) => p.deductions))}</td>
                <td className="num">{fmt(sum((p) => p.net))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
