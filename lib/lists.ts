// 표준 코드 목록 — 엑셀 기준정보 시트의 기본값과 동일하게 유지한다.
// 데이터에 새로운 값이 있으면 mergeOptions로 합쳐서 드롭다운에 노출한다.

export const CLIENT_TYPES = ["발주처", "외주/협력사", "자재업체", "장비업체", "용역", "기타"];
export const PROJECT_TYPES = ["관급공사", "민간공사", "하도급공사", "용역/설계", "기타"];
export const PROJECT_STATUSES = ["견적/입찰", "계약", "진행중", "준공", "하자보수", "중단/보류"];
export const SALE_CATEGORIES = ["선급금", "기성금", "준공금", "추가공사", "기타"];
export const PURCHASE_ACCOUNTS = ["자재비", "외주비", "노무비", "장비임차료", "현장경비", "일반관리비", "세금과공과", "기타"];
export const DEPTS = ["임원", "경영지원부", "공무부", "공사부", "안전관리부", "영업부"];
export const RANKS = ["대표이사", "이사", "부장", "차장", "과장", "대리", "주임", "사원"];
export const EMP_STATUSES = ["재직", "휴직", "퇴사"];
export const CASH_KINDS = ["기초", "입금", "출금"];
export const CASH_CATEGORIES = [
  "기초잔액", "공사대금입금", "기타입금", "자재대금", "외주비지급", "노무비지급",
  "장비대금", "급여", "4대보험", "세금", "임차료", "운영비", "기타출금",
];
export const BANKS = ["기업은행(주거래)", "국민은행", "농협"];

export const VAT_RATE = 0.1;

// 4대보험 근로자 부담 요율 — 엑셀 기준정보!B12:B15와 동일 (매년 확인 필요)
export const INS_RATES = {
  pension: 0.045,     // 국민연금
  health: 0.03545,    // 건강보험
  care: 0.1295,       // 장기요양 (건강보험료의 %)
  employment: 0.009,  // 고용보험
};

export function mergeOptions(defaults: string[], values: (string | undefined)[]): string[] {
  return [...new Set([...defaults, ...values.filter((v): v is string => !!v)])];
}
