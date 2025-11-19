import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CoachingResponse {
  questions: string[];
  thesisPattern: string;
  evidenceChecklist: string[];
}

export default function IdeaBuilder() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [rubric, setRubric] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);

  const [currentIdea, setCurrentIdea] = useState("");
  const [thesis, setThesis] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    loadAssignment();
  }, [user, authLoading, id, navigate]);

  const loadAssignment = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      // Load rubric
      if (assignmentData.rubric_id) {
        const { data: rubricData, error: rubricError } = await supabase
          .from("rubrics")
          .select("*")
          .eq("id", assignmentData.rubric_id)
          .single();

        if (!rubricError && rubricData) {
          setRubric(rubricData);
        }
      }

      // Load existing plan if any
      const { data: planData } = await supabase
        .from("plans")
        .select("*")
        .eq("assignment_id", id)
        .single();

      if (planData) {
        setThesis(planData.thesis || "");
        setAudience(planData.audience || "");
        setConstraints(planData.constraints || "");
      }
    } catch (error: any) {
      toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoaching = async () => {
    if (!currentIdea.trim()) {
      toast.error("Please describe your idea first");
      return;
    }

    setIsCoaching(true);

    try {
      const { data, error } = await supabase.functions.invoke("coach-plan", {
        body: {
          subject: assignment.subject,
          taskType: assignment.task_type,
          currentIdea,
          rubric: rubric?.criteria || [],
        },
      });

      if (error) throw error;
      setCoaching(data);
      toast.success("Coaching received!");
    } catch (error: any) {
      console.error("Coaching error:", error);
      toast.error(error.message || "Failed to get coaching");
    } finally {
      setIsCoaching(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existingPlan } = await supabase
        .from("plans")
        .select("id")
        .eq("assignment_id", id)
        .single();

      if (existingPlan) {
        // Update
        await supabase
          .from("plans")
          .update({
            thesis,
            audience,
            constraints,
          })
          .eq("id", existingPlan.id);
      } else {
        // Insert
        await supabase.from("plans").insert({
          assignment_id: id,
          thesis,
          audience,
          constraints,
        });
      }

      // Update assignment status
      await supabase
        .from("assignments")
        .update({ status: "outlining" })
        .eq("id", id);

      toast.success("Plan saved!");
      navigate(`/assignment/${id}/outline`);
    } catch (error: any) {
      toast.error("Failed to save plan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 p-6">
      <div className="container max-w-5xl mx-auto space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{assignment?.title}</h1>
              <p className="text-muted-foreground mt-2">Idea Builder</p>
            </div>
            <Badge className="bg-accent/20 text-accent-foreground">Planning</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Develop Your Idea
                </CardTitle>
                <CardDescription>
                  Describe your initial thoughts and get AI coaching to refine your approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="idea">What's your current idea or research question?</Label>
                  <Textarea
                    id="idea"
                    placeholder="Describe your initial thoughts, what interests you about this topic, and what you'd like to explore..."
                    value={currentIdea}
                    onChange={(e) => setCurrentIdea(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleGetCoaching}
                  disabled={isCoaching || !currentIdea.trim()}
                  className="w-full"
                >
                  {isCoaching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Getting Coaching...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Get AI Coaching
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
                <CardDescription>
                  Based on the coaching, refine your approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="thesis">Working Thesis / Research Question</Label>
                  <Textarea
                    id="thesis"
                    placeholder="Your main argument or research question..."
                    value={thesis}
                    onChange={(e) => setThesis(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Intended Audience</Label>
                  <Textarea
                    id="audience"
                    placeholder="Who are you writing for?"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constraints">Constraints & Requirements</Label>
                  <Textarea
                    id="constraints"
                    placeholder="Word count, specific requirements, etc."
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                Save & Exit
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save & Continue to Outline
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Coaching Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-medium sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">AI Coach</CardTitle>
                <CardDescription>
                  Questions and guidance to develop your idea
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!coaching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Describe your idea and click "Get AI Coaching" to receive personalized guidance
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-sm">Clarifying Questions</h3>
                      <ul className="space-y-2">
                        {coaching.questions.map((question, i) => (
                          <li key={i} className="text-sm p-3 rounded-lg bg-accent/10 border border-accent/20">
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 text-sm">Thesis Pattern</h3>
                      <p className="text-sm p-3 rounded-lg bg-primary/10 border border-primary/20 italic">
                        {coaching.thesisPattern}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-sm">Evidence Checklist</h3>
                      <ul className="space-y-2">
                        {coaching.evidenceChecklist.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-success mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
