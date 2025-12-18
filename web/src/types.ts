export type Audience = "internal" | "customer" | "meetup" | "conference";
export type Tone = "casual" | "polite" | "sales" | "academic";
export type Language = "ja" | "en";

export interface ProjectSettings {
  totalSeconds: number;
  qaBufferSeconds: number;
  audience: Audience;
  tone: Tone;
  style: {
    brevity: number;
    energy: number;
    pace: number;
  };
  language: Language;
}

export interface ProjectStats {
  slideCount: number;
  allocatedSeconds: number;
  overBySeconds: number;
}

export interface Project {
  projectId: string;
  title: string;
  source?: {
    fileId: string;
    fileName?: string;
    mimeType?: string;
  };
  settings: ProjectSettings;
  stats: ProjectStats;
}

export interface SlideTiming {
  seconds: number;
  locked: boolean;
  minSeconds: number;
  maxSeconds: number;
}

export interface SlideScript {
  goal: string;
  talkTrack: string;
  keyPoints: string[];
  transitionIn?: string;
  transitionOut?: string;
}

export type SlideFlag = "too_long" | "too_short" | "dense" | "needs_context";

export interface Slide {
  slideId: string;
  index: number;
  titleGuess: string;
  raw: {
    text: string;
  };
  timing: SlideTiming;
  script: SlideScript;
  flags: SlideFlag[];
}

export interface StructuredContent {
  project: Project;
  slides: Slide[];
}

// OpenAI Apps SDK types
export interface OpenAIBridge {
  toolOutput?: Array<{
    type: string;
    text?: string;
    structuredContent?: StructuredContent;
  }>;
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  setWidgetState: (state: Record<string, unknown>) => void;
  getWidgetState: () => Record<string, unknown> | undefined;
}

declare global {
  interface Window {
    openai?: OpenAIBridge;
  }
}
