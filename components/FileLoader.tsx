"use client";

import { useRef, useState } from "react";

export default function FileLoader({
  onFile,
  error,
}: {
  onFile: (file: File) => void;
  error: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div className="loader-wrap">
      <div
        className={`drop${over ? " over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
      >
        <div className="icon">📂</div>
        <h2>경영지원 데이터 엑셀 파일 열기</h2>
        <p>
          <b>sj-data.xlsx</b>를 클릭해서 선택하거나 여기로 끌어다 놓으세요
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,.xls"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="security-note">
        <b>🔒 데이터 보안 안내</b>
        <ul>
          <li>파일은 이 브라우저 안에서만 해석되며, 서버나 외부로 전송되지 않습니다.</li>
          <li>화면 표시용 데이터는 이 PC의 브라우저에만 저장되며, 언제든 &quot;데이터 지우기&quot;로 삭제할 수 있습니다.</li>
          <li>공용 PC에서 사용한 뒤에는 반드시 &quot;데이터 지우기&quot;를 눌러 주세요.</li>
        </ul>
      </div>
    </div>
  );
}
