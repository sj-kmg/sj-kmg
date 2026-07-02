"use client";

import { useEffect, useRef, useState } from "react";
import type { SJData } from "@/lib/types";
import { parseWorkbook } from "@/lib/parse";
import { saveData, loadData, clearData } from "@/lib/store";
import { dataYears } from "@/lib/calc";
import { recomputeAll } from "@/lib/recompute";
import { downloadExcel } from "@/lib/export";
import FileLoader from "@/components/FileLoader";
import OverviewTab from "@/components/OverviewTab";
import ProjectsTab from "@/components/ProjectsTab";
import SalesTab from "@/components/SalesTab";
import PurchasesTab from "@/components/PurchasesTab";
import CashTab from "@/components/CashTab";
import HrTab from "@/components/HrTab";
import EditTab from "@/components/EditTab";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "projects", label: "프로젝트" },
  { key: "sales", label: "매출" },
  { key: "purchases", label: "매입" },
  { key: "cash", label: "자금" },
  { key: "hr", label: "인사·급여" },
  { key: "edit", label: "✏️ 편집" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<SJData | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // localStorage 캐시는 클라이언트에서만 읽는다 (SSR 불일치 방지)
  useEffect(() => {
    const cached = loadData();
    if (cached) {
      setData(cached);
      setYear(dataYears(cached)[0]);
    }
    setHydrated(true);
  }, []);

  const onFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseWorkbook(buf, file.name);
      setData(parsed);
      setYear(dataYears(parsed)[0]);
      saveData(parsed);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽을 수 없습니다.");
    }
  };

  const onClear = () => {
    clearData();
    setData(null);
    setTab("overview");
  };

  // 편집 탭에서 저장 → 파생값 재계산 후 모든 탭·localStorage에 반영
  const onUpdate = (patch: Partial<SJData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const merged = recomputeAll({ ...prev, ...patch });
      saveData(merged);
      return merged;
    });
  };

  if (!hydrated) return null;

  if (!data) {
    return (
      <div>
        <header className="header">
          <div className="header-inner">
            <h1>신정개발 경영지원 대시보드</h1>
          </div>
        </header>
        <FileLoader onFile={onFile} error={error} />
        <p className="footer-note">
          🔒 데이터는 브라우저에서만 처리되며 서버로 전송되지 않습니다
        </p>
      </div>
    );
  }

  const years = dataYears(data);

  return (
    <div>
      <header className="header">
        <div className="header-inner">
          <h1>신정개발 경영지원 대시보드</h1>
          <span className="file-chip">
            📄 {data.fileName} · {new Date(data.loadedAt).toLocaleString("ko-KR")} 불러옴
          </span>
          <span className="spacer" />
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ borderRadius: 6, padding: "5px 8px", border: "none", fontSize: 13 }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          )}
          <button className="btn" onClick={() => downloadExcel(data)}>
            📥 엑셀 다운로드
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            다른 파일 열기
          </button>
          <button className="btn danger" onClick={onClear}>
            데이터 지우기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm,.xls"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="container">
        {error && <div className="error-box">{error}</div>}
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && <OverviewTab data={data} year={year} />}
        {tab === "projects" && <ProjectsTab data={data} />}
        {tab === "sales" && <SalesTab data={data} />}
        {tab === "purchases" && <PurchasesTab data={data} />}
        {tab === "cash" && <CashTab data={data} />}
        {tab === "hr" && <HrTab data={data} />}
        {tab === "edit" && <EditTab data={data} onUpdate={onUpdate} />}

        <p className="footer-note">
          🔒 이 화면의 데이터는 내 PC의 브라우저에만 저장됩니다 · 엑셀 수정 후에는 &quot;다른
          파일 열기&quot;로 다시 불러오세요
        </p>
      </div>
    </div>
  );
}
