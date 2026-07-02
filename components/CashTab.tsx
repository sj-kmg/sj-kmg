"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { SJData } from "@/lib/types";
import { fmt, fmtShort, fmtDate } from "@/lib/calc";

export default function CashTab({ data }: { data: SJData }) {
  const series = data.cash.map((c) => ({ label: fmtDate(c.date).slice(5), 잔액: c.balance }));
  const latest = [...data.cash].reverse(); // 최신 내역 먼저
  const totalIn = data.cash.reduce((s, c) => s + c.inAmt, 0);
  const totalOut = data.cash.reduce((s, c) => s + c.outAmt, 0);
  const balance = data.cash.length > 0 ? data.cash[data.cash.length - 1].balance : 0;

  return (
    <div>
      <div className="card">
        <h3>
          현금 잔액 추이 — 현재 잔액 <b style={{ color: "#1f4e79" }}>{fmt(balance)}원</b>
          <span className="chip-sum" style={{ marginLeft: 12 }}>
            (총 입금 {fmt(totalIn)}원 · 총 출금 {fmt(totalOut)}원)
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => fmtShort(Number(v))} tick={{ fontSize: 11 }} width={56} />
            <Tooltip formatter={(v) => (typeof v === "number" ? `${fmt(v)}원` : String(v))} />
            <Line type="monotone" dataKey="잔액" stroke="#1f4e79" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>입출금 내역 (최신순)</h3>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>일자</th>
                <th>구분</th>
                <th>계좌</th>
                <th>항목</th>
                <th>내용</th>
                <th>관련거래처</th>
                <th className="num">입금액</th>
                <th className="num">출금액</th>
                <th className="num">잔액</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((c, i) => (
                <tr key={i}>
                  <td>{fmtDate(c.date)}</td>
                  <td>
                    <span
                      className={`badge ${
                        c.kind === "입금" ? "blue" : c.kind === "출금" ? "red" : "gray"
                      }`}
                    >
                      {c.kind || "-"}
                    </span>
                  </td>
                  <td>{c.account}</td>
                  <td>{c.category}</td>
                  <td>{c.desc}</td>
                  <td>{c.client || "-"}</td>
                  <td className="num" style={{ color: "#2e75b6" }}>
                    {c.inAmt ? fmt(c.inAmt) : ""}
                  </td>
                  <td className="num" style={{ color: "#c62828" }}>
                    {c.outAmt ? fmt(c.outAmt) : ""}
                  </td>
                  <td className="num">{fmt(c.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
