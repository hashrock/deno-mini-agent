import { assertEquals } from "@std/assert";
import { parseXML, XMLNode } from "./parser.ts";

// 単純なタグのパース
Deno.test("parseXML - 単純なタグ", () => {
  const input = "<tag></tag>";
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "tag",
      attributes: {},
      children: [],
    },
  ]);
});

// 属性を持つタグのパース
Deno.test("parseXML - 属性を持つタグ", () => {
  const input = '<tag attr1="value1" attr2="value2"></tag>';
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "tag",
      attributes: {
        attr1: "value1",
        attr2: "value2",
      },
      children: [],
    },
  ]);
});

// ネストされたタグのパース
Deno.test("parseXML - ネストされたタグ", () => {
  const input = '<parent><child attr="value"></child></parent>';
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "parent",
      attributes: {},
      children: [
        {
          tagName: "child",
          attributes: {
            attr: "value",
          },
          children: [],
        },
      ],
    },
  ]);
});

// 自己閉じタグのパース
Deno.test("parseXML - 自己閉じタグ", () => {
  const input = '<tag attr="value"/>';
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "tag",
      attributes: {
        attr: "value",
      },
      children: [],
    },
  ]);
});

// 複数のタグを含むドキュメントのパース
Deno.test("parseXML - 複数のタグ", () => {
  const input = '<tag1></tag1><tag2 attr="value"></tag2>';
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "tag1",
      attributes: {},
      children: [],
    },
    {
      tagName: "tag2",
      attributes: {
        attr: "value",
      },
      children: [],
    },
  ]);
});

// 複雑なネストと属性を持つXMLのパース
Deno.test("parseXML - 複雑なXML", () => {
  const input = `
    <root>
      <element id="1" class="container">
        <child name="first"/>
        <child name="second">
          <grandchild data="test"/>
        </child>
      </element>
      <element id="2"/>
    </root>
  `;
  const result = parseXML(input);

  assertEquals(result, [
    {
      tagName: "root",
      attributes: {},
      children: [
        {
          tagName: "element",
          attributes: {
            id: "1",
            class: "container",
          },
          children: [
            {
              tagName: "child",
              attributes: {
                name: "first",
              },
              children: [],
            },
            {
              tagName: "child",
              attributes: {
                name: "second",
              },
              children: [
                {
                  tagName: "grandchild",
                  attributes: {
                    data: "test",
                  },
                  children: [],
                },
              ],
            },
          ],
        },
        {
          tagName: "element",
          attributes: {
            id: "2",
          },
          children: [],
        },
      ],
    },
  ]);
});

// 実際のユースケース：taskタグのパース
Deno.test("parseXML - taskタグのパース", () => {
  const input = `
    <task tool="weatherTool">
      <prompt>来週の東京の天気予報を取得してください。</prompt>
    </task>
  `;
  const result = parseXML(input);

  assertEquals(result, [
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
  ]);
});

// 実際のユースケース：複数のtaskタグのパース
Deno.test("parseXML - 複数のtaskタグのパース", () => {
  const input = `
    <task tool="weatherTool">
      <prompt>来週の東京の天気予報を取得してください。</prompt>
    </task>
    <task tool="tripAdvisorTool">
      <prompt>東京でおすすめの博物館を提案してください。</prompt>
    </task>
  `;
  const result = parseXML(input);

  assertEquals(result, [
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
  ]);
});
