import { askLLM } from "../services/llm.ts";
import { toolDefinitions } from "../config/tools.ts";

/**
 * 旅行アドバイザーツール
 * @param input プロンプト
 * @returns 旅行情報
 */
export async function tripAdvisorTool(input: string): Promise<string> {
  const tool = toolDefinitions.tripAdvisorTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return await askLLM(
    prompt,
    "あなたは旅行アドバイザーです。指定されたフォーマットで旅行情報を提供してください。"
  );
}
