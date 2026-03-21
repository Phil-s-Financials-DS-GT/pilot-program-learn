import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? "").trim();
    const userLevel = String(body?.userLevel ?? "intermediate").trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MICROSOFT_FOUNDRY_API_KEY");
    const endpointBase = Deno.env.get("MICROSOFT_FOUNDRY_ENDPOINT");

    if (!apiKey) {
      console.error("Missing MICROSOFT_FOUNDRY_API_KEY");
      return new Response(JSON.stringify({ error: "Missing MICROSOFT_FOUNDRY_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!endpointBase) {
      console.error("Missing MICROSOFT_FOUNDRY_ENDPOINT");
      return new Response(JSON.stringify({ error: "Missing MICROSOFT_FOUNDRY_ENDPOINT" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Azure AI Foundry chat-completions path with API version
    const url = `${endpointBase}/chat/completions?api-version=2024-05-01-preview`;

    const styleGuides: Record<string, string> = {
      beginner: "Target Audience: Middle School. Use simple language, emojis, and concrete analogies (like food, gaming, or sports). Avoid jargon.",
      intermediate: "Target Audience: High School. Use standard language. Explain complex terms if they appear.",
      advanced: "Target Audience: Adult/College. Use professional financial terminology. Be concise and technical.",
    };

    const styleGuide = styleGuides[userLevel] ?? styleGuides["intermediate"];

    const system = `
You are AskPhil. Follow this internal workflow every time.

Style guide: ${styleGuide}

1) Router
- Restate the user goal in one sentence.
- Decide if live web info is needed.
- Pick the best internal topic.

2) Web plan
- If the user asks for latest, today, news, prices, deadlines, or "who is", set needs_web=true.
- If no sources are provided, keep sources empty and continue.

3) Writer
- Write the answer using the style guide above.

4) Internal Librarian
- End with Study next and list 3 study items.

Output rules
- Bold headers.
- Bullet points.
- No HTML tags.
- Return VALID JSON with keys:
  answer, needs_web, study_next, sources
`;

    const payload = {
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
    };

    console.log("Calling Microsoft Foundry with message:", message.substring(0, 50) + "...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Foundry API error:", response.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Foundry API error", details: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No model content returned:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "No model content returned", raw: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Foundry response received successfully");

    // content should already be JSON text because of response_format
    return new Response(content, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error in AskPhil function:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
