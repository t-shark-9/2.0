import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Input validation
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { subject, taskType, currentIdea, rubric } = body;
    
    // Validate required fields
    if (!subject || typeof subject !== 'string' || subject.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!taskType || typeof taskType !== 'string' || taskType.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid task type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (currentIdea && (typeof currentIdea !== 'string' || currentIdea.length > 5000)) {
      return new Response(
        JSON.stringify({ error: "Current idea too long (max 5000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!rubric || typeof rubric !== 'object') {
      return new Response(
        JSON.stringify({ error: "Invalid rubric" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an IBDP writing coach. Your job is to COACH, not write.

Strict rules:
- Never write full paragraphs or full answers for the student.
- Use targeted questions, sentence starters, structure suggestions, and checklists.
- Align feedback to the provided rubric (criteria, descriptors, weightings).
- Provide evidence- and reasoning-focused guidance: thesis clarity, line of inquiry, structure, analysis vs. description, counterargument, academic integrity.
- When asked to "write it," refuse and restate policy; offer a scaffold or example pattern using placeholders.
- Keep feedback concise, prioritized (top 3 issues first), and actionable.
- Never fabricate sources or quotes. Do not fetch sources. Only suggest how to strengthen evidence.`;

    const userPrompt = `Context:
Subject: ${subject}
Task Type: ${taskType}
Student's current idea: ${currentIdea || "Just starting"}
Rubric: ${JSON.stringify(rubric, null, 2)}

Coach the student with:
1. 3 clarifying questions to help them develop their thesis/research question
2. A one-sentence working thesis pattern with placeholders (NOT the actual thesis)
3. A checklist of what evidence/analysis would be needed (no specific sources)

Keep your response focused and actionable. Format as JSON with keys: questions (array), thesisPattern (string), evidenceChecklist (array).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_coaching",
              description: "Provide coaching guidance for the student's idea",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 clarifying questions",
                  },
                  thesisPattern: {
                    type: "string",
                    description: "A pattern/scaffold for a thesis statement with placeholders",
                  },
                  evidenceChecklist: {
                    type: "array",
                    items: { type: "string" },
                    description: "Types of evidence needed (not specific sources)",
                  },
                },
                required: ["questions", "thesisPattern", "evidenceChecklist"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_coaching" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const coaching = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(coaching), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in coach-plan function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
