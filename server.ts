import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { analyzeContentLocally } from "./src/utils/analyzer.ts";
import { AnalysisResult, InputCategory } from "./src/types.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Primary Fraud Analysis API
app.post("/api/analyze", async (req, res) => {
  const { text = "", category = "message", imageBase64, mimeType } = req.body as {
    text?: string;
    category?: InputCategory;
    imageBase64?: string;
    mimeType?: string;
  };

  const inputCategory = (category || "message") as InputCategory;
  const content = (text || "").trim();

  // Try Gemini AI first if key exists
  const ai = getGemini();
  if (ai && (content.length > 0 || imageBase64)) {
    try {
      const parts: any[] = [];

      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
          },
        });
      }

      const prompt = `You are PURGE, an advanced cyber fraud detection system specializing in identifying scams, phishing, malicious URLs, deceptive QR codes, employment frauds, and investment ponzi schemes.

Input Type: ${inputCategory}
${content ? `Input Text / URL / QR Payload:\n"""${content}"""` : "Please inspect the uploaded screenshot/image for any fraudulent text, spoofed logos, fake payment demands, or deceptive QR codes."}

Analyze the input thoroughly:
1. Determine if this is a SCAM, PHISHING, SUSPICIOUS, or SAFE/LEGITIMATE.
- If it is a legitimate everyday message (e.g. "hey are we meeting tomorrow?", "what's for lunch?"), evaluate it as SAFE (riskScore: 0-15) with category "Normal Personal Communication".
- If it is a legitimate link (e.g. google.com, github.com, wikipedia.org, official bank root domains), evaluate it as SAFE with category "Verified Legitimate Domain".
- If it is a Link with typosquatting, suspicious TLD, or credential harvest path, identify the exact brand spoofed and evaluate as HIGH RISK.
- If it is a UPI QR payload (e.g. upi://pay?...) asking to pay for a "refund" or "prize", identify it as UPI Payment Fraud (Explain: scanning and entering PIN DEBITS money, never receives money).
- If it is a Job scam asking for registration fees or rating tasks, classify as Job Scam / Fake Employment.
- If it is a Trading scam promising guaranteed 200-300% returns or VIP Telegram groups, classify as Investment / Crypto Ponzi Scam.
- If it is an electricity disconnection threat, bank KYC freeze alert, or parcel delivery fee, identify the precise scam category.

Return ONLY a valid JSON object matching this exact schema:
{
  "riskScore": number (0 to 100, where 0-25 is Safe/Low, 26-70 is Medium, 71-100 is High Risk),
  "riskLevel": string (must be exactly "Safe" | "Low Risk" | "Medium Risk" | "High Risk"),
  "category": string (e.g. "Banking Phishing Link", "UPI QR Payment Fraud", "Crypto Investment Scam", "Utility Disconnection Threat", "Verified Legitimate Domain", "Normal Everyday Message"),
  "summary": string (clear 1-2 sentence executive summary of the verdict),
  "keyWarnings": string[] (array of 3-4 specific warning or positive safety bullet points),
  "factors": [
    {
      "title": string (short factor name),
      "percentage": number (impact percentage e.g. 25),
      "description": string (explanation of why this indicator matters),
      "isPositive": boolean (true only if this is a positive safety factor)
    }
  ],
  "recommendedAction": {
    "title": string (action headline e.g. "Do Not Click or Submit Data", "Safe to Browse", "Do Not Pay Fees"),
    "description": string (specific actionable guidance for the user),
    "type": string ("safe" | "warning" | "danger")
  }
}`;

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        const result: AnalysisResult = {
          riskScore: Number(parsed.riskScore) || 50,
          riskLevel: parsed.riskLevel || (parsed.riskScore >= 75 ? "High Risk" : parsed.riskScore >= 35 ? "Medium Risk" : "Safe"),
          category: parsed.category || "Fraud Analysis",
          summary: parsed.summary || "Analysis completed by FraudShield AI engine.",
          keyWarnings: Array.isArray(parsed.keyWarnings) && parsed.keyWarnings.length > 0 ? parsed.keyWarnings : ["Analyzed by AI verification model"],
          factors: Array.isArray(parsed.factors) && parsed.factors.length > 0 ? parsed.factors : [],
          recommendedAction: parsed.recommendedAction || {
            title: "Verify Before Acting",
            description: "Review details carefully before transferring money or sharing credentials.",
            type: "warning",
          },
          rawInput: content,
          inputType: inputCategory,
          meta: {
            detectedUrl: content.startsWith("http") ? content : undefined,
          },
        };

        return res.json({ success: true, result, source: "gemini-ai" });
      }
    } catch (err) {
      console.warn("Gemini API analysis failed, using high-precision local rule engine:", err);
    }
  }

  // Fallback to local heuristic analyzer
  const localResult = analyzeContentLocally(content, inputCategory);
  return res.json({ success: true, result: localResult, source: "local-engine" });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PURGE Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  start();
}
