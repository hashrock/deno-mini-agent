import { askLLM } from "../services/llm.ts";
import { toolDefinitions } from "../config/tools.ts";

/**
 * 天気ツール
 * @param input プロンプト
 * @returns 天気情報
 */
export async function weatherTool(input: string): Promise<string> {
  const tool = toolDefinitions.weatherTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return await askLLM(
    prompt,
    "あなたは天気予報の専門家です。指定されたフォーマットで天気情報を提供してください。"
  );
}
