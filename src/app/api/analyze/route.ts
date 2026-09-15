import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json(
        { error: "Ad URL is required" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Could not access the advertisement page",
          status: response.status,
        },
        { status: 502 }
      );
    }

    const html = await response.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);

    if (!text) {
      return NextResponse.json(
        { error: "No readable advertisement content found" },
        { status: 422 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        status: "content_found",
        message:
          "Advertisement content was found. Add the OpenAI API key to enable AI owner analysis.",
        preview: text.slice(0, 1000),
      });
    }

    const aiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          input: `
You are a Kuwait real-estate lead classification agent.

Analyze this publicly available real-estate advertisement.

Your job is NOT to claim that someone is legally the owner.
Determine whether the advertiser appears to be:
1. A direct owner
2. A real-estate office/company
3. Unclear

Return ONLY valid JSON:

{
  "classification": "owner" | "office_company" | "unclear",
  "owner_score": 0,
  "confidence": "low" | "medium" | "high",
  "property_type": "",
  "location": "",
  "price": "",
  "advertiser": "",
  "phone": "",
  "reasons": []
}

Owner score must be from 0 to 100.

Important:
- Never invent a name, phone number, price or ownership.
- Only use information actually present in the advertisement.
- "Owner" means "likely direct advertiser/owner", not legally verified ownership.
- Look for terms such as "from owner", "direct owner", "without intermediary".
- Look for company/office indicators such as company names, many listings, brokerage language, or office terminology.

Advertisement URL:
${url}

Advertisement text:
${text}
          `,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: errorText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const aiData = await aiResponse.json();

    const output =
      aiData.output_text ||
      aiData.output?.[0]?.content?.[0]?.text ||
      "";

    let analysis;

    try {
      analysis = JSON.parse(output);
    } catch {
      analysis = {
        classification: "unclear",
        owner_score: 0,
        confidence: "low",
        reasons: ["AI returned an unreadable result"],
      };
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
