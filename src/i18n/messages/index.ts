import { en } from "./en";
import { pt } from "./pt";
import { es } from "./es";

export const messages = { en, pt, es } as const;
export type Locale = keyof typeof messages;
export const LOCALES: Locale[] = ["en", "pt", "es"];
export type { Messages } from "./en";
