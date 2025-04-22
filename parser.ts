// XMLパーサーコンビネータの実装

// パーサーの型定義
export type Parser<T> = (input: string) => { result: T; rest: string } | null;

// 基本的なパーサーコンビネータ関数

// 文字列をパースする
export function str(match: string): Parser<string> {
  return (input: string) => {
    if (input.startsWith(match)) {
      return {
        result: match,
        rest: input.slice(match.length),
      };
    }
    return null;
  };
}

// 正規表現にマッチする文字列をパースする
export function regex(pattern: RegExp): Parser<string> {
  return (input: string) => {
    const match = input.match(pattern);
    if (match && match.index === 0) {
      return {
        result: match[0],
        rest: input.slice(match[0].length),
      };
    }
    return null;
  };
}

// パーサーの結果を変換する
export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (input: string) => {
    const result = parser(input);
    if (result) {
      return {
        result: fn(result.result),
        rest: result.rest,
      };
    }
    return null;
  };
}

// 複数のパーサーを順番に適用する
export function sequence<T>(parsers: Parser<T>[]): Parser<T[]> {
  return (input: string) => {
    let rest = input;
    const results: T[] = [];

    for (const parser of parsers) {
      const result = parser(rest);
      if (!result) return null;
      results.push(result.result);
      rest = result.rest;
    }

    return {
      result: results,
      rest,
    };
  };
}

// いずれかのパーサーを適用する
export function choice<T>(parsers: Parser<T>[]): Parser<T> {
  return (input: string) => {
    for (const parser of parsers) {
      const result = parser(input);
      if (result) return result;
    }
    return null;
  };
}

// 0回以上の繰り返し
export function many<T>(parser: Parser<T>): Parser<T[]> {
  return (input: string) => {
    let rest = input;
    const results: T[] = [];

    while (true) {
      const result = parser(rest);
      if (!result) break;
      results.push(result.result);
      rest = result.rest;
    }

    return {
      result: results,
      rest,
    };
  };
}

// 空白文字をスキップする
export const whitespace = regex(/^\s+/);
export const optionalWhitespace = many(whitespace);

// XMLの基本要素をパースする関数

// タグ名をパースする
export const tagName = regex(/^[a-zA-Z][a-zA-Z0-9_-]*/);

// 属性値をパースする
export const attributeValue = choice([
  map(sequence([str('"'), regex(/^[^"]*/), str('"')]), ([_, value]) => value),
  map(sequence([str("'"), regex(/^[^']*/), str("'")]), ([_, value]) => value),
]);

// 属性をパースする
export const attribute: Parser<[string, string]> = (input: string) => {
  // 属性名
  const nameResult = tagName(input);
  if (!nameResult) return null;

  let rest = nameResult.rest;

  // =
  const equalsResult = str("=")(rest);
  if (!equalsResult) return null;
  rest = equalsResult.rest;

  // 属性値
  const valueResult = attributeValue(rest);
  if (!valueResult) return null;

  return {
    result: [nameResult.result, valueResult.result],
    rest: valueResult.rest,
  };
};

// 複数の属性をパースする
export const attributes: Parser<Record<string, string>> = (input: string) => {
  const result: Record<string, string> = {};
  let rest = input;

  while (true) {
    // 空白をスキップ
    const wsResult = whitespace(rest);
    if (!wsResult) break;
    rest = wsResult.rest;

    // 属性をパース
    const attrResult = attribute(rest);
    if (!attrResult) break;

    const [name, value] = attrResult.result;
    result[name] = value;
    rest = attrResult.rest;
  }

  return {
    result,
    rest,
  };
};

// 開始タグをパースする
export const openTag: Parser<{
  tagName: string;
  attributes: Record<string, string>;
}> = (input: string) => {
  // <
  const ltResult = str("<")(input);
  if (!ltResult) return null;

  // タグ名
  const nameResult = tagName(ltResult.rest);
  if (!nameResult) return null;

  // 属性
  const attrsResult = attributes(nameResult.rest);
  if (!attrsResult) {
    // 属性がない場合
    const gtResult = str(">")(nameResult.rest);
    if (!gtResult) return null;

    return {
      result: {
        tagName: nameResult.result,
        attributes: {},
      },
      rest: gtResult.rest,
    };
  }

  // 空白をスキップ
  let rest = attrsResult.rest;
  const wsResult = optionalWhitespace(rest);
  if (wsResult) rest = wsResult.rest;

  // >
  const gtResult = str(">")(rest);
  if (!gtResult) return null;

  return {
    result: {
      tagName: nameResult.result,
      attributes: attrsResult.result,
    },
    rest: gtResult.rest,
  };
};

// 閉じタグをパースする
export const closeTag: Parser<string> = (input: string) => {
  // </
  const ltResult = str("</")(input);
  if (!ltResult) return null;

  // タグ名
  const nameResult = tagName(ltResult.rest);
  if (!nameResult) return null;

  // 空白をスキップ
  let rest = nameResult.rest;
  const wsResult = optionalWhitespace(rest);
  if (wsResult) rest = wsResult.rest;

  // >
  const gtResult = str(">")(rest);
  if (!gtResult) return null;

  return {
    result: nameResult.result,
    rest: gtResult.rest,
  };
};

// 自己閉じタグをパースする
export const selfClosingTag: Parser<{
  tagName: string;
  attributes: Record<string, string>;
}> = (input: string) => {
  // <
  const ltResult = str("<")(input);
  if (!ltResult) return null;

  // タグ名
  const nameResult = tagName(ltResult.rest);
  if (!nameResult) return null;

  // 属性
  const attrsResult = attributes(nameResult.rest);

  // 空白をスキップ
  let rest = attrsResult ? attrsResult.rest : nameResult.rest;
  const wsResult = optionalWhitespace(rest);
  if (wsResult) rest = wsResult.rest;

  // />
  const gtResult = str("/>")(rest);
  if (!gtResult) return null;

  return {
    result: {
      tagName: nameResult.result,
      attributes: attrsResult ? attrsResult.result : {},
    },
    rest: gtResult.rest,
  };
};

// XMLノードの型定義
export interface XMLNode {
  tagName: string;
  attributes: Record<string, string>;
  children: XMLNode[];
}

// テキストをスキップする（テキストノードは不要なため）
export const skipText: Parser<null> = (input: string) => {
  // < が出現するまでスキップ
  const index = input.indexOf("<");
  if (index === -1) {
    // 残りの文字列すべてをスキップ
    return {
      result: null,
      rest: "",
    };
  } else if (index === 0) {
    // 先頭が < の場合はスキップしない
    return {
      result: null,
      rest: input,
    };
  } else {
    // < までスキップ
    return {
      result: null,
      rest: input.slice(index),
    };
  }
};

// XMLノードをパースする
export const xmlNode: Parser<XMLNode> = (input: string) => {
  // 先頭の空白をスキップ
  let currentInput = input;
  const wsResult = optionalWhitespace(currentInput);
  if (wsResult) currentInput = wsResult.rest;

  // 自己閉じタグ
  const selfClosingResult = selfClosingTag(currentInput);
  if (selfClosingResult) {
    return {
      result: {
        tagName: selfClosingResult.result.tagName,
        attributes: selfClosingResult.result.attributes,
        children: [],
      },
      rest: selfClosingResult.rest,
    };
  }

  // 開始タグ
  const openResult = openTag(currentInput);
  if (!openResult) return null;

  const tagName = openResult.result.tagName;
  const attributes = openResult.result.attributes;
  let rest = openResult.rest;

  // テキストをスキップ（テキストノードは不要なため）
  const skipResult = skipText(rest);
  if (skipResult) rest = skipResult.rest;

  // 子ノード
  const children: XMLNode[] = [];
  while (true) {
    // 空白をスキップ
    const wsResult = optionalWhitespace(rest);
    if (wsResult) rest = wsResult.rest;

    // 閉じタグをチェック
    const closeResult = closeTag(rest);
    if (closeResult && closeResult.result === tagName) {
      rest = closeResult.rest;
      break;
    }

    // 子ノードをパース
    const childResult = xmlNode(rest);
    if (!childResult) {
      // 子ノードがパースできない場合は、テキストをスキップして次へ
      const skipResult = skipText(rest);
      if (!skipResult || skipResult.rest === rest) break;
      rest = skipResult.rest;
      continue;
    }

    children.push(childResult.result);
    rest = childResult.rest;
  }

  return {
    result: {
      tagName,
      attributes,
      children,
    },
    rest,
  };
};

// XMLドキュメントをパースする
export const xmlDocument: Parser<XMLNode[]> = (input: string) => {
  const nodes: XMLNode[] = [];
  let rest = input;

  while (rest.length > 0) {
    // 空白をスキップ
    const wsResult = optionalWhitespace(rest);
    if (wsResult) rest = wsResult.rest;

    if (rest.length === 0) break;

    // XMLノードをパース
    const nodeResult = xmlNode(rest);
    if (!nodeResult) break;

    nodes.push(nodeResult.result);
    rest = nodeResult.rest;
  }

  return {
    result: nodes,
    rest,
  };
};

// XMLをパースする関数
export function parseXML(input: string): XMLNode[] {
  const result = xmlDocument(input);
  return result ? result.result : [];
}

// 既存のparseResponse関数を残しておく（互換性のため）
export function parseResponse(response: string): {
  thinking?: string;
  answer?: string;
  task?: string;
  tasks?: Array<{ tool: string; prompt: string }>;
} {
  const result: {
    thinking?: string;
    answer?: string;
    task?: string;
    tasks?: Array<{ tool: string; prompt: string }>;
  } = {};

  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/);
  if (thinkingMatch) result.thinking = thinkingMatch[1].trim();

  const answerMatch = response.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) result.answer = answerMatch[1].trim();

  const taskMatch = response.match(/<task>([\s\S]*?)<\/task>/);
  if (taskMatch) result.task = taskMatch[1].trim();

  // tasksの抽出（tool属性を持つtaskタグ）
  const taskMatches = [
    ...response.matchAll(/<task tool="(.*?)">([\s\S]*?)<\/task>/g),
  ];
  if (taskMatches.length > 0) {
    result.tasks = taskMatches.map((match) => {
      const tool = match[1];
      const content = match[2];
      const promptMatch = content.match(/<prompt>([\s\S]*?)<\/prompt>/);
      const prompt = promptMatch ? promptMatch[1].trim() : "";
      return { tool, prompt };
    });
  }

  return result;
}
