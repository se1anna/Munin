import { ThemePackage, ThemeManifest } from "../../types/theme";
import manifestJson from "./theme.json";
import { MONOCHROME_CSS } from "./styles";
import * as templates from "./templates";
import { monochromeMeta } from "./meta";

export const monochromeTheme: ThemePackage = {
  meta: monochromeMeta,
  manifest: manifestJson as unknown as ThemeManifest,
  css: MONOCHROME_CSS,
  templates
};

export { monochromeMeta };
export default monochromeTheme;
