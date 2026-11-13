import { useI18n, type Lang } from '@/i18n/i18n';

const OPTIONS: Array<{ value: Lang; short: string }> = [
  { value: 'tr', short: 'TR' },
  { value: 'en', short: 'EN' },
];

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('lang.groupLabel')}
      className="flex shrink-0 items-center rounded-full border border-[#e5e8ec] bg-white p-0.5"
      data-testid="language-switch"
    >
      {OPTIONS.map((option) => {
        const active = lang === option.value;
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            aria-pressed={active}
            aria-label={option.value === 'tr' ? t('lang.trLabel') : t('lang.enLabel')}
            onClick={() => setLang(option.value)}
            className={`min-h-10 min-w-10 rounded-full px-2.5 text-[12px] font-extrabold transition-colors ${
              active ? 'bg-[#3b536c] text-white' : 'text-[#5e676f] hover:text-[#4f6a88]'
            }`}
            data-testid={`button-lang-${option.value}`}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
