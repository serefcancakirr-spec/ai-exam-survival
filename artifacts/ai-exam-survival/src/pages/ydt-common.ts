// Stage 22C: shared helpers for the YDT (English) question sets in ydt-set1.ts … ydt-set3.ts.
import type { Seed } from './tyt-bank';

export type { Seed };

/** Question types of the YDT booklet, in the order they appear (shown as the topic in Turkish, like the exam). */
export const YDT_TOPIC = {
  vocab: 'Kelime bilgisi',
  grammar: 'Dil bilgisi',
  cloze: 'Cloze test',
  sentence: 'Cümle tamamlama',
  toTr: 'Çeviri (İngilizce → Türkçe)',
  toEn: 'Çeviri (Türkçe → İngilizce)',
  reading: 'Okuma',
  dialogue: 'Diyalog tamamlama',
  closest: 'Anlamca en yakın cümle',
  paragraph: 'Paragraf tamamlama',
  irrelevant: 'Anlam bütünlüğünü bozan cümle',
} as const;
export type YdtTopic = (typeof YDT_TOPIC)[keyof typeof YDT_TOPIC];

/** Questions of one full YDT per type (80) and how many of each go into the first mini exam of a set (40). */
export const YDT_PLAN: Record<YdtTopic, { full: number; firstHalf: number }> = {
  'Kelime bilgisi': { full: 6, firstHalf: 3 },
  'Dil bilgisi': { full: 10, firstHalf: 5 },
  'Cloze test': { full: 10, firstHalf: 5 },
  'Cümle tamamlama': { full: 10, firstHalf: 4 },
  'Çeviri (İngilizce → Türkçe)': { full: 3, firstHalf: 2 },
  'Çeviri (Türkçe → İngilizce)': { full: 3, firstHalf: 1 },
  'Okuma': { full: 20, firstHalf: 12 },
  'Diyalog tamamlama': { full: 5, firstHalf: 2 },
  'Anlamca en yakın cümle': { full: 4, firstHalf: 2 },
  'Paragraf tamamlama': { full: 4, firstHalf: 2 },
  'Anlam bütünlüğünü bozan cümle': { full: 5, firstHalf: 2 },
};

export const y = (topic: YdtTopic, passage: string, prompt: string, options: Seed['options'], explanation: string): Seed =>
  ({ subject: 'ydt', topic, passage, prompt, options, explanation });
