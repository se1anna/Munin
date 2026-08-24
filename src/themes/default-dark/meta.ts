import { ThemeMetadata } from "../../types/theme";

export const defaultDarkMeta: ThemeMetadata = {
  id: "default-dark",
  name: "Default Dark",
  version: "1.0.0",
  description: "极简暗黑经典主题。默认设计的高性能极简暗黑风格，科技感荧光蓝点缀，圆角卡片流与紧凑排版。",
  author: "se1anna",
  tags: ["极简经典", "暗黑模式", "科技蓝", "圆角卡片", "紧凑阅读"],
  preview: {
    accentColor: "#38bdf8",
    bgColor: "#0d0f12",
    textColor: "#e2e8f0",
    cardBg: "#161a20",
    fontFamilySans: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    features: [
      "科技感荧光蓝（#38bdf8）重点点缀",
      "深灰表面与细腻微边框（#262c36）",
      "现代圆角卡片流（8px 优雅倒角）",
      "高密度信息架构与经典博客布局",
      "轻量化极速首屏渲染"
    ]
  }
};
