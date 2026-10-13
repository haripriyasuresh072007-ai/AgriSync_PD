/**
 * Audio Recording and Transcription Client Service
 * Communicates with backend /api/transcribe powered by gemini-3.5-transcribe and gemini-3.8-flash
 */

export interface TranscriptionResult {
  transcript: string;
  durationSeconds?: number;
  parsedFields?: {
    farmerName?: string;
    commodity?: 'Wheat' | 'Paddy' | 'Mustard' | 'Cotton' | 'Maize' | 'Soyabean';
    quantityQuintals?: number;
    vehicleNumber?: string;
    vehicleType?: 'Tractor Trolley' | 'Mini Truck (Pick-up)' | 'Bullock Cart' | 'Heavy Multi-axle Truck';
  };
}

/**
 * Converts a Blob to a base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends recorded audio to /api/transcribe
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  languageHint?: string
): Promise<TranscriptionResult> {
  // Strip any codec details from mimeType
  const rawType = audioBlob.type || 'audio/webm';
  const mimeType = rawType.split(';')[0].trim();
  const audioBase64 = await blobToBase64(audioBlob);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioBase64,
      mimeType,
      languageHint,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with status ${response.status}`);
  }

  const data = await response.json();
  const transcript: string = data.transcript || '';

  // Merge AI backend extracted fields with client heuristic fallback
  const fallbackParsed = extractProcurementFields(transcript);
  const aiParsed = data.parsedFields || {};

  const mergedFields: TranscriptionResult['parsedFields'] = {
    farmerName: aiParsed.farmerName || fallbackParsed.farmerName,
    commodity: aiParsed.commodity || fallbackParsed.commodity,
    quantityQuintals: aiParsed.quantityQuintals || fallbackParsed.quantityQuintals,
    vehicleNumber: aiParsed.vehicleNumber || fallbackParsed.vehicleNumber,
    vehicleType: aiParsed.vehicleType || fallbackParsed.vehicleType,
  };

  return {
    transcript,
    parsedFields: mergedFields,
  };
}

/**
 * Parse text statement directly using Gemini AI
 */
export async function parseTextWithGemini(text: string): Promise<TranscriptionResult> {
  if (!text || !text.trim()) {
    return { transcript: '', parsedFields: {} };
  }

  try {
    const response = await fetch('/api/parse-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const data = await response.json();
      const aiParsed = data.parsedFields || {};
      const fallbackParsed = extractProcurementFields(text);
      return {
        transcript: text,
        parsedFields: {
          farmerName: aiParsed.farmerName || fallbackParsed.farmerName,
          commodity: aiParsed.commodity || fallbackParsed.commodity,
          quantityQuintals: aiParsed.quantityQuintals || fallbackParsed.quantityQuintals,
          vehicleNumber: aiParsed.vehicleNumber || fallbackParsed.vehicleNumber,
          vehicleType: aiParsed.vehicleType || fallbackParsed.vehicleType,
        },
      };
    }
  } catch (err) {
    console.warn('API parse error, using fallback:', err);
  }

  return {
    transcript: text,
    parsedFields: extractProcurementFields(text),
  };
}

/**
 * Rule-based heuristic extraction to assist farmers in autofilling from spoken transcript
 */
export function extractProcurementFields(text: string) {
  const lower = text.toLowerCase();
  const fields: TranscriptionResult['parsedFields'] = {};

  // Commodity
  if (lower.includes('wheat') || lower.includes('gehun') || lower.includes('gehu') || lower.includes('கோதுமை') || lower.includes('ਕਣਕ')) {
    fields.commodity = 'Wheat';
  } else if (lower.includes('paddy') || lower.includes('dhan') || lower.includes('rice') || lower.includes('நெல்') || lower.includes('ਝੋਨਾ')) {
    fields.commodity = 'Paddy';
  } else if (lower.includes('mustard') || lower.includes('sarson') || lower.includes('கடுகு') || lower.includes('ਸਰ੍ਹੋਂ')) {
    fields.commodity = 'Mustard';
  } else if (lower.includes('cotton') || lower.includes('kapas') || lower.includes('பருத்தி') || lower.includes('ਕਪਾਹ')) {
    fields.commodity = 'Cotton';
  } else if (lower.includes('maize') || lower.includes('makka') || lower.includes('மக்காச்சோளம்') || lower.includes('ਮੱਕੀ')) {
    fields.commodity = 'Maize';
  } else if (lower.includes('soyabean') || lower.includes('சோயாபீன்') || lower.includes('ਸੋਇਆਬੀਨ')) {
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
  if (lower.includes('tractor') || lower.includes('trolley') || lower.includes('டிராக்டர்') || lower.includes('ਟਰੈਕਟਰ')) {
    fields.vehicleType = 'Tractor Trolley';
  } else if (lower.includes('mini truck') || lower.includes('pickup') || lower.includes('bolero') || lower.includes('மினி லாரி') || lower.includes('ਪਿਕਅੱਪ')) {
    fields.vehicleType = 'Mini Truck (Pick-up)';
  } else if (lower.includes('truck') || lower.includes('lorry') || lower.includes('லாரி') || lower.includes('ਟਰੱਕ')) {
    fields.vehicleType = 'Heavy Multi-axle Truck';
  } else if (lower.includes('bullock') || lower.includes('cart') || lower.includes('மாட்டு வண்டி') || lower.includes('ਬਲਦ ਗੱਡੀ')) {
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
