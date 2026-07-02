// 데이터 모델 — data/sj-data.xlsx의 시트 구조와 1:1 대응

export interface Client {
  code: string;      // 거래처코드
  name: string;      // 거래처명
  type: string;      // 구분
  bizNo: string;     // 사업자번호
  ceo: string;       // 대표자
  manager: string;   // 담당자
  phone: string;     // 연락처
  email: string;     // 이메일
  scope: string;     // 주요거래내용
  terms: string;     // 결제조건
  note: string;      // 비고
}

export interface Project {
  code: string;              // 프로젝트코드
  name: string;              // 프로젝트명
  clientCode: string;        // 발주처코드
  clientName: string;        // 발주처명
  type: string;              // 공사구분
  contractDate: Date | null; // 계약일
  startDate: Date | null;    // 착공일
  endDate: Date | null;      // 준공예정일
  amount: number;            // 계약금액(공급가액)
  vat: number;               // 부가세
  total: number;             // 총계약금액
  status: string;            // 진행상태
  progress: number;          // 진행률 (0~1)
  manager: string;           // 담당자
  note: string;              // 비고
}

export interface Sale {
  id: string;             // 매출ID
  date: Date | null;      // 청구일자
  projectCode: string;
  projectName: string;
  clientCode: string;
  clientName: string;
  category: string;       // 청구구분
  desc: string;           // 내용
  supply: number;         // 공급가액
  vat: number;            // 부가세
  total: number;          // 합계
  invoiced: string;       // 계산서발행 (Y/N)
  dueDate: Date | null;   // 수금예정일
  paidDate: Date | null;  // 수금일
  paid: number;           // 수금액
  unpaid: number;         // 미수금 (웹에서 재계산)
  status: string;         // 수금상태 (웹에서 재계산)
  note: string;
}

export interface Purchase {
  id: string;             // 매입ID
  date: Date | null;      // 일자
  projectCode: string;
  projectName: string;
  clientCode: string;
  clientName: string;
  account: string;        // 계정과목
  desc: string;           // 내용
  supply: number;         // 공급가액
  vat: number;            // 부가세
  total: number;          // 합계
  dueDate: Date | null;   // 지급예정일
  paidDate: Date | null;  // 지급일
  paid: number;           // 지급액
  unpaid: number;         // 미지급금 (웹에서 재계산)
  status: string;         // 지급상태 (웹에서 재계산)
  note: string;
}

export interface CashEntry {
  date: Date | null;   // 일자
  kind: string;        // 구분 (기초/입금/출금)
  account: string;     // 계좌
  category: string;    // 항목
  desc: string;        // 내용
  client: string;      // 관련거래처
  inAmt: number;       // 입금액
  outAmt: number;      // 출금액
  balance: number;     // 잔액 (웹에서 누계 재계산)
}

export interface Employee {
  id: string;             // 사번
  name: string;           // 성명
  dept: string;           // 부서
  rank: string;           // 직급
  joined: Date | null;    // 입사일
  status: string;         // 재직상태
  phone: string;
  email: string;
  note: string;
}

export interface Payroll {
  month: Date | null;  // 귀속연월
  empId: string;       // 사번
  name: string;
  dept: string;
  base: number;        // 기본급
  allowance: number;   // 제수당
  gross: number;       // 지급총액
  pension: number;     // 국민연금
  health: number;      // 건강보험
  care: number;        // 장기요양
  employment: number;  // 고용보험
  incomeTax: number;   // 소득세
  localTax: number;    // 지방소득세
  deductions: number;  // 공제총액
  net: number;         // 실지급액
  payDate: Date | null;
  note: string;
}

export interface SJData {
  fileName: string;
  loadedAt: string; // ISO
  clients: Client[];
  projects: Project[];
  sales: Sale[];
  purchases: Purchase[];
  cash: CashEntry[];
  employees: Employee[];
  payroll: Payroll[];
}
