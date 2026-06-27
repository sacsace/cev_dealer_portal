export type CompanyProfile = {
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankAccountType: string;
};

export function getCompanyProfile(): CompanyProfile {
  return {
    legalName: process.env.COMPANY_LEGAL_NAME ?? 'CEV Engineering Private Limited',
    addressLine1: process.env.COMPANY_ADDRESS_LINE1 ?? 'D-18/3, Okhla Phase-2',
    addressLine2: process.env.COMPANY_ADDRESS_LINE2 ?? 'New Delhi 110020, India',
    email: process.env.COMPANY_EMAIL ?? 'customer.cev@knc-korea.com',
    phone: process.env.COMPANY_PHONE ?? '1800 102 7270',
    gstin: process.env.COMPANY_GSTIN ?? '07AACCN5334P1Z3',
    pan: process.env.COMPANY_PAN ?? 'AACCN5334P',
    bankAccountName:
      process.env.COMPANY_BANK_ACCOUNT_NAME ?? 'CEV Engineering Private Limited',
    bankName: process.env.COMPANY_BANK_NAME ?? '',
    bankAccountNumber: process.env.COMPANY_BANK_ACCOUNT_NUMBER ?? '',
    bankIfsc: process.env.COMPANY_BANK_IFSC ?? '',
    bankBranch: process.env.COMPANY_BANK_BRANCH ?? '',
    bankAccountType: process.env.COMPANY_BANK_ACCOUNT_TYPE ?? 'Current Account',
  };
}
