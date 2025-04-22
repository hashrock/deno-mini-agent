import OpenAI from "@openai/openai";

const client = new OpenAI();

async function ask(prompt: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return response.choices[0].message.content;
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

function parseResponse(response: string): {
  thinking?: string;
  answer?: string;
  task?: string;
} {
  const result: { thinking?: string; answer?: string; task?: string } = {};

  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) result.thinking = thinkingMatch[1].trim();

  const answerMatch = response.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) result.answer = answerMatch[1].trim();

  const taskMatch = response.match(/<task>([\s\S]*?)<\/task>/);
  if (taskMatch) result.task = taskMatch[1].trim();

  return result;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log(
    await ask(
      "来週東京に旅行に行きます。１週間くらいゆっくり博物館を巡りたいなあ。天気が良い日を選んで旅行計画を立てるためにまずタスクに分解してください。"
    )
  );
}
