import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

// Maximum image payload: 12MB base64
const MAX_BASE64_LENGTH = 16 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType: userMimeType, prompt, context = "general" } = body || {};

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing image payload. Expected base64 image data." },
        { status: 400 }
      );
    }

    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Image size exceeds 12MB limit." },
        { status: 413 }
      );
    }

    // Parse Data URI prefix if provided: data:image/png;base64,...
    let cleanBase64 = image;
    let mimeType = userMimeType || "image/png";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      } else {
        const commaIdx = image.indexOf(",");
        if (commaIdx !== -1) {
          cleanBase64 = image.substring(commaIdx + 1);
        }
      }
    }

    // 1. Primary Engine: Google Gemini 2.5 Flash Vision OCR
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        const systemInstruction = `You are the high-precision Optical Character Recognition (OCR) and visual document transcription engine for EdWorld Co.
Your job is to read text from student camera captures, mobile camera photos, screenshots, code editor captures, textbook problems, and resumes.

TRANSCRIPTION DIRECTIVES:
1. Verbatim Text & Code: Transcribe all text, code snippets, syntax characters, and variable names exactly as visible. Preserve indentation for programming languages.
2. Math & Formulas: Preserve mathematical formulas, superscripts, subscripts, and equations.
3. Multiple-Choice / Questions: If this is an exam question or test screen, extract the prompt and all options (A, B, C, D) clearly.
4. Resumes: If this is a resume document, preserve structural sections (Contact, Education, Experience, Skills, Projects).
5. Output: Return ONLY the extracted text and structure. Do not hallucinate content not present in the image. Do not include meta-commentary like "Here is the extracted text:".`;

        const response = await ai.models.generateContent({
          model: geminiModel,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt || "Extract all readable text, questions, code, and symbols from this image verbatim.",
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            temperature: 0.1,
            maxOutputTokens: 3000,
          },
        });

        const extractedText = response?.text?.trim() || "";
        if (extractedText.length > 0) {
          const lines = extractedText.split("\n");
          return NextResponse.json({
            success: true,
            text: extractedText,
            model: `Gemini Vision (${geminiModel})`,
            linesCount: lines.length,
            confidence: 0.98,
          });
        }
      } catch (geminiErr: any) {
        console.warn("[Gemini Vision OCR Fallback Triggered]:", geminiErr?.message || geminiErr);
      }
    }

    // 2. Secondary Fallback: OpenAI GPT-4o-mini Vision OCR
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey.trim().length > 0) {
      try {
        const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey.trim()}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            temperature: 0.1,
            max_tokens: 3000,
            messages: [
              {
                role: "system",
                content:
                  "You are a verbatim OCR engine. Extract all readable text, code, questions, or resume data from the provided image without conversational commentary.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt || "Extract all readable text, questions, code, and symbols from this image verbatim.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${cleanBase64}`,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const extractedText = data.choices?.[0]?.message?.content?.trim() || "";
          if (extractedText) {
            return NextResponse.json({
              success: true,
              text: extractedText,
              model: `OpenAI Vision (${openaiModel})`,
              linesCount: extractedText.split("\n").length,
              confidence: 0.95,
            });
          }
        }
      } catch (openAiErr: any) {
        console.warn("[OpenAI Vision OCR Fallback Triggered]:", openAiErr?.message || openAiErr);
      }
    }

    // 3. Fallback when vision providers are unavailable or fail to extract text
    return NextResponse.json({
      success: false,
      error: "Unable to read text from the provided image clearly. Please retake the photo with better lighting or focus, or paste the question text directly into the chat.",
      model: "EdWorld Neural OCR Engine (Standby)",
      retryable: true,
      text: "",
      linesCount: 0,
      confidence: 0.0,
    }, { status: 422 });
  } catch (err: any) {
    console.error("OCR API Fatal Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Image processing encountered a temporary error. Please try uploading the image again or paste the text directly.",
        retryable: true
      },
      { status: 500 }
    );
  }
}
