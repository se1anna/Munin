import { ThemeMetadata } from "../../types/theme";

export const boldTypographyMeta: ThemeMetadata = {
  id: "bold-typography",
  name: "Bold Typography",
  version: "1.0.0",
  description: "海报级大字排版主题。将平面艺术海报排版转译为现代 Web 语言，极致字阶对比度，锋利直角，朱砂红点睛与纸张颗粒噪点。",
  author: "se1anna",
  tags: ["海报排版", "极简暗黑", "直角硬朗", "朱砂红点睛", "颗粒质感"],
  preview: {
    accentColor: "#FF3D00",
    bgColor: "#0A0A0A",
    textColor: "#FAFAFA",
    cardBg: "#0F0F0F",
    fontFamilySans: "Inter Tight, sans-serif",
    fontFamilyDisplay: "Playfair Display, serif",
    features: [
      "80pt 巨幅海报级标题与紧凑字距",
      "全站 0px 直角硬朗设计，杜绝圆角",
      "纯文字交互链接与朱砂红动态下划线微动效",
      "Playfair Display 经典衬线引文块",
      "1.5% 超低透明度分形纸质噪点背景",
      "JetBrains Mono 等宽数据与全大写元标签"
    ]
  }
};
