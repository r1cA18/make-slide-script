import { Hono } from "hono";
import { cors } from "hono/cors";
import type { StructuredContent, Slide, ProjectSettings, FileParam } from "./types.js";
import { getProject, updateSlide, rebalanceTiming, exportAsMarkdown } from "./store.js";
import { ingestDeck } from "./tools/ingest.js";
import { generateScript } from "./tools/generate.js";
import { WIDGET_TEMPLATE, COMPONENT_CSS, COMPONENT_JS } from "./template.js";

// MCP Tool definitions
const TOOLS = {
  ingest_deck: {
    name: "ingest_deck",
    description: "PDF/PPTXファイルを解析してスライド情報を抽出します",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "プレゼンテーションのタイトル" },
        settings: {
          type: "object",
          properties: {
            totalSeconds: { type: "number", description: "総時間（秒）" },
            qaBufferSeconds: { type: "number", description: "Q&A用バッファ（秒）" },
            audience: { type: "string", enum: ["internal", "customer", "meetup", "conference"] },
            tone: { type: "string", enum: ["casual", "polite", "sales", "academic"] },
            language: { type: "string", enum: ["ja", "en"] },
          },
        },
        deck_file: { type: "object", description: "アップロードされたファイル" },
      },
      required: ["deck_file"],
    },
    _meta: {
      "openai/fileParams": ["deck_file"],
    },
  },
  generate_script: {
    name: "generate_script",
    description: "スライドの台本と時間配分を生成します",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "プロジェクトID" },
        settings: {
          type: "object",
          properties: {
            totalSeconds: { type: "number" },
            qaBufferSeconds: { type: "number" },
            audience: { type: "string", enum: ["internal", "customer", "meetup", "conference"] },
            tone: { type: "string", enum: ["casual", "polite", "sales", "academic"] },
            language: { type: "string", enum: ["ja", "en"] },
          },
        },
      },
      required: ["projectId"],
    },
  },
  update_slide: {
    name: "update_slide",
    description: "スライドの台本や時間を更新します",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        slideId: { type: "string" },
        patch: {
          type: "object",
          properties: {
            timing: {
              type: "object",
              properties: {
                seconds: { type: "number" },
                locked: { type: "boolean" },
              },
            },
            script: {
              type: "object",
              properties: {
                goal: { type: "string" },
                talkTrack: { type: "string" },
                keyPoints: { type: "array", items: { type: "string" } },
                transitionIn: { type: "string" },
                transitionOut: { type: "string" },
              },
            },
          },
        },
      },
      required: ["projectId", "slideId", "patch"],
    },
    _meta: {
      "openai/widgetAccessible": true,
    },
    visibility: "private",
  },
  rebalance_timing: {
    name: "rebalance_timing",
    description: "時間配分を再調整します（ロックされたスライドは維持）",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        totalSeconds: { type: "number", description: "新しい総時間（秒）" },
      },
      required: ["projectId"],
    },
    _meta: {
      "openai/widgetAccessible": true,
    },
    visibility: "private",
  },
  export_script: {
    name: "export_script",
    description: "台本をMarkdown形式でエクスポートします",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        format: { type: "string", enum: ["markdown", "text"], default: "markdown" },
      },
      required: ["projectId"],
    },
    _meta: {
      "openai/widgetAccessible": true,
    },
    visibility: "private",
  },
};

const app = new Hono();

// Enable CORS for ChatGPT
app.use("*", cors());

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "slidescript" }));

// MCP endpoint
app.post("/mcp", async (c) => {
  const body = await c.req.json();
  const { method, params, id } = body;

  try {
    let result;

    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: "slidescript",
            version: "0.1.0",
          },
        };
        break;

      case "tools/list":
        result = {
          tools: Object.values(TOOLS),
        };
        break;

      case "tools/call":
        result = await handleToolCall(params.name, params.arguments || {});
        break;

      case "resources/list":
        result = {
          resources: [
            {
              uri: "slidescript://widget",
              name: "SlideScript Widget",
              mimeType: "text/html+skybridge",
            },
          ],
        };
        break;

      case "resources/read":
        if (params.uri === "slidescript://widget") {
          const html = WIDGET_TEMPLATE
            .replace("{{COMPONENT_CSS}}", COMPONENT_CSS)
            .replace("{{COMPONENT_JS}}", COMPONENT_JS);
          result = {
            contents: [
              {
                uri: params.uri,
                mimeType: "text/html+skybridge",
                text: html,
              },
            ],
          };
        } else {
          throw new Error(`Unknown resource: ${params.uri}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    return c.json({
      jsonrpc: "2.0",
      id,
      result,
    });
  } catch (error) {
    return c.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text?: string; structuredContent?: StructuredContent }> }> {
  switch (name) {
    case "ingest_deck": {
      const content = await ingestDeck({
        title: args.title as string | undefined,
        settings: args.settings as Partial<ProjectSettings> | undefined,
        deck_file: args.deck_file as FileParam,
      });
      return {
        content: [
          {
            type: "text",
            text: `プレゼンテーション「${content.project.title}」を解析しました。${content.slides.length}枚のスライドを検出しました。`,
          },
          {
            type: "structured",
            structuredContent: content,
          },
        ],
      };
    }

    case "generate_script": {
      const content = await generateScript({
        projectId: args.projectId as string,
        settings: args.settings as Partial<ProjectSettings> | undefined,
      });
      return {
        content: [
          {
            type: "text",
            text: `台本を生成しました。総時間: ${content.project.stats.allocatedSeconds}秒 / ${content.project.settings.totalSeconds}秒`,
          },
          {
            type: "structured",
            structuredContent: content,
          },
        ],
      };
    }

    case "update_slide": {
      const content = updateSlide(
        args.projectId as string,
        args.slideId as string,
        args.patch as Partial<Pick<Slide, "timing" | "script" | "flags">>
      );
      if (!content) {
        throw new Error("Project or slide not found");
      }
      return {
        content: [
          {
            type: "text",
            text: "スライドを更新しました。",
          },
          {
            type: "structured",
            structuredContent: content,
          },
        ],
      };
    }

    case "rebalance_timing": {
      const content = rebalanceTiming(args.projectId as string, args.totalSeconds as number | undefined);
      if (!content) {
        throw new Error("Project not found");
      }
      return {
        content: [
          {
            type: "text",
            text: `時間配分を再調整しました。総時間: ${content.project.stats.allocatedSeconds}秒`,
          },
          {
            type: "structured",
            structuredContent: content,
          },
        ],
      };
    }

    case "export_script": {
      const markdown = exportAsMarkdown(args.projectId as string);
      if (!markdown) {
        throw new Error("Project not found");
      }
      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default app;
