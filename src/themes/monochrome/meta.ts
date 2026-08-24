import { ThemeMetadata } from "../../types/theme";

export const monochromeMeta: ThemeMetadata = {
  id: "monochrome",
  name: "Monochrome",
  version: "1.0.0",
  description: "极简纯黑白典藏主题。纯粹黑白二色，Playfair Display 衬线大标题，重墨线条，零圆角几何精度与杂志级排版质感。",
  author: "se1anna",
  tags: ["极简黑白", "典藏衬线", "直角纯粹", "报刊排版", "黑白反色"],
  preview: {
    accentColor: "#000000",
    bgColor: "#FFFFFF",
    textColor: "#000000",
    cardBg: "#F5F5F5",
    fontFamilySans: "\"Source Serif 4\", Georgia, serif",
    fontFamilyDisplay: "\"Playfair Display\", Georgia, serif",
    features: [
      "极致黑白二色：纯白底色（#FFFFFF）与浓黑字型（#000000）",
      "Playfair Display 经典高贵衬线标题与优美斜体",
      "全站 0px 直角硬朗几何边界与 2px / 4px 粗重分界线",
      "纯黑实心方块按钮，悬停触发瞬时反色倒转",
      "JetBrains Mono 等宽数据与大写元标签"
    ]
  }
};
