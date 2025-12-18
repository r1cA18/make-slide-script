import type { Project, Slide, StructuredContent, ProjectSettings } from "./types.js";

const projects = new Map<string, StructuredContent>();

export function generateId(): string {
  return crypto.randomUUID();
}

export function createProject(title: string, settings: Partial<ProjectSettings> = {}): StructuredContent {
  const projectId = generateId();
  const defaultSettings: ProjectSettings = {
    totalSeconds: 420,
    qaBufferSeconds: 30,
    audience: "internal",
    tone: "polite",
    style: { brevity: 0, energy: 0, pace: 0 },
    language: "ja",
    ...settings,
  };

  const content: StructuredContent = {
    project: {
      projectId,
      title,
      settings: defaultSettings,
      stats: {
        slideCount: 0,
        allocatedSeconds: 0,
        overBySeconds: 0,
      },
    },
    slides: [],
  };

  projects.set(projectId, content);
  return content;
}

export function getProject(projectId: string): StructuredContent | undefined {
  return projects.get(projectId);
}

export function updateProject(projectId: string, content: StructuredContent): void {
  projects.set(projectId, content);
}

export function deleteProject(projectId: string): boolean {
  return projects.delete(projectId);
}

export function setSlides(projectId: string, slides: Slide[]): StructuredContent | undefined {
  const content = projects.get(projectId);
  if (!content) return undefined;

  content.slides = slides;
  content.project.stats.slideCount = slides.length;
  recalculateStats(content);
  return content;
}

export function updateSlide(
  projectId: string,
  slideId: string,
  patch: Partial<Pick<Slide, "timing" | "script" | "flags">>
): StructuredContent | undefined {
  const content = projects.get(projectId);
  if (!content) return undefined;

  const slide = content.slides.find((s) => s.slideId === slideId);
  if (!slide) return undefined;

  if (patch.timing) {
    slide.timing = { ...slide.timing, ...patch.timing };
  }
  if (patch.script) {
    slide.script = { ...slide.script, ...patch.script };
  }
  if (patch.flags) {
    slide.flags = patch.flags;
  }

  recalculateStats(content);
  return content;
}

export function rebalanceTiming(projectId: string, totalSeconds?: number): StructuredContent | undefined {
  const content = projects.get(projectId);
  if (!content) return undefined;

  const targetTotal = totalSeconds ?? content.project.settings.totalSeconds;
  const availableSeconds = targetTotal - content.project.settings.qaBufferSeconds;

  const lockedSlides = content.slides.filter((s) => s.timing.locked);
  const unlockedSlides = content.slides.filter((s) => !s.timing.locked);

  const lockedTotal = lockedSlides.reduce((sum, s) => sum + s.timing.seconds, 0);
  const remainingSeconds = availableSeconds - lockedTotal;

  if (unlockedSlides.length > 0 && remainingSeconds > 0) {
    // Weight by text length
    const totalWeight = unlockedSlides.reduce((sum, s) => sum + Math.max(s.raw.text.length, 100), 0);

    for (const slide of unlockedSlides) {
      const weight = Math.max(slide.raw.text.length, 100) / totalWeight;
      let newSeconds = Math.round(remainingSeconds * weight);

      // Clamp to min/max
      newSeconds = Math.max(slide.timing.minSeconds, Math.min(slide.timing.maxSeconds, newSeconds));
      slide.timing.seconds = newSeconds;
    }
  }

  if (totalSeconds) {
    content.project.settings.totalSeconds = totalSeconds;
  }

  recalculateStats(content);
  return content;
}

function recalculateStats(content: StructuredContent): void {
  const allocatedSeconds = content.slides.reduce((sum, s) => sum + s.timing.seconds, 0);
  const availableSeconds = content.project.settings.totalSeconds - content.project.settings.qaBufferSeconds;

  content.project.stats.allocatedSeconds = allocatedSeconds;
  content.project.stats.overBySeconds = Math.max(0, allocatedSeconds - availableSeconds);

  // Update flags
  for (const slide of content.slides) {
    const flags: typeof slide.flags = [];
    if (slide.timing.seconds < slide.timing.minSeconds) {
      flags.push("too_short");
    }
    if (slide.timing.seconds > slide.timing.maxSeconds) {
      flags.push("too_long");
    }
    if (slide.raw.text.length > 500) {
      flags.push("dense");
    }
    slide.flags = flags;
  }
}

export function exportAsMarkdown(projectId: string): string | undefined {
  const content = projects.get(projectId);
  if (!content) return undefined;

  const lines: string[] = [
    `# ${content.project.title}`,
    "",
    `総時間: ${Math.floor(content.project.settings.totalSeconds / 60)}分${content.project.settings.totalSeconds % 60}秒`,
    `スライド数: ${content.project.stats.slideCount}`,
    "",
    "---",
    "",
  ];

  for (const slide of content.slides) {
    lines.push(`## スライド ${slide.index + 1}: ${slide.titleGuess}`);
    lines.push("");
    lines.push(`**目標**: ${slide.script.goal}`);
    lines.push("");
    lines.push(`**時間**: ${slide.timing.seconds}秒${slide.timing.locked ? " (固定)" : ""}`);
    lines.push("");
    lines.push("### 台本");
    lines.push("");
    lines.push(slide.script.talkTrack);
    lines.push("");
    if (slide.script.keyPoints.length > 0) {
      lines.push("### ポイント");
      lines.push("");
      for (const point of slide.script.keyPoints) {
        lines.push(`- ${point}`);
      }
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
