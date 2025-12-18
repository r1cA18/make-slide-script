import { useState, useEffect, useCallback } from "react";
import type { StructuredContent, Slide } from "./types";

export function useToolOutput(): StructuredContent | null {
  const [data, setData] = useState<StructuredContent | null>(null);

  useEffect(() => {
    if (window.openai?.toolOutput) {
      const content = window.openai.toolOutput.find((o) => o.structuredContent);
      if (content?.structuredContent) {
        setData(content.structuredContent);
      }
    }

    // Poll for updates (toolOutput might be updated)
    const interval = setInterval(() => {
      if (window.openai?.toolOutput) {
        const content = window.openai.toolOutput.find((o) => o.structuredContent);
        if (content?.structuredContent) {
          setData(content.structuredContent);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return data;
}

interface WidgetState {
  selectedSlideId: string | null;
  settingsDraft: Record<string, unknown>;
  filter: string;
}

const defaultWidgetState: WidgetState = {
  selectedSlideId: null,
  settingsDraft: {},
  filter: "",
};

export function useWidgetState() {
  const [state, setState] = useState<WidgetState>(() => {
    const saved = window.openai?.getWidgetState?.();
    return (saved as WidgetState) || defaultWidgetState;
  });

  const updateState = useCallback((updates: Partial<WidgetState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      window.openai?.setWidgetState?.(next);
      return next;
    });
  }, []);

  return [state, updateState] as const;
}

export function useCallTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    if (!window.openai?.callTool) {
      setError("OpenAI bridge not available");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.openai.callTool(name, args);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { callTool, loading, error };
}

export function useUpdateSlide(projectId: string | undefined) {
  const { callTool, loading, error } = useCallTool();

  const updateSlide = useCallback(
    async (slideId: string, patch: Partial<Pick<Slide, "timing" | "script" | "flags">>) => {
      if (!projectId) return null;
      return callTool("update_slide", { projectId, slideId, patch });
    },
    [callTool, projectId]
  );

  return { updateSlide, loading, error };
}

export function useRebalanceTiming(projectId: string | undefined) {
  const { callTool, loading, error } = useCallTool();

  const rebalance = useCallback(
    async (totalSeconds?: number) => {
      if (!projectId) return null;
      return callTool("rebalance_timing", { projectId, totalSeconds });
    },
    [callTool, projectId]
  );

  return { rebalance, loading, error };
}

export function useExportScript(projectId: string | undefined) {
  const { callTool, loading, error } = useCallTool();

  const exportScript = useCallback(
    async (format: "markdown" | "text" = "markdown") => {
      if (!projectId) return null;
      return callTool("export_script", { projectId, format });
    },
    [callTool, projectId]
  );

  return { exportScript, loading, error };
}
