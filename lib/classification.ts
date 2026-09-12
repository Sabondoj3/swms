// Future AI waste classification abstraction. MVP returns null (manual mode).
export type WasteSuggestion = {
  category: "PLASTIC" | "PAPER" | "FOOD_ORGANIC" | "GLASS" | "METAL" | "E_WASTE" | "MIXED" | "OTHER";
  confidence: number;
};

export interface WasteClassificationService {
  classify(imageUrl: string): Promise<WasteSuggestion | null>;
}

export class ManualOnlyClassificationService implements WasteClassificationService {
  async classify(_imageUrl: string): Promise<null> {
    // No external AI configured — user selects manually. Never fake results.
    return null;
  }
}

export class HttpClassificationService implements WasteClassificationService {
  constructor(private endpoint: string, private apiKey: string) {}
  async classify(imageUrl: string): Promise<WasteSuggestion | null> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.category) return null;
      return { category: data.category, confidence: data.confidence ?? 0 };
    } catch {
      return null;
    }
  }
}

export function getClassificationService(): WasteClassificationService {
  const url = process.env.AI_CLASSIFY_API_URL;
  const key = process.env.AI_CLASSIFY_API_KEY;
  if (url && key) return new HttpClassificationService(url, key);
  return new ManualOnlyClassificationService();
}

// Heuristic suggested priority (user/admin can override)
export function suggestPriority(problemType: string, wasteCategory: string): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (wasteCategory === "HAZARDOUS") return "CRITICAL";
  if (problemType === "ILLEGAL_DUMPING") return "HIGH";
  if (problemType === "BIN_OVERFLOWING") return "HIGH";
  if (problemType === "BIN_DAMAGED") return "MEDIUM";
  if (problemType === "NO_BIN") return "MEDIUM";
  if (problemType === "MISSED_COLLECTION") return "MEDIUM";
  return "LOW";
}
