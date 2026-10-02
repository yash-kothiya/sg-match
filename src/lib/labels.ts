import { AVAILABILITY_OPTIONS, EXPERIENCE_LEVELS, STUDY_MODES } from "@/config/constants";

const labelOf = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

export const levelLabel = (value: string) => labelOf(EXPERIENCE_LEVELS, value);
export const modeLabel = (value: string) => labelOf(STUDY_MODES, value);
export const slotLabel = (value: string) => labelOf(AVAILABILITY_OPTIONS, value);
