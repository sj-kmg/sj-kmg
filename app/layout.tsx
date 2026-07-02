import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "신정개발 경영지원 대시보드",
  description: "엑셀 데이터 기반 경영지원 현황판 — 데이터는 브라우저에서만 처리됩니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
