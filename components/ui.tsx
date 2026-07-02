import { fmt, fmtShort } from "@/lib/calc";

export function KpiCard({
  label,
  value,
  warn = false,
  suffix = "",
}: {
  label: string;
  value: number;
  warn?: boolean;
  suffix?: string;
}) {
  return (
    <div className={`kpi${warn && value > 0 ? " warn" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">
        {suffix ? `${fmt(value)}${suffix}` : fmtShort(value)}
      </div>
      {!suffix && <div className="sub">{fmt(value)}원</div>}
    </div>
  );
}

const BADGE_COLOR: Record<string, string> = {
  수금완료: "green",
  지급완료: "green",
  부분수금: "amber",
  부분지급: "amber",
  미수: "red",
  미지급: "red",
  진행중: "blue",
  계약: "blue",
  준공: "gray",
  하자보수: "gray",
  "견적/입찰": "amber",
  "중단/보류": "red",
  재직: "green",
  휴직: "amber",
  퇴사: "gray",
};

export function Badge({ value }: { value: string }) {
  if (!value) return <span>-</span>;
  return <span className={`badge ${BADGE_COLOR[value] ?? "gray"}`}>{value}</span>;
}

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <span>
      <span className="progress">
        <div style={{ width: `${pct}%` }} />
      </span>
      <span className="progress-label">{pct}%</span>
    </span>
  );
}
