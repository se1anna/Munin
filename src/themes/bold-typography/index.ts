import { ThemePackage, ThemeManifest } from "../../types/theme";
import manifestJson from "./theme.json";
import { BOLD_TYPOGRAPHY_CSS } from "./styles";
import * as templates from "./templates";
import { boldTypographyMeta } from "./meta";

export const boldTypographyTheme: ThemePackage = {
  meta: boldTypographyMeta,
  manifest: manifestJson as unknown as ThemeManifest,
  css: BOLD_TYPOGRAPHY_CSS,
  templates
};

export { boldTypographyMeta };
export default boldTypographyTheme;
