import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { title, niches, budget, requirements } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Campaign title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a professional marketing copywriter specializing in influencer marketing campaigns. Your task is to write compelling, clear, and engaging campaign descriptions that attract top influencers.

Guidelines:
- Be concise but impactful (2-3 paragraphs max)
- Highlight the value proposition for influencers
- Include clear expectations and deliverables
- Use professional but approachable tone
- Focus on mutual benefits and collaboration
- Avoid jargon and be specific about what you're looking for`;

    const userPrompt = `Write a compelling campaign description for an influencer marketing campaign with these details:

Campaign Title: ${title}
${niches && niches.length > 0 ? `Target Niches: ${niches.join(", ")}` : ""}
${budget ? `Budget: $${budget} USDC` : ""}
${requirements ? `Additional Requirements: ${requirements}` : ""}

Write a professional description that would attract quality influencers to apply. Make it specific, engaging, and clear about expectations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate description");
    }

    const data = await response.json();
    const generatedDescription = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ description: generatedDescription.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating campaign description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
