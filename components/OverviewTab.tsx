"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { SJData } from "@/lib/types";
import { calcKpis, monthlySeries, fmt, fmtShort, fmtDate, isOverdue } from "@/lib/calc";
import { KpiCard, Badge, ProgressBar } from "./ui";

const tooltipFmt = (v: number | string | (number | string)[]) =>
  typeof v === "number" ? `${fmt(v)}원` : String(v);

export default function OverviewTab({ data, year }: { data: SJData; year: number }) {
  const k = calcKpis(data);
  const monthly = monthlySeries(data, year);
  const cashSeries = data.cash.map((c) => ({
    label: fmtDate(c.date).slice(5),
    잔액: c.balance,
  }));
  const topUnpaid = data.sales
    .filter((s) => s.unpaid > 0)
    .sort((a, b) => b.unpaid - a.unpaid)
    .slice(0, 5);
  const active = data.projects.filter((p) => p.status === "진행중");

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="진행중 프로젝트" value={k.activeProjects} suffix="건" />
        <KpiCard label="수주잔고 (진행중 계약금액)" value={k.backlog} />
        <KpiCard label={`누적 매출 · 공급가액`} value={k.totalSales} />
        <KpiCard label={`누적 매입 · 공급가액`} value={k.totalPurchases} />
        <KpiCard label="매출총이익" value={k.grossProfit} />
        <KpiCard label="미수금 잔액" value={k.receivables} warn />
        <KpiCard label="미지급금 잔액" value={k.payables} warn />
        <KpiCard label="현금 잔액 (자금일보)" value={k.cashBalance} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>{year}년 월별 매출·매입 (공급가액)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => fmtShort(Number(v))} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={tooltipFmt} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" name="매출" fill="#2e75b6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="purchases" name="매입" fill="#c55a11" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>현금 잔액 추이</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => fmtShort(Number(v))} tick={{ fontSize: 11 }} width={56} />
              <Tooltip formatter={tooltipFmt} />
              <Line type="monotone" dataKey="잔액" stroke="#1f4e79" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>미수금 상위 5건</h3>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>거래처</th>
                  <th>프로젝트</th>
                  <th className="num">미수금</th>
                  <th>수금예정일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {topUnpaid.length === 0 && (
                  <tr>
                    <td colSpan={5}>미수금이 없습니다 👍</td>
                  </tr>
                )}
                {topUnpaid.map((s) => (
                  <tr key={s.id} className={isOverdue(s.dueDate, s.unpaid) ? "overdue" : ""}>
                    <td>{s.clientName}</td>
                    <td>{s.projectName}</td>
                    <td className="num">{fmt(s.unpaid)}</td>
                    <td>
                      {fmtDate(s.dueDate)}
                      {isOverdue(s.dueDate, s.unpaid) && " ⚠️"}
                    </td>
                    <td>
                      <Badge value={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>진행중 프로젝트</h3>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>프로젝트</th>
                  <th className="num">계약금액</th>
                  <th>진행률</th>
                  <th>준공예정</th>
                </tr>
              </thead>
              <tbody>
                {active.map((p) => (
                  <tr key={p.code}>
                    <td>{p.name}</td>
                    <td className="num">{fmt(p.amount)}</td>
                    <td>
                      <ProgressBar ratio={p.progress} />
                    </td>
                    <td>{fmtDate(p.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
