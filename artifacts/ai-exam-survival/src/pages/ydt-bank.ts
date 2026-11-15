// Stage 22C: YDT (Yabancı Dil Testi, English) for the exam mode: three full sets of 80 original questions (240) in the
// booklet order of the exam. Questions in English (instructions in Turkish, as in the exam), explanations in Turkish.
// Original questions written for this app in the ÖSYM style; not ÖSYM questions and not approved by ÖSYM or MEB.
// In the source the FIRST option is the correct one; placeOptions moves it (I–V options are shown in order).
import { placeOptions, type TytQuestion } from './tyt-bank';
import { YDT_PLAN, type YdtTopic } from './ydt-common';
import { YDT_SET_1 } from './ydt-set1';
import { YDT_SET_2 } from './ydt-set2';
import { YDT_SET_3 } from './ydt-set3';

export const YDT_SETS = [YDT_SET_1, YDT_SET_2, YDT_SET_3];

/** Ids "ydt-<set>-<n>" (n = 1–80, the question number in the full exam). */
export const YDT_QUESTIONS: TytQuestion[] = YDT_SETS.flatMap((set, s) =>
  set.map((seed, i) => {
    const { options, answer } = placeOptions(seed, s * 80 + i);
    return { ...seed, id: `ydt-${s + 1}-${i + 1}`, options, answer };
  }),
);

/** All 80 question ids of one set (0, 1 or 2), in the booklet order. */
export function ydtSetIds(set: number): string[] {
  return YDT_QUESTIONS.filter((q) => q.id.startsWith(`ydt-${set + 1}-`)).map((q) => q.id);
}

/** The 40 questions of one half of a set (half 0 or 1), keeping the booklet order; a text and its questions stay together. */
export function ydtHalfIds(set: number, half: number): string[] {
  const seen: Record<string, number> = {};
  return YDT_QUESTIONS.filter((q) => q.id.startsWith(`ydt-${set + 1}-`))
    .filter((q) => {
      const n = seen[q.topic] ?? 0;
      seen[q.topic] = n + 1;
      return (n < YDT_PLAN[q.topic as YdtTopic].firstHalf) === (half === 0);
    })
    .map((q) => q.id);
}
