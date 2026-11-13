import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Menti } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <Menti pose="surprised" size={96} message={t('menti.notFound')} testId="menti-not-found" className="mb-5" />
          <div className="flex mb-4 gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('notFound.title')}
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {t('notFound.text')}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#54769d] px-4 text-[12px] font-bold text-white hover:bg-[#527195]"
            data-testid="link-not-found-home"
          >
            <ArrowLeft size={14} /> {t('menti.goHome')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
