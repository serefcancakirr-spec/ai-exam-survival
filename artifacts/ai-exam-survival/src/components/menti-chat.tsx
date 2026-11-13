// Stage 18: the chat button (every page) and chat window. Rules and texts: menti-chat-model.ts.
// Reads saved data only to personalise answers; never writes anything. The chat is lost on refresh.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { MentiArt } from '@/components/menti';
import { scrollToSectionSoon } from '@/components/scroll-manager';
import { useI18n } from '@/i18n/i18n';
import { learningName } from '@/i18n/content';
import { getTodayDateKey } from '@/pages/study-planner-model';
import {
  chipLabel,
  factsFromStorage,
  greetingReply,
  intentOf,
  replyTo,
  type ChatLink,
  type Intent,
  type Lang,
  type StudentFacts,
} from './menti-chat-model';

type NewMessage = { from: 'me'; text: string } | { from: 'menti'; intent: Intent; facts: StudentFacts; first?: boolean };
type Message = NewMessage & { id: number };

const UI = {
  en: {
    open: 'Chat with Menti',
    close: 'Close the chat',
    title: 'Menti',
    subtitle: 'A mascot that works with rules · the chat is not saved',
    placeholder: 'Write to Menti…',
    send: 'Send',
    you: 'You',
  },
  tr: {
    open: 'Menti ile konuş',
    close: 'Sohbeti kapat',
    title: 'Menti',
    subtitle: 'Kurallarla çalışan bir maskot · sohbet kaydedilmez',
    placeholder: 'Menti’ye bir şey yaz…',
    send: 'Gönder',
    you: 'Sen',
  },
} satisfies Record<Lang, Record<string, string>>;

function readFacts() {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return factsFromStorage(storage, getTodayDateKey());
}

export function MentiChat() {
  const { lang, subject } = useI18n();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ui = UI[lang];
  const names = { subject: (s: string) => subject(s), topic: (t: string) => learningName(t, lang) };

  function add(message: NewMessage) {
    const id = nextId.current++;
    setMessages((list) => [...list, { ...message, id }]);
  }

  function openChat() {
    setOpen(true);
    if (messages.length === 0) add({ from: 'menti', intent: 'greeting', facts: readFacts(), first: true });
  }

  function closeChat() {
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function ask(intent: Intent, label: string) {
    add({ from: 'me', text: label });
    add({ from: 'menti', intent, facts: readFacts() });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim().slice(0, 300);
    if (!text) return;
    setDraft('');
    ask(intentOf(text), text);
  }

  function follow(link: ChatLink) {
    setOpen(false);
    navigate(link.href);
    if (link.section) {
      const id = link.section;
      window.setTimeout(() => scrollToSectionSoon(id), 50);
    }
  }

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const lastMenti = [...messages].reverse().find((m) => m.from === 'menti');

  return (
    <>
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={openChat}
          aria-label={ui.open}
          title={ui.open}
          className="fixed bottom-4 right-4 z-40 grid h-[56px] w-[56px] place-items-center overflow-hidden rounded-full border-2 border-white bg-[#eff4f8] shadow-[0_10px_28px_rgba(54,75,96,.25)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#98afca]/50 sm:bottom-6 sm:right-6"
          data-testid="menti-chat-button"
        >
          <span className="block h-[46px] w-[46px]" aria-hidden="true">
            <MentiArt pose="wave" faceOnly />
          </span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="menti-chat-title"
          className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[82vh] flex-col overflow-hidden rounded-t-[10px] border border-[#ddd5c6] bg-[#fffdf8] shadow-[0_-12px_40px_rgba(54,75,96,.22)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-h-[min(640px,80vh)] sm:w-[390px] sm:rounded-[10px]"
          data-testid="menti-chat"
        >
          <div className="flex items-center gap-3 bg-[#2f4255] px-4 py-3 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eff4f8]" aria-hidden="true">
              <span className="block h-9 w-9">
                <MentiArt pose="wave" faceOnly />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="menti-chat-title" ref={titleRef} tabIndex={-1} className="font-display text-[16px] font-extrabold tracking-[-.015em] outline-none">
                {ui.title}
              </h2>
              <p className="truncate text-[10px] text-[#cad3dc]">{ui.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              aria-label={ui.close}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              data-testid="menti-chat-close"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f9f8f5] px-3.5 py-4" aria-live="polite" data-testid="menti-chat-messages">
            {messages.map((m) =>
              m.from === 'me' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] break-words rounded-[10px] rounded-br-[5px] bg-[#54769d] px-3.5 py-2.5 text-[13px] leading-relaxed text-white" data-testid="menti-chat-me">
                    <span className="sr-only">{ui.you}: </span>
                    {m.text}
                  </p>
                </div>
              ) : (
                <MentiMessage key={m.id} message={m} lang={lang} names={names} onFollow={follow} />
              ),
            )}
            {lastMenti && lastMenti.from === 'menti' && (() => {
              const reply = lastMenti.first ? greetingReply(lastMenti.facts, lang, names) : replyTo(lastMenti.intent, lastMenti.facts, lang, names);
              if (reply.chips.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5 pt-1" data-testid="menti-chat-chips">
                  {reply.chips.map((intent) => (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => ask(intent, chipLabel(intent, lang))}
                      className="min-h-9 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3 text-[11px] font-bold text-[#4c6a8c] transition-colors hover:bg-[#f4f7fb]"
                      data-testid={`menti-chip-${intent}`}
                    >
                      {chipLabel(intent, lang)}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#ddd5c6] bg-[#fffdf8] p-3">
            <label htmlFor="menti-chat-input" className="sr-only">{ui.placeholder}</label>
            <input
              id="menti-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder={ui.placeholder}
              className="min-h-11 min-w-0 flex-1 rounded-[6px] border border-[#e5e8ec] bg-[#fbf9f7] px-4 text-[13px] text-[#364656] outline-none focus:border-[#98afca] focus:bg-white"
              data-testid="menti-chat-input"
            />
            <button
              type="submit"
              aria-label={ui.send}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#54769d] text-white hover:bg-[#527195] disabled:opacity-40"
              disabled={!draft.trim()}
              data-testid="menti-chat-send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MentiMessage({
  message,
  lang,
  names,
  onFollow,
}: {
  message: Extract<Message, { from: 'menti' }>;
  lang: Lang;
  names: { subject: (s: string) => string; topic: (t: string) => string };
  onFollow: (link: ChatLink) => void;
}) {
  // Rendered from the intent and the facts at that moment, so switching TR/EN re-translates the whole chat.
  const reply = message.first ? greetingReply(message.facts, lang, names) : replyTo(message.intent, message.facts, lang, names);
  return (
    <div className="flex items-end gap-2" data-testid="menti-chat-reply" data-intent={reply.intent} data-pose={reply.pose}>
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eff4f8]" aria-hidden="true">
        <span className="block h-7 w-7">
          <MentiArt pose={reply.pose} faceOnly />
        </span>
      </span>
      <div className="max-w-[88%] rounded-[10px] rounded-bl-[5px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4b5966] shadow-[0_4px_14px_rgba(54,75,96,.05)]">
        <span className="sr-only">Menti: </span>
        {reply.lines.map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
            {line}
          </p>
        ))}
        {reply.links.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {reply.links.map((link) => (
              <button
                key={link.href + (link.section ?? '')}
                type="button"
                onClick={() => onFollow(link)}
                className="min-h-9 rounded-[6px] bg-[#2f4255] px-3 text-[11px] font-bold text-white hover:bg-[#394d62]"
                data-testid="menti-chat-link"
                data-href={link.href}
              >
                {link.label} →
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
