// Stage 22: every exam-mode question (TYT from Stage 22A, AYT Sayısal from Stage 22B-1, AYT Sözel from Stage 22B-2a), found by id.
import { AYT_QUESTIONS } from './ayt-bank';
import { AYT_SOZEL_QUESTIONS } from './ayt-sozel-bank';
import { TYT_QUESTIONS, type TytQuestion } from './tyt-bank';

export const EXAM_QUESTIONS: TytQuestion[] = [...TYT_QUESTIONS, ...AYT_QUESTIONS, ...AYT_SOZEL_QUESTIONS];
export const EXAM_BY_ID = new Map(EXAM_QUESTIONS.map((question) => [question.id, question]));
