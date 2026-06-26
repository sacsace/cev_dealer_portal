import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '../src/app');
const layouts = [
  ['login', 'login', '/login'],
  ['terms', 'terms', '/terms'],
  ['privacy', 'privacy', '/privacy'],
  ['support', 'support', '/support'],
  ['admin/dealers', 'adminDealers', '/admin/dealers'],
  ['admin/dealers/new', 'adminDealerNew', '/admin/dealers/new'],
  ['admin/dealers/[id]', 'adminDealerEdit', '/admin/dealers'],
  ['admin/users', 'adminUsers', '/admin/users'],
  ['admin/catalog', 'adminCatalog', '/admin/catalog'],
  ['admin/catalog/new', 'adminCatalogNew', '/admin/catalog/new'],
  ['admin/catalog/[id]', 'adminCatalogEdit', '/admin/catalog'],
  ['admin/parts', 'adminParts', '/admin/parts'],
  ['admin/parts/new', 'adminPartNew', '/admin/parts/new'],
  ['admin/parts/[id]', 'adminPartEdit', '/admin/parts'],
  ['admin/models', 'adminModels', '/admin/models'],
  ['admin/models/new', 'adminModelNew', '/admin/models/new'],
  ['admin/models/[id]', 'adminModelEdit', '/admin/models'],
  ['admin/fitments', 'adminFitments', '/admin/fitments'],
  ['admin/fitments/new', 'adminFitmentNew', '/admin/fitments/new'],
  ['admin/fitments/[id]', 'adminFitmentEdit', '/admin/fitments'],
  ['admin/orders', 'adminOrders', '/admin/orders'],
  ['admin/job-cards', 'adminJobCards', '/admin/job-cards'],
  ['admin/job-cards/[id]', 'adminJobCardEdit', '/admin/job-cards'],
  ['admin/problem-types', 'adminProblemTypes', '/admin/problem-types'],
  ['admin/problem-types/new', 'adminProblemTypeNew', '/admin/problem-types/new'],
  ['admin/problem-types/[id]', 'adminProblemTypeEdit', '/admin/problem-types'],
  ['admin/types', 'adminJobCardTypes', '/admin/types'],
  ['admin/types/new', 'adminJobCardTypeNew', '/admin/types/new'],
  ['admin/types/[id]', 'adminJobCardTypeEdit', '/admin/types'],
  ['admin/claims', 'adminClaims', '/admin/claims'],
  ['admin/claims/[id]', 'adminClaimDetail', '/admin/claims'],
  ['admin/reports', 'adminReports', '/admin/reports'],
  ['admin/account', 'adminAccount', '/admin/account'],
  ['(dealer)/dealer', 'dealerHome', '/dealer'],
  ['(dealer)/parts', 'dealerParts', '/parts'],
  ['(dealer)/parts/[id]', 'dealerPartDetail', '/parts'],
  ['(dealer)/cart', 'dealerCart', '/cart'],
  ['(dealer)/checkout', 'dealerCheckout', '/checkout'],
  ['(dealer)/orders', 'dealerOrders', '/orders'],
  ['(dealer)/repair/job-cards', 'dealerJobCards', '/repair/job-cards'],
  ['(dealer)/repair/job-cards/new', 'dealerJobCardNew', '/repair/job-cards/new'],
  ['(dealer)/repair/job-cards/[id]', 'dealerJobCardEdit', '/repair/job-cards'],
  ['(dealer)/repair/warranty-claims', 'dealerWarrantyClaims', '/repair/warranty-claims'],
  ['(dealer)/repair/warranty-claims/new', 'dealerWarrantyClaimNew', '/repair/warranty-claims/new'],
  ['(dealer)/repair/warranty-claims/[id]', 'dealerWarrantyClaimEdit', '/repair/warranty-claims'],
  ['(dealer)/account', 'dealerAccount', '/account'],
  ['(dealer)/help', 'dealerHelp', '/help'],
];

function template(key, routePath) {
  return `import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('${key}', '${routePath}');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
`;
}

let count = 0;
for (const [dir, key, routePath] of layouts) {
  const file = path.join(base, dir, 'layout.tsx');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, template(key, routePath));
  count += 1;
}

console.log('Created', count, 'layout files');
