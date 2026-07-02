// 브라우저 localStorage 캐시 — 데이터는 이 PC의 브라우저에만 저장된다.
import type { SJData } from "./types";

const KEY = "sj-dashboard-data-v1";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function saveData(data: SJData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장 실패(용량 초과 등)해도 화면 표시에는 지장 없음
  }
}

export function loadData(): SJData | null {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return null;
    return JSON.parse(text, (_k, v) =>
      typeof v === "string" && ISO_DATE.test(v) && _k !== "loadedAt" ? new Date(v) : v
    ) as SJData;
  } catch {
    return null;
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
