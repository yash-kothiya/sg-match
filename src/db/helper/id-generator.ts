import { v4 as uuidv4 } from "uuid";

export const generateId = (prefix: string): string => {
  return `${prefix}_${uuidv4()}`;
};
