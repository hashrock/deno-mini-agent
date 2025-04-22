import { assertEquals } from "@std/assert";
import { parseResponse } from "./parser.ts";

// 既存のテスト

// tool属性を持つtaskタグのテスト
Deno.test("parseResponse - tool属性を持つtaskタグ", () => {
  const input = `<task tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>
</task>`;

  const result = parseResponse(input);

  assertEquals(result.tasks, [
    {
      tool: "weatherTool",
      prompt: "来週の東京の天気予報を取得してください。",
    },
  ]);
});

Deno.test("parseResponse - 複数のtool属性を持つtaskタグ", () => {
  const input = `
<task tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>
</task>
<task tool="tripAdvisorTool">
<prompt>東京でおすすめの博物館を提案してください。</prompt>
</task>
  `;

  const result = parseResponse(input);

  assertEquals(result.tasks, [
    {
      tool: "weatherTool",
      prompt: "来週の東京の天気予報を取得してください。",
    },
    {
      tool: "tripAdvisorTool",
      prompt: "東京でおすすめの博物館を提案してください。",
    },
  ]);
});

Deno.test(
  "parseResponse - 属性のないtaskタグと属性のあるtaskタグの混在",
  () => {
    const input = `
<task>これは属性のないタスクです</task>
<task tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>
</task>
  `;

    const result = parseResponse(input);

    assertEquals(result.task, "これは属性のないタスクです");
    assertEquals(result.tasks, [
      {
        tool: "weatherTool",
        prompt: "来週の東京の天気予報を取得してください。",
      },
    ]);
  }
);

Deno.test("parseResponse - すべての要素を含む複合ケース", () => {
  const input = `
<thinking>
ユーザーは旅行計画を立てたいと考えています。
</thinking>
<answer>旅行計画を立てるお手伝いをします。</answer>
<task>一般的なタスク</task>
<task tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>
</task>
<task tool="tripAdvisorTool">
<prompt>東京でおすすめの博物館を提案してください。</prompt>
</task>
  `;

  const result = parseResponse(input);

  assertEquals(result.thinking, "ユーザーは旅行計画を立てたいと考えています。");
  assertEquals(result.answer, "旅行計画を立てるお手伝いをします。");
  assertEquals(result.task, "一般的なタスク");
  assertEquals(result.tasks, [
    {
      tool: "weatherTool",
      prompt: "来週の東京の天気予報を取得してください。",
    },
    {
      tool: "tripAdvisorTool",
      prompt: "東京でおすすめの博物館を提案してください。",
    },
  ]);
});

Deno.test("parseResponse - thinking タグのみ", () => {
  const input = `<thinking>これは思考プロセスです</thinking>`;
  const result = parseResponse(input);

  assertEquals(result, {
    thinking: "これは思考プロセスです",
  });
});

Deno.test("parseResponse - answer タグのみ", () => {
  const input = `<answer>これは回答です</answer>`;
  const result = parseResponse(input);

  assertEquals(result, {
    answer: "これは回答です",
  });
});

Deno.test("parseResponse - task タグのみ", () => {
  const input = `<task>これはタスクです</task>`;
  const result = parseResponse(input);

  assertEquals(result, {
    task: "これはタスクです",
  });
});

Deno.test("parseResponse - 複数のタグ", () => {
  const input = `
<thinking>
ユーザーは来週東京での旅行の計画を立てたいと考えています。特に博物館を巡ることに興味があり、天気の良い日を選びたいという要望があります。
</thinking>
<task>
tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>
</task>
  `;

  const result = parseResponse(input);

  // プロパティごとに個別に検証
  assertEquals(
    result.thinking,
    "ユーザーは来週東京での旅行の計画を立てたいと考えています。特に博物館を巡ることに興味があり、天気の良い日を選びたいという要望があります。"
  );
  assertEquals(
    result.task,
    `tool="weatherTool">
<prompt>来週の東京の天気予報を取得してください。</prompt>`
  );
});

Deno.test("parseResponse - すべてのタグ", () => {
  const input = `
<thinking>これは思考プロセスです</thinking>
<answer>これは回答です</answer>
<task>これはタスクです</task>
  `;

  const result = parseResponse(input);

  assertEquals(result, {
    thinking: "これは思考プロセスです",
    answer: "これは回答です",
    task: "これはタスクです",
  });
});

Deno.test("parseResponse - タグなし", () => {
  const input = `これはタグのないテキストです`;
  const result = parseResponse(input);

  assertEquals(result, {});
});

Deno.test("parseResponse - 複数行のコンテンツ", () => {
  const input = `
<thinking>
これは
複数行の
思考プロセスです
</thinking>
  `;

  const result = parseResponse(input);

  assertEquals(result, {
    thinking: "これは\n複数行の\n思考プロセスです",
  });
});

Deno.test("parseResponse - 不完全なタグ", () => {
  const input = `
<thinking>これは思考プロセスです
<answer>これは回答です</answer>
  `;

  const result = parseResponse(input);

  assertEquals(result, {
    answer: "これは回答です",
  });
});
