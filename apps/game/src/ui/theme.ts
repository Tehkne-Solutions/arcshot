export type ArcshotTheme = "light" | "dark";

export interface ArcshotUiPalette {
  readonly isLight: boolean;
  readonly backgroundTop: number;
  readonly backgroundBottom: number;
  readonly backgroundGlow: number;
  readonly panel: number;
  readonly panelStrong: number;
  readonly panelAlt: number;
  readonly border: number;
  readonly borderStrong: number;
  readonly primary: number;
  readonly primaryHover: number;
  readonly secondary: number;
  readonly accent: number;
  readonly accentSoft: number;
  readonly success: number;
  readonly danger: number;
  readonly text: string;
  readonly muted: string;
  readonly softText: string;
  readonly disabled: string;
}

const STORAGE_KEY = "arcshot:ui-theme";

export const ARCSHOT_THEMES: Record<ArcshotTheme, ArcshotUiPalette> = {
  light: {
    isLight: true,
    backgroundTop: 0xeef7ff,
    backgroundBottom: 0xdce8ff,
    backgroundGlow: 0x8ec9ff,
    panel: 0xffffff,
    panelStrong: 0xf7faff,
    panelAlt: 0xeaf2ff,
    border: 0xb9cbe5,
    borderStrong: 0x2f6cff,
    primary: 0x2f6cff,
    primaryHover: 0x1c55da,
    secondary: 0x7b61ff,
    accent: 0xf2ad35,
    accentSoft: 0xffe7ad,
    success: 0x27b975,
    danger: 0xe35656,
    text: "#14233a",
    muted: "#526984",
    softText: "#7186a1",
    disabled: "#94a5bb",
  },
  dark: {
    isLight: false,
    backgroundTop: 0x091020,
    backgroundBottom: 0x15142e,
    backgroundGlow: 0x4f3f94,
    panel: 0x111c31,
    panelStrong: 0x182640,
    panelAlt: 0x0d1729,
    border: 0x36547c,
    borderStrong: 0x67dcff,
    primary: 0x42b7ff,
    primaryHover: 0x69ceff,
    secondary: 0x8d70ff,
    accent: 0xffc857,
    accentSoft: 0x674f24,
    success: 0x48d597,
    danger: 0xff6b6b,
    text: "#f4f7ff",
    muted: "#a8b7d6",
    softText: "#7f93b4",
    disabled: "#61718a",
  },
};

const isArcshotTheme = (value: string | null): value is ArcshotTheme => value === "light" || value === "dark";

export const getArcshotTheme = (): ArcshotTheme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isArcshotTheme(stored) ? stored : "light";
};

export const applyArcshotTheme = (theme: ArcshotTheme): ArcshotTheme => {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, theme);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.arcshotTheme = theme;
    document.body.dataset.arcshotTheme = theme;
  }
  return theme;
};

export const initialiseArcshotTheme = (): ArcshotTheme => applyArcshotTheme(getArcshotTheme());
