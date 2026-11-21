import { UploadForm } from '@/components/UploadForm';
import { getCategories } from '@/lib/queries';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Upload template' };
export default async function Page() {
  const { styles, motors } = await getCategories();
  return (
    <div className="space-y-6 pt-4">
      <h1 className="h-display text-3xl">Upload template</h1>
      <UploadForm styles={styles} motors={motors} />
    </div>
  );
}
