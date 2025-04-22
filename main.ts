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
  weatherTool: {
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
  canvasTool: {
    fn: canvasTool,
    name: "canvasTool",
    description: "最終的なレポートを作成するツールです。",
    jsonSchema: JSON.stringify({
      content: "レポートの内容",
    }),
  },
};

function weatherTool(input: string): Promise<string> {
  const tool = tools.weatherTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return ask(prompt);
}

function tripAdvisorTool(input: string): Promise<string> {
  const tool = tools.tripAdvisorTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return ask(prompt);
}

function canvasTool(input: string): Promise<string> {
  const tool = tools.canvasTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return ask(prompt);
}

// 共有コンテキストを保存する変数
const sharedContext: Record<string, any> = {};

// タスクを実行する関数
async function executeTask(task: {
  tool: string;
  prompt: string;
}): Promise<string> {
  console.log(`\n===== タスク実行中: ${task.tool} =====`);
  console.log(`プロンプト: ${task.prompt}`);

  // コンテキストを含めたプロンプトを作成
  let contextEnrichedPrompt = task.prompt;
  if (Object.keys(sharedContext).length > 0) {
    contextEnrichedPrompt +=
      "\n\n以下は前のタスクの結果です：\n" +
      JSON.stringify(sharedContext, null, 2);
  }

  // ツールが存在するか確認
  if (tools[task.tool]) {
    try {
      const result = await tools[task.tool].fn(contextEnrichedPrompt);
      console.log(`\n結果: ${result}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`エラー: ${errorMessage}`);
      return `エラー: ${errorMessage}`;
    }
  } else {
    return `エラー: ツール "${task.tool}" は存在しません`;
  }
}

// ユーザーの入力を取得する関数
async function promptUser(message: string): Promise<string> {
  const buf = new Uint8Array(1024);
  console.log(message);
  await Deno.stdout.write(new TextEncoder().encode("> "));
  const n = await Deno.stdin.read(buf);
  if (n === null) return "";
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
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

    // 各タスクについてユーザーに実行の許可を求める
    for (let i = 0; i < parsed.tasks.length; i++) {
      const task = parsed.tasks[i];
      const answer = await promptUser(
        `\nタスク ${i + 1} を実行しますか？ (y/n)`
      );

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        const result = await executeTask(task);

        // 結果を共有コンテキストに保存
        try {
          // JSON形式の場合はパースして保存
          const jsonResult = JSON.parse(result);
          sharedContext[task.tool] = jsonResult;
        } catch (e) {
          // テキスト形式の場合はそのまま保存
          sharedContext[task.tool] = result;
        }

        console.log("\n===== 共有コンテキスト更新 =====");
        console.log(JSON.stringify(sharedContext, null, 2));
      } else {
        console.log(`タスク ${i + 1} はスキップされました`);
      }
    }

    console.log("\n===== すべてのタスク処理完了 =====");
    console.log("最終的な共有コンテキスト:");
    console.log(JSON.stringify(sharedContext, null, 2));
  }
}
