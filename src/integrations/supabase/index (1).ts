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
    
    const { content, subject, taskType, rubric } = body;
    
    // Validate required fields
    if (!content || typeof content !== 'string' || content.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Invalid or too long content (max 50000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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

    const systemPrompt = `You are an IBDP writing evaluator. Evaluate student drafts against IBDP criteria.

STRICT RULES:
- Never rewrite content for the student
- Provide specific, actionable feedback tied to rubric criteria
- Identify strengths and areas for improvement
- Focus on: thesis clarity, evidence quality, analysis depth, structure, academic voice
- Suggest next steps without doing the work for them

Return your evaluation as JSON with this structure:
{
  "overallScore": "A number 1-7 indicating IBDP level",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": [
    {
      "criterion": "criterion name",
      "issue": "what needs improvement",
      "suggestion": "how to improve it (coaching, not rewriting)",
      "priority": "high|medium|low"
    }
  ],
  "nextSteps": ["actionable step 1", "actionable step 2", "actionable step 3"]
}`;

    const userPrompt = `Subject: ${subject}
Task Type: ${taskType}
Rubric Criteria: ${JSON.stringify(rubric)}

Student Draft:
${content}

Evaluate this draft against IBDP standards. Provide constructive coaching feedback.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
              name: "evaluate_draft",
              description: "Evaluate an IBDP student draft and return structured feedback.",
              parameters: {
                type: "object",
                properties: {
                  overallScore: { type: "number", minimum: 1, maximum: 7 },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 2,
                    maxItems: 4,
                  },
                  improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        criterion: { type: "string" },
                        issue: { type: "string" },
                        suggestion: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["criterion", "issue", "suggestion", "priority"],
                      additionalProperties: false,
                    },
                  },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 5,
                  },
                },
                required: ["overallScore", "strengths", "improvements", "nextSteps"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_draft" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const evaluation = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in evaluate-draft:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
