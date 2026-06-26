import type { Locale } from '@/lib/i18n';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocumentContent = {
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const termsContent: Record<Locale, LegalDocumentContent> = {
  ko: {
    updated: '2026년 1월 1일',
    intro:
      '본 이용약관은 CEV Engineering Private Limited(이하 "CEV")가 제공하는 CEV Dealer Portal(이하 "포털") 이용과 관련하여 CEV와 딜러·운영자 간 권리·의무를 규정합니다. 포털에 접속하거나 로그인하는 경우 본 약관에 동의한 것으로 간주됩니다.',
    sections: [
      {
        id: 'acceptance',
        title: '1. 약관의 동의',
        paragraphs: [
          '포털을 이용하는 모든 사용자는 본 약관 및 관련 운영 정책을 준수해야 합니다.',
          'CEV는 서비스 개선 또는 법령 변경에 따라 약관을 수정할 수 있으며, 중요한 변경 사항은 포털 공지 또는 등록 이메일을 통해 안내합니다.',
        ],
      },
      {
        id: 'service',
        title: '2. 서비스 개요',
        paragraphs: [
          '포털은 CEV 공식 딜러 및 승인된 운영자를 위한 B2B 플랫폼으로, 다음 기능을 제공합니다.',
        ],
        bullets: [
          '부품 카탈로그 검색 및 주문',
          'Job Card 등록 및 수리 이력 관리',
          'Warranty Claim 접수 및 진행 상태 조회',
          '운영·재고 관련 리포트(권한에 따라 제공)',
        ],
      },
      {
        id: 'accounts',
        title: '3. 계정 및 접근 권한',
        paragraphs: [
          '계정은 CEV 또는 승인된 관리자가 발급하며, 역할(Root, Admin, User, Dealer)에 따라 접근 가능한 메뉴가 제한됩니다.',
          '사용자는 로그인 정보를 제3자와 공유해서는 안 되며, 무단 사용이 의심되는 경우 즉시 CEV에 통지해야 합니다.',
        ],
      },
      {
        id: 'orders',
        title: '4. 주문 및 거래',
        paragraphs: [
          '딜러가 제출한 주문은 CEV 승인 절차를 거친 후 처리됩니다. 가격, 재고, 배송 일정은 시스템에 표시된 정보를 기준으로 하며, CEV는 재고 부족 등 사유로 주문을 조정·반려할 수 있습니다.',
          '허위 또는 반복적인 취소·반품 요청은 서비스 이용 제한 사유가 될 수 있습니다.',
        ],
      },
      {
        id: 'data',
        title: '5. 데이터 및 기밀',
        paragraphs: [
          '포털을 통해 조회·입력되는 고객 정보, VIN, 수리 내역 등은 CEV와 딜러 간 업무 목적으로만 사용되어야 합니다.',
          '사용자는 CEV의 기술 자료, 가격 정보, 시스템 구조를 외부에 무단 공개하거나 상업적으로 이용할 수 없습니다.',
        ],
      },
      {
        id: 'availability',
        title: '6. 서비스 가용성',
        paragraphs: [
          'CEV는 안정적인 서비스 제공을 위해 노력하나, 점검·장애·불가항력으로 인한 일시 중단에 대해 사전 책임을 지지 않습니다.',
          '계획된 유지보수는 가능한 경우 사전에 공지합니다.',
        ],
      },
      {
        id: 'liability',
        title: '7. 책임의 제한',
        paragraphs: [
          '포털은 "있는 그대로" 제공되며, CEV는 간접·특별·결과적 손해에 대해 관련 법령이 허용하는 범위 내에서 책임을 제한합니다.',
          '사용자의 귀책 사유(계정 관리 소홀, 부정확한 데이터 입력 등)로 발생한 손해는 사용자가 부담합니다.',
        ],
      },
      {
        id: 'contact',
        title: '8. 문의',
        paragraphs: [
          '본 약관과 관련한 문의는 customer.cev@knc-korea.com 또는 고객센터(9958000673)로 연락해 주세요.',
        ],
      },
    ],
  },
  en: {
    updated: 'January 1, 2026',
    intro:
      'These Terms of Service govern use of the CEV Dealer Portal ("Portal") provided by CEV Engineering Private Limited ("CEV"). By accessing or signing in to the Portal, you agree to these terms.',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        paragraphs: [
          'All users must comply with these terms and applicable operating policies.',
          'CEV may revise these terms for legal or operational reasons. Material changes will be communicated via Portal notice or registered email.',
        ],
      },
      {
        id: 'service',
        title: '2. Service Overview',
        paragraphs: ['The Portal is a B2B platform for authorized CEV dealers and staff, providing:'],
        bullets: [
          'Parts catalog search and ordering',
          'Job Card entry and repair history',
          'Warranty claim submission and status tracking',
          'Operational and inventory reports (role-based)',
        ],
      },
      {
        id: 'accounts',
        title: '3. Accounts and Access',
        paragraphs: [
          'Accounts are issued by CEV or authorized administrators. Menu access is limited by role (Root, Admin, User, Dealer).',
          'Credentials must not be shared. Suspected unauthorized use must be reported to CEV promptly.',
        ],
      },
      {
        id: 'orders',
        title: '4. Orders and Transactions',
        paragraphs: [
          'Dealer orders are processed after CEV approval. Pricing, stock, and delivery follow information displayed in the system. CEV may adjust or reject orders due to stock or policy reasons.',
          'Repeated fraudulent cancellations or returns may result in access restrictions.',
        ],
      },
      {
        id: 'data',
        title: '5. Data and Confidentiality',
        paragraphs: [
          'Customer data, VINs, and repair records accessed through the Portal may be used only for CEV–dealer business purposes.',
          'Technical materials, pricing, and system details must not be disclosed or exploited commercially without CEV consent.',
        ],
      },
      {
        id: 'availability',
        title: '6. Service Availability',
        paragraphs: [
          'CEV strives for reliable service but does not guarantee uninterrupted access during maintenance, outages, or force majeure.',
          'Planned maintenance will be announced when feasible.',
        ],
      },
      {
        id: 'liability',
        title: '7. Limitation of Liability',
        paragraphs: [
          'The Portal is provided "as is." CEV limits liability for indirect or consequential damages to the extent permitted by law.',
          'Losses arising from user negligence (credential mishandling, inaccurate entries) are the user\'s responsibility.',
        ],
      },
      {
        id: 'contact',
        title: '8. Contact',
        paragraphs: [
          'For questions about these terms, contact customer.cev@knc-korea.com or call 9958000673.',
        ],
      },
    ],
  },
};

export const privacyContent: Record<Locale, LegalDocumentContent> = {
  ko: {
    updated: '2026년 1월 1일',
    intro:
      'CEV Engineering Private Limited는 CEV Dealer Portal 이용 과정에서 수집·이용되는 개인정보를 관련 법령에 따라 보호합니다. 본 방침은 수집 항목, 이용 목적, 보관 기간 및 이용자 권리를 설명합니다.',
    sections: [
      {
        id: 'scope',
        title: '1. 적용 범위',
        paragraphs: [
          '본 방침은 포털 웹 애플리케이션 및 관련 API 서비스에 적용됩니다.',
          '별도 계약 또는 법령에 다른 규정이 있는 경우 해당 규정이 우선합니다.',
        ],
      },
      {
        id: 'collection',
        title: '2. 수집하는 정보',
        paragraphs: ['CEV는 서비스 제공을 위해 다음 정보를 수집할 수 있습니다.'],
        bullets: [
          '계정 정보: 이름, 이메일, 로그인 ID, 역할, 소속 딜러',
          '거래 정보: 주문 내역, Job Card, Warranty Claim 데이터',
          '기술 정보: IP 주소, 브라우저 유형, 접속 일시, 감사 로그',
        ],
      },
      {
        id: 'purpose',
        title: '3. 이용 목적',
        paragraphs: ['수집된 정보는 다음 목적으로 이용됩니다.'],
        bullets: [
          '인증, 권한 관리 및 계정 보안',
          '부품 주문·수리·보증 업무 처리',
          '서비스 품질 개선 및 고객 지원',
          '법적 의무 이행 및 분쟁 대응',
        ],
      },
      {
        id: 'retention',
        title: '4. 보관 기간',
        paragraphs: [
          '개인정보는 수집 목적 달성 후 지체 없이 파기하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 안전하게 보관합니다.',
          '거래·감사 기록은 일반적으로 7년간 보관될 수 있습니다.',
        ],
      },
      {
        id: 'sharing',
        title: '5. 제3자 제공',
        paragraphs: [
          'CEV는 원칙적으로 이용자 동의 없이 개인정보를 외부에 제공하지 않습니다.',
          '다만 법령에 따른 요청, 서비스 운영에 필요한 IT·물류 파트너(비밀유지 계약 체결)에게는 최소한의 범위로 제공될 수 있습니다.',
        ],
      },
      {
        id: 'security',
        title: '6. 보안 조치',
        paragraphs: [
          'CEV는 접근 통제, 암호화, 감사 로그, 권한 분리 등 합리적인 기술·관리적 보호 조치를 시행합니다.',
          '비밀번호는 일방향 해시 등 안전한 방식으로 저장됩니다.',
        ],
      },
      {
        id: 'rights',
        title: '7. 이용자 권리',
        paragraphs: [
          '이용자는 자신의 개인정보에 대한 열람·정정·삭제를 요청할 수 있으며, CEV는 관련 법령에 따라 신속히 처리합니다.',
          '계정 비밀번호는 포털 내 계정 설정에서 변경할 수 있습니다.',
        ],
      },
      {
        id: 'contact-privacy',
        title: '8. 개인정보 문의',
        paragraphs: [
          '개인정보 관련 문의: customer.cev@knc-korea.com',
          '주소: D-18/3, Okhla Phase-2, New Delhi 110020',
        ],
      },
    ],
  },
  en: {
    updated: 'January 1, 2026',
    intro:
      'CEV Engineering Private Limited protects personal data collected through the CEV Dealer Portal in accordance with applicable privacy laws. This policy explains what we collect, why, how long we retain it, and your rights.',
    sections: [
      {
        id: 'scope',
        title: '1. Scope',
        paragraphs: [
          'This policy applies to the Portal web application and related API services.',
          'Where separate contracts or laws apply, those provisions take precedence.',
        ],
      },
      {
        id: 'collection',
        title: '2. Information We Collect',
        paragraphs: ['We may collect the following to operate the service:'],
        bullets: [
          'Account data: name, email, login ID, role, affiliated dealer',
          'Transaction data: orders, Job Cards, warranty claims',
          'Technical data: IP address, browser type, access timestamps, audit logs',
        ],
      },
      {
        id: 'purpose',
        title: '3. How We Use Information',
        paragraphs: ['Collected data is used to:'],
        bullets: [
          'Authenticate users and enforce role-based access',
          'Process parts orders, repairs, and warranty workflows',
          'Improve service quality and provide support',
          'Meet legal obligations and resolve disputes',
        ],
      },
      {
        id: 'retention',
        title: '4. Retention',
        paragraphs: [
          'Data is deleted when no longer needed for its purpose, subject to legal retention requirements.',
          'Transaction and audit records may be kept for up to seven years.',
        ],
      },
      {
        id: 'sharing',
        title: '5. Sharing with Third Parties',
        paragraphs: [
          'We do not sell personal data. Disclosure without consent occurs only where required by law.',
          'IT and logistics partners under confidentiality agreements may receive minimal data necessary for operations.',
        ],
      },
      {
        id: 'security',
        title: '6. Security',
        paragraphs: [
          'We apply access controls, encryption where appropriate, audit logging, and separation of duties.',
          'Passwords are stored using secure one-way hashing.',
        ],
      },
      {
        id: 'rights',
        title: '7. Your Rights',
        paragraphs: [
          'You may request access, correction, or deletion of your personal data as permitted by law.',
          'Passwords can be changed in the Portal account settings.',
        ],
      },
      {
        id: 'contact-privacy',
        title: '8. Privacy Contact',
        paragraphs: [
          'Privacy inquiries: customer.cev@knc-korea.com',
          'Address: D-18/3, Okhla Phase-2, New Delhi 110020',
        ],
      },
    ],
  },
};

export type SupportSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
};

export const supportContent: Record<
  Locale,
  { updated: string; intro: string; sections: SupportSection[] }
> = {
  ko: {
    updated: '2026년 1월 1일',
    intro:
      'CEV Dealer Portal 이용 중 기술 지원, 부품·보증 문의, 사업장 안내가 필요하시면 아래 채널을 이용해 주세요. 운영 시간: 평일 09:00–18:00 (IST).',
    sections: [
      {
        id: 'technology',
        title: '기술 지원',
        body: 'CNG/LPG·전기차 부품 장착 및 수리 관련 기술 문의를 지원합니다.',
        bullets: [
          'Job Card 작성 및 VIN 검증 가이드',
          'Warranty Claim 증빙 서류 안내',
          '포털 로그인·권한 관련 1차 지원',
        ],
      },
      {
        id: 'products',
        title: '제품 · 부품',
        body: '차량 모델·카테고리별 부품 검색, 재고 확인, 주문 절차를 안내합니다.',
        bullets: ['Parts 메뉴에서 모델/카테고리 필터 이용', '긴급 부품은 딜러 코드와 함께 문의', '대량 주문은 사전 승인 필요'],
      },
      {
        id: 'warranty',
        title: '보증 정책',
        body: 'CEV 공식 보증 부품에 대한 클레임 접수·승인 절차를 안내합니다.',
        bullets: [
          'Warranty Claim 메뉴에서 온라인 접수',
          'Invoice No, Job Card 연계 필수',
          '승인 후 처리 상태는 포털에서 조회',
        ],
      },
      {
        id: 'locations',
        title: '사업장 안내',
        body: 'D-18/3, Okhla Phase-2, New Delhi 110020 — 방문 전 사전 예약을 권장합니다.',
      },
      {
        id: 'company',
        title: '회사 소개',
        body: 'CEV Engineering Private Limited는 2007년 설립된 CNG/LPG 시스템 및 부품 전문 기업으로, Hyundai 등 OEM과 협력하고 있습니다.',
      },
      {
        id: 'about',
        title: 'About us',
        body: 'CEV Dealer Portal은 딜러 파트너의 부품 주문·수리·보증 업무를 디지털화하여 운영 효율을 높이기 위해 제공됩니다.',
      },
    ],
  },
  en: {
    updated: 'January 1, 2026',
    intro:
      'For technical support, parts and warranty inquiries, or office information while using the CEV Dealer Portal, please use the channels below. Hours: Mon–Fri 09:00–18:00 (IST).',
    sections: [
      {
        id: 'technology',
        title: 'Technology Support',
        body: 'We assist with CNG/LPG and EV parts installation and repair inquiries.',
        bullets: [
          'Job Card entry and VIN validation guidance',
          'Warranty claim documentation support',
          'First-line Portal login and access help',
        ],
      },
      {
        id: 'products',
        title: 'Products & Parts',
        body: 'Guidance on model/category search, stock checks, and ordering workflows.',
        bullets: ['Use Parts menu filters by model or category', 'Urgent parts: contact with dealer code', 'Bulk orders may require pre-approval'],
      },
      {
        id: 'warranty',
        title: 'Warranty Policy',
        body: 'How to submit and track warranty claims for eligible CEV parts.',
        bullets: [
          'Submit online via Warranty Claim menu',
          'Invoice No and linked Job Card required',
          'Track approval status in the Portal',
        ],
      },
      {
        id: 'locations',
        title: 'Our Locations',
        body: 'D-18/3, Okhla Phase-2, New Delhi 110020 — appointments recommended for visits.',
      },
      {
        id: 'company',
        title: 'Company',
        body: 'CEV Engineering Private Limited, established in 2007, specializes in CNG/LPG systems and parts, partnering with OEMs including Hyundai.',
      },
      {
        id: 'about',
        title: 'About us',
        body: 'The CEV Dealer Portal digitizes parts ordering, repair, and warranty workflows for dealer partners.',
      },
    ],
  },
};

export type SupportDepartment = {
  id: 'sales' | 'service' | 'warranty';
  email: string;
  phones: string[];
};

export const supportContactInfo = {
  companyName: 'CEV Engineering Private Limited',
  address: 'D-18/3, Okhla Phase-2, New Delhi 110020',
  customerEmail: 'customer.cev@knc-korea.com',
  mapEmbedUrl:
    'https://maps.google.com/maps?q=D-18%2F3,+Okhla+Phase-2,+New+Delhi+110020&t=&z=15&ie=UTF8&iwloc=&output=embed',
  departments: [
    { id: 'sales', email: 'sales.cev@knc-korea.com', phones: ['9958000673'] },
    {
      id: 'service',
      email: 'service.cev@knc-korea.com',
      phones: ['9891191708', '011 – 4108 9094', '1800 102 7270'],
    },
    {
      id: 'warranty',
      email: 'warranty.cev@knc-korea.com',
      phones: ['7503668874', '011 – 4142 2583'],
    },
  ] satisfies SupportDepartment[],
};
