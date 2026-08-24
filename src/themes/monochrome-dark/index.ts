import { ThemePackage, ThemeManifest } from "../../types/theme";
import manifestJson from "./theme.json";
import { MONOCHROME_DARK_CSS } from "./styles";
import * as templates from "./templates";
import { monochromeDarkMeta } from "./meta";

export const monochromeDarkTheme: ThemePackage = {
  meta: monochromeDarkMeta,
  manifest: manifestJson as unknown as ThemeManifest,
  css: MONOCHROME_DARK_CSS,
  templates
};

export { monochromeDarkMeta };
export default monochromeDarkTheme;
