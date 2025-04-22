import { systemPrompt } from "./config/system.ts";
import { ContextManager } from "./services/context.ts";
import { askLLM } from "./services/llm.ts";
import {
  displayRawResponse,
  displayParsedResponse,
  displayTaskList,
  shouldExecuteTask,
  Task,
} from "./services/io.ts";
import { executeTask } from "./services/task-executor.ts";
import { toolsRegistry } from "./tools/index.ts";
import { parseResponse } from "./utils/parser.ts";

/**
 * メイン関数
 * アプリケーションのエントリーポイント
 */
async function main() {
  // コンテキストマネージャーの初期化
  const contextManager = new ContextManager();

  // ユーザープロンプト
  const userPrompt =
    "来週東京に旅行に行きます。１週間くらいゆっくり博物館を巡りたいなあ。天気が良い日を選んで旅行計画を立てるためにまずタスクに分解してください。";

  // LLMからタスク一覧を取得
  const response = await askLLM(userPrompt, systemPrompt);
  displayRawResponse(response);

  // 応答を解析
  const parsed = parseResponse(response);
  displayParsedResponse(parsed);

  // タスク一覧の処理
  if (parsed.tasks && parsed.tasks.length > 0) {
    displayTaskList(parsed.tasks);

    // 各タスクについてユーザーに実行の許可を求める
    for (let i = 0; i < parsed.tasks.length; i++) {
      const task = parsed.tasks[i];

      // ユーザーに実行の許可を求める
      if (await shouldExecuteTask(i)) {
        // タスクを実行
        const result = await executeTask(task, contextManager, toolsRegistry);

        // 結果を共有コンテキストに保存
        try {
          // JSON形式の場合はパースして保存
          const jsonResult = JSON.parse(result);
          contextManager.addToContext(task.tool, jsonResult);
        } catch (e) {
          // テキスト形式の場合はそのまま保存
          contextManager.addToContext(task.tool, result);
        }
      } else {
        console.log(`タスク ${i + 1} はスキップされました`);
      }
    }

    // 最終的なコンテキストを表示
    contextManager.displayFinalContext();
  }
}

// メイン関数の実行
if (import.meta.main) {
  await main();
}
