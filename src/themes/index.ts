import { ThemePackage, ThemeMetadata } from "../types/theme";
import boldTypographyTheme from "./bold-typography";
import defaultDarkTheme from "./default-dark";
import monochromeTheme from "./monochrome";
import monochromeDarkTheme from "./monochrome-dark";

export const DEFAULT_THEME_ID = "bold-typography";

/**
 * All installed theme packages registered in the system.
 * Adding a new theme simply requires registering its self-contained package here!
 */
const THEME_REGISTRY: Record<string, ThemePackage> = {
  [boldTypographyTheme.meta.id]: boldTypographyTheme,
  [monochromeTheme.meta.id]: monochromeTheme,
  [monochromeDarkTheme.meta.id]: monochromeDarkTheme,
  [defaultDarkTheme.meta.id]: defaultDarkTheme
};

/**
 * Returns the list of all available theme metadata for admin selection and preview
 */
export function getAllThemeMetas(): ThemeMetadata[] {
  return Object.values(THEME_REGISTRY).map((pkg) => pkg.meta);
}

/**
 * Checks whether a theme ID exists in the registry
 */
export function hasTheme(id: string): boolean {
  if (!id) return false;
  return Object.prototype.hasOwnProperty.call(THEME_REGISTRY, id);
}

/**
 * Gets a theme package by ID, with safe automatic fallback to default theme
 */
export function getThemePackage(id?: string): ThemePackage {
  if (id && THEME_REGISTRY[id]) {
    return THEME_REGISTRY[id];
  }
  return THEME_REGISTRY[DEFAULT_THEME_ID] || defaultDarkTheme;
}

export { boldTypographyTheme, defaultDarkTheme, monochromeTheme, monochromeDarkTheme };
