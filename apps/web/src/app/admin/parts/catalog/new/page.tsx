import { redirect } from 'next/navigation';

export default function LegacyCatalogRegisterPage() {
  redirect('/admin/catalog/new');
}
