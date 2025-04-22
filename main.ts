import OpenAI from "@openai/openai";
import { parseResponse } from "./parser.ts";

const client = new OpenAI();

async function ask(prompt: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return response.choices[0].message.content || "";
}

const system = `
あなたはタスク分解のプロです。下記のフォーマットに基づいて応答します。XML以外を返すことは禁止されています。
<thinking>
ここにユーザーの質問に対する考え方を記述します。ユーザがどのようなゴールを求めているのか明確化します。
</thinking>
<task tool="{tool_name}">
<prompt>ここにツールに渡すプロンプトを記述します。</prompt>
</task>
<task tool="{tool_name}">
<prompt>ここにツールに渡すプロンプトを記述します。直前のタスクの結果がcontextに入っていることを前提にします。</prompt>
</task>


あなたが使えるツールは下記の通りです。
tripAdvisorTool: 旅行アドバイザーです。応答は{plans: [{place: "東京", date: "2025-01-01"}]}のようなJSON形式で返します。
weatherTool: 天気を取得するツールです。応答は{city: "東京", weather: "晴れ"}のようなJSON形式で返します。
canvasTool: 最終的なレポートを作成するツールです。応答は{content: "レポートの内容"}のようなJSON形式で返します。
`;

interface Tool {
  name: string;
  description: string;
  fn: (prompt: string) => Promise<string>;
  jsonSchema: string;
}

const tools: Record<string, Tool> = {
  whetherTool: {
    fn: weatherTool,
    name: "weatherTool",
    description: "天気を取得するツールです。",
    jsonSchema: JSON.stringify([
      { city: "東京", weather: "晴れ", date: "2025-01-01" },
      { city: "東京", weather: "晴れ", date: "2025-01-02" },
    ]),
  },
  tripAdvisorTool: {
    fn: tripAdvisorTool,
    name: "tripAdvisorTool",
    description: "旅行アドバイザーです。",
    jsonSchema: JSON.stringify({
      plans: [{ place: "国立国会図書館", date: "2025-01-01" }],
    }),
  },
};

function weatherTool(input: string): Promise<string> {
  const tool = tools.whetherTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return ask(prompt);
}

function tripAdvisorTool(input: string): Promise<string> {
  const tool = tools.tripAdvisorTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return ask(prompt);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const prompt =
    "来週東京に旅行に行きます。１週間くらいゆっくり博物館を巡りたいなあ。天気が良い日を選んで旅行計画を立てるためにまずタスクに分解してください。";
  const response = await ask(prompt);

  console.log("===== 生の応答 =====");
  console.log(response);

  console.log("\n===== 解析結果 =====");
  const parsed = parseResponse(response);
  console.log(JSON.stringify(parsed, null, 2));

  if (parsed.tasks && parsed.tasks.length > 0) {
    console.log("\n===== タスク一覧 =====");
    parsed.tasks.forEach((task, index) => {
      console.log(`タスク ${index + 1}:`);
      console.log(`  ツール: ${task.tool}`);
      console.log(`  プロンプト: ${task.prompt}`);
    });
  }
}
