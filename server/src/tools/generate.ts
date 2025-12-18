import type { StructuredContent, Slide, ProjectSettings } from "../types.js";
import { getProject, updateProject, rebalanceTiming } from "../store.js";

interface GenerateInput {
  projectId: string;
  settings?: Partial<ProjectSettings>;
}

export async function generateScript(input: GenerateInput): Promise<StructuredContent> {
  const { projectId, settings } = input;

  const content = getProject(projectId);
  if (!content) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Update settings if provided
  if (settings) {
    content.project.settings = { ...content.project.settings, ...settings };
  }

  // Generate initial scripts based on raw text
  // The actual script generation is done by ChatGPT model
  // Here we just prepare the structure and estimate timing
  for (const slide of content.slides) {
    // Estimate timing based on text length
    // Roughly 150 characters per 30 seconds for Japanese
    const charCount = slide.raw.text.length;
    const estimatedSeconds = Math.max(15, Math.min(120, Math.round((charCount / 150) * 30)));

    slide.timing.seconds = estimatedSeconds;

    // Set min/max based on content density
    slide.timing.minSeconds = Math.max(10, Math.round(estimatedSeconds * 0.5));
    slide.timing.maxSeconds = Math.min(180, Math.round(estimatedSeconds * 2));

    // Generate placeholder script structure
    // The model will fill in the actual content
    slide.script = {
      goal: extractGoal(slide),
      talkTrack: generatePlaceholderTalkTrack(slide, content.project.settings),
      keyPoints: extractKeyPoints(slide),
      transitionIn: slide.index === 0 ? undefined : "では次に、",
      transitionOut: slide.index === content.slides.length - 1 ? undefined : "それでは次のスライドに移りましょう。",
    };

    // Set flags
    slide.flags = [];
    if (charCount > 500) {
      slide.flags.push("dense");
    }
    if (estimatedSeconds < 15) {
      slide.flags.push("too_short");
    }
    if (estimatedSeconds > 90) {
      slide.flags.push("too_long");
    }
  }

  // Rebalance timing to fit total time
  rebalanceTiming(projectId);

  updateProject(projectId, content);

  return content;
}

function extractGoal(slide: Slide): string {
  // Extract a one-line goal from the slide content
  const text = slide.raw.text;
  const firstLine = text.split(/[。\n]/)[0] || "";

  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + "...";
  }

  return firstLine || `${slide.titleGuess}について説明する`;
}

function generatePlaceholderTalkTrack(slide: Slide, settings: ProjectSettings): string {
  // Generate a placeholder talk track based on settings
  const { tone, audience, language } = settings;

  const intro = getIntroPhrase(tone, audience, language);
  const content = slide.raw.text.substring(0, 200);

  return `${intro}\n\n${content}\n\n（ここに詳細な台本が入ります）`;
}

function getIntroPhrase(tone: string, audience: string, language: string): string {
  if (language === "en") {
    switch (tone) {
      case "casual":
        return "So, let me explain this...";
      case "sales":
        return "I'd like to highlight an important point here...";
      case "academic":
        return "This slide demonstrates...";
      default:
        return "Let me walk you through this slide...";
    }
  }

  // Japanese
  switch (tone) {
    case "casual":
      return "では、こちらについて説明しますね。";
    case "sales":
      return "ここで重要なポイントをご紹介させていただきます。";
    case "academic":
      return "このスライドでは以下の点を示します。";
    default:
      return "こちらのスライドについてご説明いたします。";
  }
}

function extractKeyPoints(slide: Slide): string[] {
  const text = slide.raw.text;

  // Try to extract bullet points or numbered items
  const bulletPattern = /[・•\-\*]\s*(.+)/g;
  const numberedPattern = /\d+[.）)]\s*(.+)/g;

  const points: string[] = [];

  let match;
  while ((match = bulletPattern.exec(text)) !== null) {
    if (match[1].trim().length > 0) {
      points.push(match[1].trim());
    }
  }

  while ((match = numberedPattern.exec(text)) !== null) {
    if (match[1].trim().length > 0) {
      points.push(match[1].trim());
    }
  }

  // If no bullet points found, split by sentences and take first few
  if (points.length === 0) {
    const sentences = text.split(/[。.!！?？]/).filter((s) => s.trim().length > 10);
    return sentences.slice(0, 3).map((s) => s.trim());
  }

  return points.slice(0, 5);
}
