// Stage 22C: shared helpers for the YDT (English) question sets in ydt-set1.ts … ydt-set3.ts.
import type { Seed } from './tyt-bank';

export type { Seed };

/** Question types of the YDT booklet, in the order they appear in the real ÖSYM booklets 2018–2026 (Stage 22C-2). */
export const YDT_TOPIC = {
  vocab: 'Kelime bilgisi',
  grammar: 'Dil bilgisi',
  cloze: 'Cloze test',
  sentence: 'Cümle tamamlama',
  reading: 'Okuma',
  dialogue: 'Diyalog tamamlama',
  closest: 'Anlamca en yakın cümle',
  situation: 'Durumda söylenecek söz',
  paragraph: 'Paragraf tamamlama',
  toTr: 'Çeviri (İngilizce → Türkçe)',
  toEn: 'Çeviri (Türkçe → İngilizce)',
  irrelevant: 'Anlam bütünlüğünü bozan cümle',
} as const;
export type YdtTopic = (typeof YDT_TOPIC)[keyof typeof YDT_TOPIC];

/**
 * Questions of one full YDT per type (80), as in every ÖSYM YDT booklet 2018–2026 (Stage 22C-2), and how many of each go
 * into the first mini exam of a set (40). A text is never split: the one cloze text is in the first mini, the five
 * reading texts (3 questions each) are split 2 + 3.
 */
export const YDT_PLAN: Record<YdtTopic, { full: number; firstHalf: number }> = {
  'Kelime bilgisi': { full: 8, firstHalf: 4 },
  'Dil bilgisi': { full: 7, firstHalf: 4 },
  'Cloze test': { full: 5, firstHalf: 5 },
  'Cümle tamamlama': { full: 8, firstHalf: 4 },
  'Okuma': { full: 15, firstHalf: 6 },
  'Diyalog tamamlama': { full: 5, firstHalf: 2 },
  'Anlamca en yakın cümle': { full: 5, firstHalf: 2 },
  'Durumda söylenecek söz': { full: 5, firstHalf: 2 },
  'Paragraf tamamlama': { full: 5, firstHalf: 3 },
  'Çeviri (İngilizce → Türkçe)': { full: 6, firstHalf: 3 },
  'Çeviri (Türkçe → İngilizce)': { full: 6, firstHalf: 3 },
  'Anlam bütünlüğünü bozan cümle': { full: 5, firstHalf: 2 },
};

export const y = (topic: YdtTopic, passage: string, prompt: string, options: Seed['options'], explanation: string): Seed =>
  ({ subject: 'ydt', topic, passage, prompt, options, explanation });
