"use client";

// 제네릭 편집 테이블 — 시트별 컬럼 정의(Col)만 넘기면 인라인 편집/행 추가/삭제를 제공한다.
// 저장 전까지는 draft에만 반영되고, 저장 시 onSave로 전체 행을 넘긴다.
import { useEffect, useState } from "react";
import { fmt, fmtDate, fmtYm } from "@/lib/calc";

export interface Col<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "date" | "month" | "select" | "percent";
  options?: string[];
  readonly?: boolean; // 파생값 — 저장 시 자동 재계산됨
  width?: number;
}

function dateInputValue(v: unknown): string {
  return v instanceof Date && !isNaN(v.getTime()) ? fmtDate(v) : "";
}

function monthInputValue(v: unknown): string {
  return v instanceof Date && !isNaN(v.getTime()) ? fmtYm(v) : "";
}

// "yyyy-mm-dd" → 로컬 자정 Date (new Date(문자열)은 UTC로 해석돼 시간대가 어긋난다)
function localDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function EditTable<T extends object>({
  rows,
  cols,
  onSave,
  onCellChange,
  newRow,
}: {
  rows: T[];
  cols: Col<T>[];
  onSave: (rows: T[]) => void;
  onCellChange?: (row: T, key: string) => T;
  newRow: () => T;
}) {
  const [draft, setDraft] = useState<T[]>(() => structuredClone(rows));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(structuredClone(rows));
    setDirty(false);
  }, [rows]);

  const update = (i: number, key: string, value: unknown) => {
    setDraft((prev) => {
      const next = [...prev];
      let row = { ...next[i], [key]: value } as T;
      if (onCellChange) row = onCellChange(row, key);
      next[i] = row;
      return next;
    });
    setDirty(true);
  };

  const removeRow = (i: number) => {
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const addRow = () => {
    setDraft((prev) => [...prev, newRow()]);
    setDirty(true);
  };

  const renderCell = (row: T, i: number, col: Col<T>) => {
    const v = row[col.key] as unknown;
    const style = col.width ? { minWidth: col.width } : undefined;

    if (col.readonly) {
      const text =
        v instanceof Date ? fmtDate(v) : typeof v === "number" ? fmt(v) : String(v ?? "");
      return (
        <td key={col.key} className="ro num" style={style}>
          {text}
        </td>
      );
    }

    let input: React.ReactNode;
    switch (col.type) {
      case "number":
        input = (
          <input
            type="number"
            value={typeof v === "number" ? v : 0}
            onChange={(e) => update(i, col.key, Number(e.target.value) || 0)}
          />
        );
        break;
      case "percent":
        input = (
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round((typeof v === "number" ? v : 0) * 100)}
            onChange={(e) => update(i, col.key, (Number(e.target.value) || 0) / 100)}
          />
        );
        break;
      case "date":
        input = (
          <input
            type="date"
            value={dateInputValue(v)}
            onChange={(e) => update(i, col.key, localDate(e.target.value))}
          />
        );
        break;
      case "month":
        input = (
          <input
            type="month"
            value={monthInputValue(v)}
            onChange={(e) =>
              update(i, col.key, e.target.value ? localDate(`${e.target.value}-01`) : null)
            }
          />
        );
        break;
      case "select": {
        const current = String(v ?? "");
        const options =
          current && !(col.options ?? []).includes(current)
            ? [current, ...(col.options ?? [])]
            : col.options ?? [];
        input = (
          <select value={current} onChange={(e) => update(i, col.key, e.target.value)}>
            <option value="">-</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
        break;
      }
      default:
        input = (
          <input
            type="text"
            value={String(v ?? "")}
            onChange={(e) => update(i, col.key, e.target.value)}
          />
        );
    }
    return (
      <td key={col.key} style={style}>
        {input}
      </td>
    );
  };

  return (
    <div>
      <div className="tbl-wrap edit-table">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key}>
                  {c.label}
                  {c.readonly ? " ⚙" : ""}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => renderCell(row, i, c))}
                <td>
                  <button
                    className="btn-del"
                    title="행 삭제"
                    onClick={() => removeRow(i)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="edit-actions">
        <button className="btn-line" onClick={addRow}>
          ＋ 행 추가
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="btn-line"
          disabled={!dirty}
          onClick={() => {
            setDraft(structuredClone(rows));
            setDirty(false);
          }}
        >
          취소
        </button>
        <button className="btn-solid" disabled={!dirty} onClick={() => onSave(draft)}>
          변경사항 저장
        </button>
      </div>
      <p className="edit-note">⚙ 표시 열은 저장 시 자동 계산됩니다 (합계·미수금·잔액·상태 등)</p>
    </div>
  );
}
