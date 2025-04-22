/**
 * タスクの型定義
 */
export interface Task {
  tool: string;
  prompt: string;
}

/**
 * ユーザーからの入力を取得する
 * @param message 表示するメッセージ
 * @returns ユーザーの入力
 */
export async function promptUser(message: string): Promise<string> {
  const buf = new Uint8Array(1024);
  console.log(message);
  await Deno.stdout.write(new TextEncoder().encode("> "));
  const n = await Deno.stdin.read(buf);
  if (n === null) return "";
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

/**
 * タスク一覧を表示する
 * @param tasks タスク一覧
 */
export function displayTaskList(tasks: Task[]): void {
  console.log("\n===== タスク一覧 =====");
  tasks.forEach((task, index) => {
    console.log(`タスク ${index + 1}:`);
    console.log(`  ツール: ${task.tool}`);
    console.log(`  プロンプト: ${task.prompt}`);
  });
}

/**
 * タスクを実行するかどうかをユーザーに確認する
 * @param taskIndex タスクのインデックス
 * @returns 実行する場合はtrue
 */
export async function shouldExecuteTask(taskIndex: number): Promise<boolean> {
  const answer = await promptUser(
    `\nタスク ${taskIndex + 1} を実行しますか？ (y/n)`
  );
  return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

/**
 * 生の応答を表示する
 * @param response 応答
 */
export function displayRawResponse(response: string): void {
  console.log("===== 生の応答 =====");
  console.log(response);
}

/**
 * 解析結果を表示する
 * @param parsed 解析結果
 */
export function displayParsedResponse(parsed: any): void {
  console.log("\n===== 解析結果 =====");
  console.log(JSON.stringify(parsed, null, 2));
}
