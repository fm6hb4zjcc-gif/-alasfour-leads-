import { NextResponse } from "next/server";

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;

      for (const content of item.content) {
        if (
          (content?.type === "output_text" || content?.type === "text") &&
          typeof content?.text === "string"
        ) {
          return content.text.trim();
        }
      }
    }
  }

  return "";
}

function parseJsonResult(text: string) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonPart = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonPart);
    }

    throw new Error("Invalid JSON returned by AI");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Ad URL is required" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid advertisement URL" },
        { status: 400 }
      );
    }

    const pageResponse = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ar,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!pageResponse.ok) {
      return NextResponse.json(
        {
          error: "Could not access the advertisement page",
          status: pageResponse.status,
        },
        { status: 502 }
      );
    }

    const html = await pageResponse.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

    if (!text) {
      return NextResponse.json(
        { error: "No readable advertisement content found" },
        { status: 422 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const prompt = `
Analyze this public Kuwait real-estate advertisement.

Classify ONLY the advertiser:
- owner = likely direct owner
- office_company = real-estate office, broker, agent, or company
- unclear = not enough evidence

Do not claim legally verified ownership.

Return ONLY one JSON object.
Do not use markdown.
Do not use code fences.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "classification": "owner",
  "owner_score": 0,
  "confidence": "low",
  "property_type": "",
  "location": "",
  "price": "",
  "advertiser": "",
  "phone": "",
  "reasons": []
}

Rules:
- classification must be: owner, office_company, or unclear
- owner_score must be a number from 0 to 100
- confidence must be: low, medium, or high
- Never invent missing information
- If a field is not present, return an empty string
- reasons must contain short factual reasons based only on the advertisement
- Company names, brokerage wording, office terminology, or clear broker language are evidence for office_company
- Phrases such as direct from owner or no intermediary are evidence for owner

Advertisement URL:
${url}

Advertisement page text:
${text}
`;

    const aiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          input: prompt,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: errorText.slice(0, 800),
        },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();
    const outputText = extractOutputText(aiData);

    if (!outputText) {
      return NextResponse.json(
        {
          error: "AI returned no readable text",
        },
        { status: 502 }
      );
    }

    let analysis;

    try {
      analysis = parseJsonResult(outputText);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: outputText.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Advertisement analysis failed",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
