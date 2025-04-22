import { assertEquals } from "@std/assert";
import { parseXML, xmlNode, xmlDocument } from "./parser.ts";

// デバッグ用のテスト：複数のタグを含むXMLのパース
Deno.test("debug - 複数のタグのパース", () => {
  const input = `
    <task tool="weatherTool">
      <prompt>来週の東京の天気予報を取得してください。</prompt>
    </task>
    <task tool="tripAdvisorTool">
      <prompt>東京でおすすめの博物館を提案してください。</prompt>
    </task>
  `;

  // 入力文字列を表示
  console.log("入力文字列:", JSON.stringify(input));

  // xmlDocumentパーサーを直接使用
  const docResult = xmlDocument(input);
  console.log(
    "xmlDocument結果:",
    docResult ? JSON.stringify(docResult.result) : "null"
  );
  console.log(
    "残りの文字列:",
    docResult ? JSON.stringify(docResult.rest) : "null"
  );

  // 最初のノードをパース
  const firstNodeResult = xmlNode(input);
  console.log(
    "最初のノード結果:",
    firstNodeResult ? JSON.stringify(firstNodeResult.result) : "null"
  );
  console.log(
    "残りの文字列:",
    firstNodeResult ? JSON.stringify(firstNodeResult.rest) : "null"
  );

  // 残りの文字列から次のノードをパース
  if (firstNodeResult) {
    const secondNodeResult = xmlNode(firstNodeResult.rest);
    console.log(
      "2番目のノード結果:",
      secondNodeResult ? JSON.stringify(secondNodeResult.result) : "null"
    );
    console.log(
      "残りの文字列:",
      secondNodeResult ? JSON.stringify(secondNodeResult.rest) : "null"
    );
  }

  // parseXML関数を使用
  const result = parseXML(input);
  console.log("parseXML結果:", JSON.stringify(result));

  // 期待される結果
  const expected = [
    {
      tagName: "task",
      attributes: {
        tool: "weatherTool",
      },
      children: [
        {
          tagName: "prompt",
          attributes: {},
          children: [],
        },
      ],
    },
    {
      tagName: "task",
      attributes: {
        tool: "tripAdvisorTool",
      },
      children: [
        {
          tagName: "prompt",
          attributes: {},
          children: [],
        },
      ],
    },
  ];

  // 結果を検証
  assertEquals(result, expected);
});
