import { ThemeManifest } from "../types/theme";
import defaultThemeJson from "../themes/default-dark/theme.json";
import { THEME_DARK_CSS } from "../views/block-styles";

export class ThemeLoader {
  private currentManifest: ThemeManifest;

  constructor(manifest?: ThemeManifest) {
    this.currentManifest = manifest || (defaultThemeJson as unknown as ThemeManifest);
  }

  public generateCssVariables(): string {
    const lines: string[] = [":root {"];

    // Color palette from theme.json
    if (this.currentManifest.settings?.color?.palette) {
      for (const color of this.currentManifest.settings.color.palette) {
        lines.push(`  --wp--preset--color--${color.slug}: ${color.color};`);
      }
    }

    // Typography
    if (this.currentManifest.settings?.typography?.fontSizes) {
      for (const fs of this.currentManifest.settings.typography.fontSizes) {
        lines.push(`  --wp--preset--font-size--${fs.slug}: ${fs.size};`);
      }
    }

    // Layout
    if (this.currentManifest.settings?.layout?.contentSize) {
      lines.push(`  --wp--custom--layout--content-size: ${this.currentManifest.settings.layout.contentSize};`);
    }
    if (this.currentManifest.settings?.layout?.wideSize) {
      lines.push(`  --wp--custom--layout--wide-size: ${this.currentManifest.settings.layout.wideSize};`);
    }

    lines.push("}");
    return lines.join("\n");
  }

  public getFullThemeCss(): string {
    const generatedVars = this.generateCssVariables();
    const customCss = this.currentManifest.customCSS || "";
    return `${generatedVars}\n${THEME_DARK_CSS}\n${customCss}`;
  }

  public loadThemeFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as ThemeManifest;
      if (parsed && typeof parsed.version === "number") {
        this.currentManifest = parsed;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const defaultThemeLoader = new ThemeLoader();
