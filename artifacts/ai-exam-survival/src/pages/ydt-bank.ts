// Stage 22C: YDT (Yabancı Dil Testi, English) for the exam mode: three full sets of 80 original questions (240).
// Stage 22C-2: every set follows the real ÖSYM YDT booklet layout (YDT_PLAN): 15 questions of the first sets were
// retired (YDT_RETIRED) and 15 new ones added per set (YDT_EXTRA). Questions in English (instructions in Turkish, as in
// the exam), explanations in Turkish. Original questions in the ÖSYM style; not ÖSYM questions, not approved by ÖSYM or MEB.
// In the source the FIRST option is the correct one; placeOptions moves it (I–V options are shown in order).
// Ids never change meaning, so saved exams can still be reviewed: "ydt-<set>-<n>" with n = 1–80 for the first sets
// (same id and same option order as in Stage 22C) and n = 81–95 for the questions added in Stage 22C-2.
import { placeOptions, type TytQuestion } from './tyt-bank';
import { YDT_PLAN, YDT_TOPIC, type YdtTopic } from './ydt-common';
import { YDT_EXTRA, YDT_RETIRED } from './ydt-extra';
import { YDT_SET_1 } from './ydt-set1';
import { YDT_SET_2 } from './ydt-set2';
import { YDT_SET_3 } from './ydt-set3';

const FIRST_SETS = [YDT_SET_1, YDT_SET_2, YDT_SET_3];
const ORDER: string[] = Object.values(YDT_TOPIC);

/** Every YDT question ever used (285): the 240 of Stage 22C and the 45 added in Stage 22C-2. */
export const YDT_ALL_QUESTIONS: TytQuestion[] = FIRST_SETS.flatMap((set, s) => [
  ...set.map((seed, i) => {
    const { options, answer } = placeOptions(seed, s * 80 + i);
    return { ...seed, id: `ydt-${s + 1}-${i + 1}`, options, answer };
  }),
  ...YDT_EXTRA[s].map((seed, j) => {
    const { options, answer } = placeOptions(seed, 240 + s * 15 + j + 2);
    return { ...seed, id: `ydt-${s + 1}-${81 + j}`, options, answer };
  }),
]);

const numberOf = (q: TytQuestion) => Number(q.id.split('-')[2]);

/** The three sets used by new exams, 80 questions each, in the booklet order of the real exam. */
export const YDT_SETS: TytQuestion[][] = FIRST_SETS.map((_, s) =>
  YDT_ALL_QUESTIONS.filter((q) => q.id.startsWith(`ydt-${s + 1}-`) && !YDT_RETIRED[s].includes(numberOf(q)))
    .map((q, i) => ({ q, i }))
    .sort((a, b) => ORDER.indexOf(a.q.topic) - ORDER.indexOf(b.q.topic) || a.i - b.i)
    .map(({ q }) => q),
);

/** The 240 questions of the three sets (what new exams show). */
export const YDT_QUESTIONS: TytQuestion[] = YDT_SETS.flat();

/** All 80 question ids of one set (0, 1 or 2), in the booklet order. */
export function ydtSetIds(set: number): string[] {
  return YDT_SETS[set].map((q) => q.id);
}

/** The 40 questions of one half of a set (half 0 or 1), keeping the booklet order; a text and its questions stay together. */
export function ydtHalfIds(set: number, half: number): string[] {
  const seen: Record<string, number> = {};
  return YDT_SETS[set]
    .filter((q) => {
      const n = seen[q.topic] ?? 0;
      seen[q.topic] = n + 1;
      return (n < YDT_PLAN[q.topic as YdtTopic].firstHalf) === (half === 0);
    })
    .map((q) => q.id);
}
