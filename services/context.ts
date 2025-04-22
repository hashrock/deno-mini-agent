/**
 * 共有コンテキストを管理するクラス
 * タスク間でデータを共有するために使用される
 */
export class ContextManager {
  private context: Record<string, any> = {};

  /**
   * コンテキストに値を追加する
   * @param key キー
   * @param value 値
   */
  addToContext(key: string, value: any): void {
    this.context[key] = value;
    console.log("\n===== 共有コンテキスト更新 =====");
    console.log(JSON.stringify(this.context, null, 2));
  }

  /**
   * コンテキスト全体を取得する
   * @returns 現在のコンテキスト
   */
  getContext(): Record<string, any> {
    return { ...this.context };
  }

  /**
   * プロンプト用にフォーマットされたコンテキストを取得する
   * @returns フォーマットされたコンテキスト文字列
   */
  getContextForPrompt(): string {
    if (Object.keys(this.context).length === 0) {
      return "";
    }

    return (
      "\n\n以下は前のタスクの結果です：\n" +
      JSON.stringify(this.context, null, 2)
    );
  }

  /**
   * コンテキストが空かどうかを確認する
   * @returns コンテキストが空の場合はtrue
   */
  isEmpty(): boolean {
    return Object.keys(this.context).length === 0;
  }

  /**
   * 最終的なコンテキストを表示する
   */
  displayFinalContext(): void {
    console.log("\n===== すべてのタスク処理完了 =====");
    console.log("最終的な共有コンテキスト:");
    console.log(JSON.stringify(this.context, null, 2));
  }
}
