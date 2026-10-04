import { AVAILABILITY_OPTIONS, EXPERIENCE_LEVELS, STUDY_MODES } from "@/config/constants";

const labelOf = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

export const levelLabel = (value: string) => labelOf(EXPERIENCE_LEVELS, value);
export const modeLabel = (value: string) => labelOf(STUDY_MODES, value);
export const slotLabel = (value: string) => labelOf(AVAILABILITY_OPTIONS, value);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
