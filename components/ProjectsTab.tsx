"use client";

import { useState } from "react";
import type { SJData } from "@/lib/types";
import { fmt, fmtDate } from "@/lib/calc";
import { Badge, ProgressBar } from "./ui";

export default function ProjectsTab({ data }: { data: SJData }) {
  const [status, setStatus] = useState("전체");
  const statuses = ["전체", ...new Set(data.projects.map((p) => p.status).filter(Boolean))];
  const list = data.projects.filter((p) => status === "전체" || p.status === status);
  const totalAmount = list.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="card">
      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="chip-sum">
          {list.length}건 · 계약금액(공급가) 합계 <b>{fmt(totalAmount)}원</b>
        </span>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>코드</th>
              <th>프로젝트명</th>
              <th>발주처</th>
              <th>공사구분</th>
              <th className="num">계약금액(공급가)</th>
              <th className="num">총계약금액</th>
              <th>상태</th>
              <th>진행률</th>
              <th>계약일</th>
              <th>준공예정</th>
              <th>담당자</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.code}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.clientName}</td>
                <td>{p.type}</td>
                <td className="num">{fmt(p.amount)}</td>
                <td className="num">{fmt(p.total)}</td>
                <td>
                  <Badge value={p.status} />
                </td>
                <td>
                  <ProgressBar ratio={p.progress} />
                </td>
                <td>{fmtDate(p.contractDate)}</td>
                <td>{fmtDate(p.endDate)}</td>
                <td>{p.manager}</td>
                <td>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
