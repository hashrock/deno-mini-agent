import OpenAI from "@openai/openai";

// OpenAIクライアントのインスタンス
const client = new OpenAI();

/**
 * LLMに対してプロンプトを送信し、応答を取得する
 * @param prompt ユーザープロンプト
 * @param systemPrompt システムプロンプト
 * @returns LLMからの応答
 */
export async function askLLM(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`LLM通信エラー: ${errorMessage}`);
    throw new Error(`LLM通信に失敗しました: ${errorMessage}`);
  }
}
