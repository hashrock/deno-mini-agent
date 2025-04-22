import { askLLM } from "../services/llm.ts";
import { toolDefinitions } from "../config/tools.ts";

/**
 * キャンバスツール
 * @param input プロンプト
 * @returns レポート内容
 */
export async function canvasTool(input: string): Promise<string> {
  const tool = toolDefinitions.canvasTool;
  const prompt = `${input}。フォーマットは${tool.jsonSchema}のようなJSON形式で返します。`;
  return await askLLM(
    prompt,
    "あなたはレポート作成の専門家です。指定されたフォーマットでレポートを作成してください。"
  );
}
