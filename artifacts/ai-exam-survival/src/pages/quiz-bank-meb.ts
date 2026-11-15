// Stages 15–19: the MEB (Türkiye Yüzyılı Maarif Modeli) questions of every grade that has them.
// Grade 9: quiz-bank-meb9.ts, grade 10: quiz-bank-meb10.ts, grade 11: quiz-bank-meb11.ts; Felsefe and Din Kültürü (all grades):
// quiz-bank-felsefe-din.ts (Stage 22B-2b). Other grades/subjects use the shared sample bank.
import type { QuizSubject } from './quiz-question-bank';
import { MEB9_SEEDS, type MebSeed } from './quiz-bank-meb9';
import { MEB10_SEEDS } from './quiz-bank-meb10';
import { MEB11_SEEDS } from './quiz-bank-meb11';
import { FEL_DKAB_SEEDS } from './quiz-bank-felsefe-din';

export const MEB_SEEDS: Record<string, Partial<Record<QuizSubject, MebSeed[]>>> = {
  '9': { ...MEB9_SEEDS, ...FEL_DKAB_SEEDS['9'] },
  '10': { ...MEB10_SEEDS, ...FEL_DKAB_SEEDS['10'] },
  '11': { ...MEB11_SEEDS, ...FEL_DKAB_SEEDS['11'] },
  // Grade 12: only Din Kültürü has MEB questions; the other subjects keep the shared samples.
  '12': { ...FEL_DKAB_SEEDS['12'] },
};

const OUTCOME_BY_PROMPT = new Map<string, string>(
  Object.entries(MEB_SEEDS).flatMap(([grade, bySubject]) =>
    Object.entries(bySubject).flatMap(([subject, seeds]) =>
      (seeds ?? []).map((seed) => [`${grade}|${subject}|${seed.prompt}`, seed.outcome] as const),
    ),
  ),
);

/** The MEB learning outcome of a question (also of a saved one), or undefined for other questions. */
export function mebOutcome(question: { grade: string; subject: string; prompt: string }) {
  return OUTCOME_BY_PROMPT.get(`${question.grade}|${question.subject}|${question.prompt}`);
}

/** True when this grade of this subject uses MEB questions. */
export function usesMeb(grade: string, subject: string) {
  return Boolean(MEB_SEEDS[grade]?.[subject as QuizSubject]);
}
