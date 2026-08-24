import { ThemePackage, ThemeManifest } from "../../types/theme";
import manifestJson from "./theme.json";
import { DEFAULT_DARK_CSS } from "./styles";
import * as templates from "./templates";
import { defaultDarkMeta } from "./meta";

export const defaultDarkTheme: ThemePackage = {
  meta: defaultDarkMeta,
  manifest: manifestJson as unknown as ThemeManifest,
  css: DEFAULT_DARK_CSS,
  templates
};

export { defaultDarkMeta };
export default defaultDarkTheme;
