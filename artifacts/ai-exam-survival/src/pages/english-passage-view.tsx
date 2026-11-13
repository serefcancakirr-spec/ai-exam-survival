// Stage 21B: the reading text or listening recording above an English question (and in the review).
// While answering, a listening text is not shown in writing; after the test the review shows what was said.
import { useEffect, useRef, useState } from 'react';
import { Headphones, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { audioPath, passageOfQuestion, type EnglishPassage } from './english-passages';

const SLOW = 0.8;

function Transcript({ passage }: { passage: EnglishPassage }) {
  return (
    <div className="space-y-2 text-[14px] leading-[1.7] text-[#2b3a49]" lang="en">
      {passage.lines.map((line, index) => (
        <p key={index}>
          {passage.kind === 'listening' && passage.lines.some((l) => l.speaker !== passage.lines[0].speaker) && line.speaker ? (
            <span className="font-bold text-[#4b698c]">{line.speaker}: </span>
          ) : null}
          {line.text}
        </p>
      ))}
    </div>
  );
}

function ListeningPlayer({ passage }: { passage: EnglishPassage }) {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [slow, setSlow] = useState(false);
  const src = audioPath(import.meta.env.BASE_URL, passage.id);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = slow ? SLOW : 1;
  }, [slow]);

  return (
    <div>
      <audio
        ref={audioRef}
        controls
        preload="none"
        src={src}
        className="w-full"
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = slow ? SLOW : 1;
        }}
        data-testid="english-audio"
      >
        <track kind="captions" />
      </audio>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('quiz.speedLabel')}>
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={slow === value}
            onClick={() => setSlow(value)}
            className={`min-h-10 rounded-[6px] border px-3 text-[12px] font-bold transition-colors ${
              slow === value
                ? 'border-[#5376a0] bg-[#eef2f6] text-[#2f4c6e]'
                : 'border-[#ddd5c6] bg-[#fffdf8] text-[#4f5b66] hover:border-[#b9c7d6]'
            }`}
            data-testid={value ? 'button-audio-slow' : 'button-audio-normal'}
          >
            {value ? t('quiz.speedSlow') : t('quiz.speedNormal')}
          </button>
        ))}
      </div>
    </div>
  );
}

/** mode "quiz": while answering. mode "review": on the results screen. */
export function PassageBlock({ question, mode }: { question: { id: string; subject: string }; mode: 'quiz' | 'review' }) {
  const { t } = useI18n();
  const passage = passageOfQuestion(question);
  if (!passage) return null;
  const listening = passage.kind === 'listening';
  const label = t(listening ? 'quiz.listeningLabel' : 'quiz.readingLabel', { level: passage.level });

  return (
    <section
      className={`rounded-[8px] border border-[#ddd5c6] bg-[#fbf8f1] p-4 ${mode === 'quiz' ? 'mt-6' : 'mt-3'}`}
      data-testid={`english-passage-${passage.kind}`}
      data-passage={passage.id}
    >
      <p className="flex items-center gap-2 text-[12px] font-semibold text-[#4b698c]">
        {listening ? <Headphones size={15} aria-hidden="true" /> : <BookOpen size={15} aria-hidden="true" />}
        {label}
      </p>
      <h3 className="font-display mt-1 text-[17px] font-bold text-[#2b3a49]" lang="en">{passage.title}</h3>

      {listening ? (
        <div className="mt-3">
          <ListeningPlayer key={passage.id} passage={passage} />
          {mode === 'quiz' ? (
            <p className="mt-2 text-[12px] leading-relaxed text-[#5f676f]" data-testid="english-listen-hint">{t('quiz.listenHint')}</p>
          ) : (
            <details className="mt-3" data-testid="english-transcript">
              <summary className="cursor-pointer text-[12px] font-bold text-[#4c6a8c]">{t('quiz.showTranscript')}</summary>
              <div className="mt-2">
                <Transcript passage={passage} />
              </div>
            </details>
          )}
        </div>
      ) : mode === 'quiz' ? (
        <div className="mt-3" data-testid="english-reading-text">
          <Transcript passage={passage} />
        </div>
      ) : (
        <details className="mt-2" data-testid="english-transcript">
          <summary className="cursor-pointer text-[12px] font-bold text-[#4c6a8c]">{t('quiz.showText')}</summary>
          <div className="mt-2">
            <Transcript passage={passage} />
          </div>
        </details>
      )}
    </section>
  );
}
