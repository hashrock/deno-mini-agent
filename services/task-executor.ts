import { parseResponse } from "../utils/parser.ts";
import { ContextManager } from "./context.ts";
import { Task } from "./io.ts";

/**
 * タスクを実行する
 * @param task 実行するタスク
 * @param contextManager コンテキストマネージャー
 * @param toolsRegistry ツールレジストリ
 * @returns 実行結果
 */
export async function executeTask(
  task: Task,
  contextManager: ContextManager,
  toolsRegistry: Record<string, (prompt: string) => Promise<string>>
): Promise<string> {
  console.log(`\n===== タスク実行中: ${task.tool} =====`);
  console.log(`プロンプト: ${task.prompt}`);

  // コンテキストを含めたプロンプトを作成
  const contextEnrichedPrompt =
    task.prompt + contextManager.getContextForPrompt();

  // ツールが存在するか確認
  if (toolsRegistry[task.tool]) {
    try {
      // 第1段階: 中間プロンプト生成
      const intermediateResult = await generateIntermediatePrompt(
        task,
        contextEnrichedPrompt,
        toolsRegistry
      );

      // 第2段階: 最終結果取得
      return await executeFinalPrompt(task, intermediateResult, toolsRegistry);
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

/**
 * 中間プロンプトを生成する
 * @param task タスク
 * @param contextEnrichedPrompt コンテキスト付きプロンプト
 * @param toolsRegistry ツールレジストリ
 * @returns 中間結果
 */
async function generateIntermediatePrompt(
  task: Task,
  contextEnrichedPrompt: string,
  toolsRegistry: Record<string, (prompt: string) => Promise<string>>
): Promise<string> {
  const intermediateResult = await toolsRegistry[task.tool](
    contextEnrichedPrompt
  );
  console.log(`\n中間結果: ${intermediateResult}`);
  return intermediateResult;
}

/**
 * 最終プロンプトを実行する
 * @param task タスク
 * @param intermediateResult 中間結果
 * @param toolsRegistry ツールレジストリ
 * @returns 最終結果
 */
async function executeFinalPrompt(
  task: Task,
  intermediateResult: string,
  toolsRegistry: Record<string, (prompt: string) => Promise<string>>
): Promise<string> {
  // 応答を解析
  const parsed = parseResponse(intermediateResult);

  // 解析結果からプロンプトを抽出
  if (parsed.tasks && parsed.tasks.length > 0) {
    // タスクが含まれている場合、最初のタスクのプロンプトを使用
    const firstTask = parsed.tasks[0];
    const finalPrompt = firstTask.prompt;
    console.log(`\n抽出されたプロンプト: ${finalPrompt}`);

    // 第二ステップ: 抽出されたプロンプトを使って実際のデータを取得
    console.log(`\n===== 最終実行: ${task.tool} =====`);
    const finalResult = await toolsRegistry[task.tool](finalPrompt);
    console.log(`\n最終結果: ${finalResult}`);
    return finalResult;
  } else {
    // タスクが含まれていない場合は初期結果をそのまま返す
    return intermediateResult;
  }
}
