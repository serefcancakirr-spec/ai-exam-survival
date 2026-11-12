// Stage 13: which Menti mood fits the moment. Pure rules, no data is saved.
import type { MentiPose } from './menti';

export type DayPart = 'morning' | 'day' | 'evening' | 'night';

/** 05–11 morning, 12–17 day, 18–22 evening, 23–04 night. */
export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

/** Quiz results: 70% or more → cheer, 40–69% → encourage, below 40% → comfort. */
export function quizMood(percentage: number): Extract<MentiPose, 'cheer' | 'encourage' | 'comfort'> {
  if (percentage >= 70) return 'cheer';
  if (percentage >= 40) return 'encourage';
  return 'comfort';
}

/** True only when the week has study sessions and every one is ticked. */
export function weekComplete(studyTasks: { completed: boolean }[]) {
  return studyTasks.length > 0 && studyTasks.every((task) => task.completed);
}
