import { weatherTool } from "./weather.ts";
import { tripAdvisorTool } from "./trip-advisor.ts";
import { canvasTool } from "./canvas.ts";

/**
 * ツールレジストリ
 * すべてのツールをまとめたオブジェクト
 */
export const toolsRegistry: Record<
  string,
  (prompt: string) => Promise<string>
> = {
  weatherTool,
  tripAdvisorTool,
  canvasTool,
};

export { weatherTool, tripAdvisorTool, canvasTool };
