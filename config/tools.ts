// ツールのインターフェース定義
export interface Tool {
  name: string;
  description: string;
  fn: (prompt: string) => Promise<string>;
  jsonSchema: string;
}

// ツール定義
export const toolDefinitions: Record<string, Omit<Tool, "fn">> = {
  weatherTool: {
    name: "weatherTool",
    description: "天気を取得するツールです。",
    jsonSchema: JSON.stringify([
      { city: "東京", weather: "晴れ", date: "2025-01-01" },
      { city: "東京", weather: "晴れ", date: "2025-01-02" },
    ]),
  },
  tripAdvisorTool: {
    name: "tripAdvisorTool",
    description: "旅行アドバイザーです。",
    jsonSchema: JSON.stringify({
      plans: [{ place: "国立国会図書館", date: "2025-01-01" }],
    }),
  },
  canvasTool: {
    name: "canvasTool",
    description: "最終的なレポートを作成するツールです。",
    jsonSchema: JSON.stringify({
      content: "レポートの内容",
    }),
  },
};
