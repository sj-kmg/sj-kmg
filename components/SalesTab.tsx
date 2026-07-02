"use client";

import { useState } from "react";
import type { SJData } from "@/lib/types";
import { fmt, fmtDate, isOverdue } from "@/lib/calc";
import { Badge } from "./ui";

export default function SalesTab({ data }: { data: SJData }) {
  const [status, setStatus] = useState("전체");
  const [project, setProject] = useState("전체");

  const projects = ["전체", ...new Set(data.sales.map((s) => s.projectName).filter(Boolean))];
  const list = data.sales.filter(
    (s) =>
      (status === "전체" || s.status === status) &&
      (project === "전체" || s.projectName === project)
  );
  const sum = (f: (s: (typeof list)[number]) => number) => list.reduce((a, r) => a + f(r), 0);

  return (
    <div className="card">
      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["전체", "미수", "부분수금", "수금완료"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          {projects.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="chip-sum">
          {list.length}건 · 청구 <b>{fmt(sum((s) => s.total))}원</b> · 수금{" "}
          <b>{fmt(sum((s) => s.paid))}원</b> · 미수 <b>{fmt(sum((s) => s.unpaid))}원</b>
        </span>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>매출ID</th>
              <th>청구일자</th>
              <th>프로젝트</th>
              <th>거래처</th>
              <th>구분</th>
              <th>내용</th>
              <th className="num">공급가액</th>
              <th className="num">합계(VAT포함)</th>
              <th>수금예정</th>
              <th>수금일</th>
              <th className="num">수금액</th>
              <th className="num">미수금</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className={isOverdue(s.dueDate, s.unpaid) ? "overdue" : ""}>
                <td>{s.id}</td>
                <td>{fmtDate(s.date)}</td>
                <td>{s.projectName}</td>
                <td>{s.clientName}</td>
                <td>{s.category}</td>
                <td>{s.desc}</td>
                <td className="num">{fmt(s.supply)}</td>
                <td className="num">{fmt(s.total)}</td>
                <td>
                  {fmtDate(s.dueDate)}
                  {isOverdue(s.dueDate, s.unpaid) && " ⚠️"}
                </td>
                <td>{fmtDate(s.paidDate)}</td>
                <td className="num">{fmt(s.paid)}</td>
                <td className="num">{fmt(s.unpaid)}</td>
                <td>
                  <Badge value={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>합계</td>
              <td className="num">{fmt(sum((s) => s.supply))}</td>
              <td className="num">{fmt(sum((s) => s.total))}</td>
              <td colSpan={2}></td>
              <td className="num">{fmt(sum((s) => s.paid))}</td>
              <td className="num">{fmt(sum((s) => s.unpaid))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
