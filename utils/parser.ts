// <thinking>
// ユーザーは来週東京での旅行の計画を立てたいと考えています。特に博物館を巡ることに興味があり、天気の良い日を選びたいという要望があります。まずは天候を確認し、その後に具体的な旅行計画を立てる必要があります。
// </thinking>
// <task tool="weatherTool">
// <prompt>来週の東京の天気予報を取得してください。</prompt>
// </task>
// <task tool="tripAdvisorTool">
// <prompt>東京でおすすめの博物館を1週間分の旅行計画として提案してください。</prompt>
// </task>

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
