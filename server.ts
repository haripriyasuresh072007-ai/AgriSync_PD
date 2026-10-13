import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AgriSync Procurement Cloud' });
});

// Rule-based heuristic extraction fallback (always reliable, 0ms latency, never 503s)
function extractProcurementFieldsRuleBased(text: string) {
  const lower = text.toLowerCase();
  const fields: Record<string, any> = {};

  // Commodity
  if (lower.includes('wheat') || lower.includes('gehun') || lower.includes('gehu') || lower.includes('गेहूं') || lower.includes('கோதுமை') || lower.includes('ਕਣਕ')) {
    fields.commodity = 'Wheat';
  } else if (lower.includes('paddy') || lower.includes('dhan') || lower.includes('rice') || lower.includes('धान') || lower.includes('நெல்') || lower.includes('ਝੋਨਾ')) {
    fields.commodity = 'Paddy';
  } else if (lower.includes('mustard') || lower.includes('sarson') || lower.includes('सरसों') || lower.includes('கடுகு') || lower.includes('ਸਰ੍ਹੋਂ')) {
    fields.commodity = 'Mustard';
  } else if (lower.includes('cotton') || lower.includes('kapas') || lower.includes('कपास') || lower.includes('பருத்தி') || lower.includes('ਕਪਾਹ')) {
    fields.commodity = 'Cotton';
  } else if (lower.includes('maize') || lower.includes('makka') || lower.includes('मक्का') || lower.includes('மக்காச்சோளம்') || lower.includes('ਮੱਕੀ')) {
    fields.commodity = 'Maize';
  } else if (lower.includes('soyabean') || lower.includes('सोयाबीन') || lower.includes('சோயாபீன்') || lower.includes('ਸੋਇਆਬੀਨ')) {
    fields.commodity = 'Soyabean';
  }

  // Quantity in quintals
  const qtyMatch = text.match(/(\d+)\s*(?:quintal|qtl|quintals|क्विंटल|कुंतल|குவிண்டால்|ਕੁਇੰਟਲ)/i) ||
                   text.match(/(?:quantity|qty|volume|अளவு|ਮਾਤਰਾ)\s*(?:is|of|:)?\s*(\d+)/i) ||
                   text.match(/(\d+)\s*(?:ton|tonnes|டன்கள்|ਟਨ)/i);
  if (qtyMatch) {
    const num = parseInt(qtyMatch[1], 10);
    if (!isNaN(num) && num > 0) {
      fields.quantityQuintals = num;
    }
  }

  // Vehicle type
  if (lower.includes('tractor') || lower.includes('trolley') || lower.includes('ट्रैक्टर') || lower.includes('டிராக்டர்') || lower.includes('ਟਰੈਕਟਰ')) {
    fields.vehicleType = 'Tractor Trolley';
  } else if (lower.includes('mini truck') || lower.includes('pickup') || lower.includes('bolero') || lower.includes('पिकअप') || lower.includes('மினி லாரி') || lower.includes('ਪਿਕਅੱਪ')) {
    fields.vehicleType = 'Mini Truck (Pick-up)';
  } else if (lower.includes('truck') || lower.includes('lorry') || lower.includes('ट्रक') || lower.includes('லாரி') || lower.includes('ਟਰੱਕ')) {
    fields.vehicleType = 'Heavy Multi-axle Truck';
  } else if (lower.includes('bullock') || lower.includes('cart') || lower.includes('बैलगाड़ी') || lower.includes('மாட்டு வண்டி') || lower.includes('ਬਲਦ ਗੱਡੀ')) {
    fields.vehicleType = 'Bullock Cart';
  }

  // Vehicle plate pattern e.g. HR-05-AR-2291 or PB 10 1234 or TN 01 AB 1234
  const plateMatch = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4})\b/i);
  if (plateMatch) {
    fields.vehicleNumber = plateMatch[1].toUpperCase().replace(/\s+/g, '-');
  }

  // Farmer name
  const nameMatch = text.match(/(?:my name is|i am|farmer name is|मेरा नाम|ਮੇਰਾ ਨਾਮ|என் பெயர்|பெயர்)\s+([A-Za-z\u0900-\u097F\u0B80-\u0BFF\u0A00-\u0A7F\s]+?)(?:,|and|\.|\s+from|\s+wheat|\s+मेरे|\s+hai|\s+irukken|\s+வாழ)/i);
  if (nameMatch && nameMatch[1].trim().length > 2) {
    fields.farmerName = nameMatch[1].trim();
  }

  return fields;
}

// Helper function to extract structured procurement entities using Gemini with rule fallback
async function extractFieldsWithGemini(ai: GoogleGenAI, text: string) {
  if (!text || text.trim().length === 0) return {};
  const fallback = extractProcurementFieldsRuleBased(text);

  try {
    const prompt = `You are an AI assistant for an Indian APMC Agricultural Grain Mandi e-procurement platform.
A farmer statement is provided:
"${text}"

Extract the procurement details in strict JSON format:
{
  "farmerName": string or null,
  "commodity": "Wheat" | "Paddy" | "Mustard" | "Cotton" | "Maize" | "Soyabean" | null,
  "quantityQuintals": number (in quintals) or null,
  "vehicleNumber": string (e.g. HR-05-AR-2291, TN-01-AB-1234, PB-10-BK-7704) or null,
  "vehicleType": "Tractor Trolley" | "Mini Truck (Pick-up)" | "Bullock Cart" | "Heavy Multi-axle Truck" | null
}
Translate commodity names if spoken in Hindi (गेहूं -> Wheat, धान -> Paddy, सरसों -> Mustard), Punjabi (ਕਣਕ -> Wheat, ਝੋਨਾ -> Paddy), or Tamil (கோதுமை -> Wheat, நெல் -> Paddy, கடுகு -> Mustard, பருத்தி -> Cotton).
Return only valid JSON.`;

    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (resp.text) {
      const parsed = JSON.parse(resp.text);
      return {
        farmerName: parsed.farmerName || fallback.farmerName,
        commodity: parsed.commodity || fallback.commodity,
        quantityQuintals: parsed.quantityQuintals || fallback.quantityQuintals,
        vehicleNumber: parsed.vehicleNumber || fallback.vehicleNumber,
        vehicleType: parsed.vehicleType || fallback.vehicleType,
      };
    }
  } catch (err) {
    console.warn('Gemini field extraction notice (used rule-based fallback):', err);
  }

  return fallback;
}

/**
 * Transcribe Audio using gemini-3.5-transcribe with gemini-3.8-flash fallback
 * Accepts base64 encoded audio recorded via browser microphone
 */
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', languageHint } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audio data payload' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing from environment variables');
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify environment secrets.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // CRITICAL: Strip parameters like ;codecs=opus from MIME type to avoid Gemini 400 INVALID_ARGUMENT
    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!cleanMime.startsWith('audio/')) {
      cleanMime = 'audio/webm';
    }

    const promptText = languageHint
      ? `Transcribe this spoken audio accurately. The speaker is speaking in ${languageHint} (or Indian English, Hindi, Tamil, or Punjabi). Provide the exact verbatim transcription of what was said.`
      : `Transcribe this audio recording accurately. It may contain speech in English, Hindi (हिंदी), Tamil (தமிழ்), or Punjabi (ਪੰਜਾਬੀ). Return the exact transcribed text.`;

    let transcript = '';

    // First attempt: gemini-3.5-transcribe
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });

      if (response.text) {
        transcript = response.text.trim();
      } else if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) transcript += part.text;
        }
        transcript = transcript.trim();
      }
    } catch (primaryErr: any) {
      console.warn('gemini-3.5-transcribe notice, attempting fallback to gemini-3.8-flash:', primaryErr?.message || primaryErr);
    }

    // Fallback attempt: gemini-3.8-flash if primary was empty
    if (!transcript) {
      try {
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioBase64,
                },
              },
              {
                text: `${promptText} If there is spoken speech, transcribe it verbatim in its spoken language. If no speech is heard or it is silent, reply with "[No speech detected]".`,
              },
            ],
          },
        });
        transcript = fallbackResp.text ? fallbackResp.text.trim() : '';
      } catch (fallbackErr: any) {
        console.warn('gemini-3.8-flash audio fallback notice:', fallbackErr?.message || fallbackErr);
      }
    }

    // Clean up empty or silent responses
    if (transcript.includes('[No speech detected]') || transcript === 'undefined') {
      transcript = '';
    }

    // Extract structured procurement fields using Gemini + Rule fallback
    const parsedFields = transcript ? await extractFieldsWithGemini(ai, transcript) : {};

    return res.json({ transcript, parsedFields });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to transcribe audio. Please check microphone input and try again.',
    });
  }
});

/**
 * Parse text directly using Gemini AI with instant rule fallback
 */
app.post('/api/parse-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.json({ parsedFields: {} });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ parsedFields: extractProcurementFieldsRuleBased(text) });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parsedFields = await extractFieldsWithGemini(ai, text);
    return res.json({ parsedFields });
  } catch (err: any) {
    console.warn('Parse text fallback notice:', err);
    return res.json({ parsedFields: extractProcurementFieldsRuleBased(req.body?.text || '') });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriSync Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
