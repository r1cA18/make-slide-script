import type { FileParam, Slide, StructuredContent, ProjectSettings } from "../types.js";
import { createProject, setSlides, generateId } from "../store.js";

interface IngestInput {
  title?: string;
  settings?: Partial<ProjectSettings>;
  deck_file: FileParam;
}

export async function ingestDeck(input: IngestInput): Promise<StructuredContent> {
  const { title = "Untitled Presentation", settings = {}, deck_file } = input;

  // Fetch the file from download_url
  const response = await fetch(deck_file.download_url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  let rawSlides: { text: string; titleGuess: string }[];

  if (contentType.includes("pdf") || deck_file.download_url.toLowerCase().includes(".pdf")) {
    rawSlides = await parsePdf(buffer);
  } else if (
    contentType.includes("presentation") ||
    contentType.includes("powerpoint") ||
    deck_file.download_url.toLowerCase().includes(".pptx")
  ) {
    rawSlides = await parsePptx(buffer);
  } else {
    // Try to detect from content
    rawSlides = await parseGeneric(buffer);
  }

  // Create project
  const content = createProject(title, settings);

  // Set file source info
  content.project.source = {
    fileId: deck_file.file_id,
    fileName: extractFileName(deck_file.download_url),
    mimeType: contentType,
  };

  // Create slides
  const slides: Slide[] = rawSlides.map((raw, index) => ({
    slideId: generateId(),
    index,
    titleGuess: raw.titleGuess || `スライド ${index + 1}`,
    raw: { text: raw.text },
    timing: {
      seconds: 30, // Default 30 seconds per slide
      locked: false,
      minSeconds: 10,
      maxSeconds: 120,
    },
    script: {
      goal: "",
      talkTrack: "",
      keyPoints: [],
    },
    flags: [],
  }));

  setSlides(content.project.projectId, slides);

  return content;
}

async function parsePdf(buffer: Uint8Array): Promise<{ text: string; titleGuess: string }[]> {
  // In Cloudflare Workers, we can't use pdf-parse directly due to Node.js dependencies
  // For MVP, we'll do a simple text extraction approach
  // In production, consider using a PDF parsing service or Cloudflare's document AI

  const text = extractTextFromBuffer(buffer);

  // Split by page markers or double newlines as rough page boundaries
  const pages = text.split(/\f|\n{3,}/).filter((p) => p.trim().length > 0);

  if (pages.length === 0) {
    // If we couldn't parse, return a single slide placeholder
    return [
      {
        text: "PDFの解析に失敗しました。テキストを手動で入力してください。",
        titleGuess: "スライド 1",
      },
    ];
  }

  return pages.map((pageText, i) => {
    const lines = pageText.trim().split("\n").filter(Boolean);
    const titleGuess = lines[0]?.substring(0, 50) || `スライド ${i + 1}`;
    return {
      text: pageText.trim(),
      titleGuess,
    };
  });
}

async function parsePptx(buffer: Uint8Array): Promise<{ text: string; titleGuess: string }[]> {
  // PPTX is a ZIP file containing XML
  // For Workers environment, we'll need to use a simple approach
  // or call an external service

  const text = extractTextFromBuffer(buffer);

  // Try to find slide boundaries in PPTX XML structure
  const slideTexts = text.split(/<\/p:sld>|<\/slide>/i).filter((s) => s.trim().length > 20);

  if (slideTexts.length === 0) {
    return [
      {
        text: "PPTXの解析に失敗しました。テキストを手動で入力してください。",
        titleGuess: "スライド 1",
      },
    ];
  }

  return slideTexts.map((slideText, i) => {
    // Extract text content from XML-like structure
    const cleanText = slideText
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const lines = cleanText.split(/[。.!！?？]/).filter(Boolean);
    const titleGuess = lines[0]?.substring(0, 50) || `スライド ${i + 1}`;
    return {
      text: cleanText,
      titleGuess,
    };
  });
}

async function parseGeneric(buffer: Uint8Array): Promise<{ text: string; titleGuess: string }[]> {
  const text = extractTextFromBuffer(buffer);
  const pages = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  if (pages.length === 0) {
    return [{ text: "", titleGuess: "スライド 1" }];
  }

  return pages.map((pageText, i) => {
    const lines = pageText.trim().split("\n").filter(Boolean);
    return {
      text: pageText.trim(),
      titleGuess: lines[0]?.substring(0, 50) || `スライド ${i + 1}`,
    };
  });
}

function extractTextFromBuffer(buffer: Uint8Array): string {
  // Simple UTF-8 text extraction
  // This won't work well for binary formats but provides fallback
  try {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    return decoder.decode(buffer);
  } catch {
    return "";
  }
}

function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split("/").pop() || "unknown";
  } catch {
    return "unknown";
  }
}
