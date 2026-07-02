"use client";

import { useState } from "react";
import type { SJData } from "@/lib/types";
import { fmt, fmtDate, isOverdue } from "@/lib/calc";
import { Badge } from "./ui";

export default function PurchasesTab({ data }: { data: SJData }) {
  const [status, setStatus] = useState("전체");
  const [account, setAccount] = useState("전체");

  const accounts = ["전체", ...new Set(data.purchases.map((p) => p.account).filter(Boolean))];
  const list = data.purchases.filter(
    (p) =>
      (status === "전체" || p.status === status) &&
      (account === "전체" || p.account === account)
  );
  const sum = (f: (p: (typeof list)[number]) => number) => list.reduce((a, r) => a + f(r), 0);

  return (
    <div className="card">
      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["전체", "미지급", "부분지급", "지급완료"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          {accounts.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <span className="chip-sum">
          {list.length}건 · 매입 <b>{fmt(sum((p) => p.total))}원</b> · 지급{" "}
          <b>{fmt(sum((p) => p.paid))}원</b> · 미지급 <b>{fmt(sum((p) => p.unpaid))}원</b>
        </span>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>매입ID</th>
              <th>일자</th>
              <th>프로젝트</th>
              <th>거래처</th>
              <th>계정과목</th>
              <th>내용</th>
              <th className="num">공급가액</th>
              <th className="num">합계(VAT포함)</th>
              <th>지급예정</th>
              <th>지급일</th>
              <th className="num">지급액</th>
              <th className="num">미지급금</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={isOverdue(p.dueDate, p.unpaid) ? "overdue" : ""}>
                <td>{p.id}</td>
                <td>{fmtDate(p.date)}</td>
                <td>{p.projectName || "본사"}</td>
                <td>{p.clientName || "-"}</td>
                <td>{p.account}</td>
                <td>{p.desc}</td>
                <td className="num">{fmt(p.supply)}</td>
                <td className="num">{fmt(p.total)}</td>
                <td>
                  {fmtDate(p.dueDate)}
                  {isOverdue(p.dueDate, p.unpaid) && " ⚠️"}
                </td>
                <td>{fmtDate(p.paidDate)}</td>
                <td className="num">{fmt(p.paid)}</td>
                <td className="num">{fmt(p.unpaid)}</td>
                <td>
                  <Badge value={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>합계</td>
              <td className="num">{fmt(sum((p) => p.supply))}</td>
              <td className="num">{fmt(sum((p) => p.total))}</td>
              <td colSpan={2}></td>
              <td className="num">{fmt(sum((p) => p.paid))}</td>
              <td className="num">{fmt(sum((p) => p.unpaid))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
