import { ThemeMetadata } from "../../types/theme";

export const monochromeDarkMeta: ThemeMetadata = {
  id: "monochrome-dark",
  name: "Monochrome Dark",
  version: "1.0.0",
  description: "极简纯黑白暗夜典藏主题。纯黑底色与纯白衬线字型，Playfair Display 标题，反色高对比度，零圆角几何精度与杂志级暗黑排版。",
  author: "se1anna",
  tags: ["极简暗黑", "典藏衬线", "直角纯粹", "反色对比", "暗黑杂志"],
  preview: {
    accentColor: "#FFFFFF",
    bgColor: "#000000",
    textColor: "#FFFFFF",
    cardBg: "#121212",
    fontFamilySans: "\"Source Serif 4\", Georgia, serif",
    fontFamilyDisplay: "\"Playfair Display\", Georgia, serif",
    features: [
      "极致反色黑白：纯黑底色（#000000）与纯白字型（#FFFFFF）",
      "Playfair Display 经典高贵衬线标题与优美斜体",
      "全站 0px 直角硬朗几何边界与 2px / 4px 纯白分界线",
      "纯白实心方块按钮，悬停触发瞬时反色倒转",
      "JetBrains Mono 等宽数据与大写元标签"
    ]
  }
};
