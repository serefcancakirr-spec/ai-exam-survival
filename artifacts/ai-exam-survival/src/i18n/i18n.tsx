// The app's small language system (no library needed).
// - Turkish is the default for a first visit.
// - The chosen language is saved under its own key only when the student switches.
// - Only what the app SHOWS changes. Saved data, keys, routes and IDs are never translated.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN, type MessageKey } from './translations-en';
import { TR } from './translations-tr';
import { TR_PHRASES } from './phrases-tr';

export type Lang = 'tr' | 'en';
export const LANGUAGE_STORAGE_KEY = 'ai-exam-survival:language:v1';
export const DEFAULT_LANG: Lang = 'tr';

type Vars = Record<string, string | number>;

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { en: EN, tr: TR };

export function readSavedLanguage(): Lang {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    // Storage blocked: fall back to the default.
  }
  return DEFAULT_LANG;
}

function fill(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function translate(lang: Lang, key: MessageKey, vars?: Vars) {
  return fill(DICTIONARIES[lang][key] ?? EN[key] ?? key, vars);
}

// ---------- sentence-based texts (Flashcards, Exam Calendar, Study Coach, Progress Tracker) ----------
// These modules use the English sentence itself as the key, so their English output never changes.
// Sentences built by the tools' own rules (for example "In 3 days") are matched with the
// {placeholder} templates in phrases-tr.ts. Text a student typed is only ever put into a
// placeholder unchanged; it is never translated.

const PLAIN = new Map<string, string>();
const PATTERNS: Array<{ regex: RegExp; names: string[]; tr: string }> = [];
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A {subject} placeholder only matches a real subject name, so a student's own words are never mistaken for one.
const SUBJECT_PATTERN = `(${['subject', ...Object.keys(EN).filter((key) => key.startsWith('subject.')).map((key) => key.slice(8))]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|')})`;
for (const [en, tr] of Object.entries(TR_PHRASES)) {
  const names = [...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (names.length === 0) {
    PLAIN.set(en, tr);
    continue;
  }
  const parts = en.split(/\{\w+\}/).map(escapeRegex);
  const source = parts.reduce(
    (built, part, index) =>
      index === 0 ? part : `${built}${names[index - 1] === 'subject' ? SUBJECT_PATTERN : '([\\s\\S]+?)'}${part}`,
    '',
  );
  PATTERNS.push({ regex: new RegExp(`^${source}$`), names, tr });
}
// Longer templates first, so the most specific one wins.
PATTERNS.sort((a, b) => b.regex.source.length - a.regex.source.length);

function subjectName(lang: Lang, name: string) {
  // Some suggestions say "subject" when the exam's subject is "Other".
  if (name === 'subject' && lang === 'tr') return 'ders';
  const key = `subject.${name}`;
  return Object.prototype.hasOwnProperty.call(EN, key) ? translate(lang, key as MessageKey) : name;
}

/** Turkish text for an English sentence, or the sentence unchanged when there is no translation. */
export function translatePhrase(lang: Lang, text: string): string {
  if (lang === 'en' || !text) return text;
  const plain = PLAIN.get(text);
  if (plain !== undefined) return plain;
  for (const pattern of PATTERNS) {
    const match = pattern.regex.exec(text);
    if (!match) continue;
    const values: Vars = {};
    pattern.names.forEach((name, index) => {
      const value = match[index + 1];
      // {subject} values are subject names; {phrase} values are themselves translatable sentences.
      values[name] =
        name === 'subject' ? subjectName(lang, value) : name.startsWith('phrase') ? translatePhrase(lang, value) : value;
    });
    return fill(pattern.tr, values);
  }
  return text;
}

// ---------- Turkish back to English (only for steps the app suggested and saved in Turkish) ----------
const REVERSE_PLAIN = new Map<string, string>();
const REVERSE_PATTERNS: Array<{ regex: RegExp; names: string[]; en: string }> = [];
const SUBJECTS_TR_TO_EN = new Map<string, string>(
  Object.keys(EN)
    .filter((key) => key.startsWith('subject.'))
    .map((key) => [translate('tr', key as MessageKey), key.slice(8)]),
);
SUBJECTS_TR_TO_EN.set('ders', 'subject');
const TR_SUBJECT_PATTERN = `(${[...SUBJECTS_TR_TO_EN.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join('|')})`;
for (const [en, tr] of Object.entries(TR_PHRASES)) {
  const names = [...tr.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (names.length === 0) {
    if (!REVERSE_PLAIN.has(tr)) REVERSE_PLAIN.set(tr, en);
    continue;
  }
  if (!names.every((name) => name === 'subject')) continue; // only simple templates are reversed
  const parts = tr.split(/\{\w+\}/).map(escapeRegex);
  const source = parts.reduce((built, part, index) => (index === 0 ? part : `${built}${TR_SUBJECT_PATTERN}${part}`), '');
  REVERSE_PATTERNS.push({ regex: new RegExp(`^${source}$`), names, en });
}

/** English text for a Turkish sentence the app wrote (for example a suggested step), or the text unchanged. */
export function englishFromTurkish(text: string): string {
  const plain = REVERSE_PLAIN.get(text);
  if (plain !== undefined) return plain;
  for (const pattern of REVERSE_PATTERNS) {
    const match = pattern.regex.exec(text);
    if (match) return fill(pattern.en, { subject: SUBJECTS_TR_TO_EN.get(match[1]) ?? match[1] });
  }
  return text;
}

/** Fills an English template, translated first when Turkish is chosen. */
export function translateTemplate(lang: Lang, template: string, vars?: Vars) {
  if (lang === 'en') return fill(template, vars);
  return fill(TR_PHRASES[template] ?? template, vars);
}

export type Translator = {
  lang: Lang;
  /** Locale for dates and numbers. English keeps the browser default so it matches earlier stages. */
  locale: string | undefined;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Singular/plural: uses `${base}_one` when count is 1, otherwise `${base}_other`. */
  tn: (base: string, count: number, vars?: Vars) => string;
  /** Subject name for display. Unknown names (for example ones a student typed) are shown unchanged. */
  subject: (name: string) => string;
  /** A word the Study Planner writes into new tasks (shown translated, saved unchanged). */
  plannerWord: (text: string) => string;
  /** "4:00 PM" → "16:00" in Turkish. Anything else is shown unchanged. */
  clock: (time: string) => string;
  /** English template → current language, with {name} parts filled in. */
  tx: (template: string, vars?: Vars) => string;
  /** A finished English sentence (for example one built by a tool's rules) → current language. */
  phrase: (text: string) => string;
};

function hasKey(key: string): key is MessageKey {
  return Object.prototype.hasOwnProperty.call(EN, key);
}

export function makeTranslator(lang: Lang, setLang: (lang: Lang) => void = () => {}): Translator {
  const t = (key: MessageKey, vars?: Vars) => translate(lang, key, vars);
  return {
    lang,
    locale: lang === 'tr' ? 'tr-TR' : undefined,
    setLang,
    t,
    tn: (base, count, vars) => {
      const key = `${base}_${count === 1 ? 'one' : 'other'}`;
      return hasKey(key) ? t(key, { count, ...vars }) : String(count);
    },
    subject: (name) => {
      const key = `subject.${name}`;
      return hasKey(key) ? t(key) : name;
    },
    plannerWord: (text) => {
      const key = `plannerWord.${text}`;
      return hasKey(key) ? t(key) : text;
    },
    tx: (template, vars) => translateTemplate(lang, template, vars),
    phrase: (text) => translatePhrase(lang, text),
    clock: (time) => {
      if (lang !== 'tr') return time;
      const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time);
      if (!match) return time;
      let hour = Number(match[1]) % 12;
      if (match[3] === 'PM') hour += 12;
      return `${String(hour).padStart(2, '0')}:${match[2]}`;
    },
  };
}

const LanguageContext = createContext<Translator>(makeTranslator(DEFAULT_LANG));

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readSavedLanguage);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still works until the page is closed.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => makeTranslator(lang, setLang), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
