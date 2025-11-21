import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DraggableBulletList } from "@/components/ui/draggable-bullet-list";
import { ArrowLeft, Save, Loader2, Sparkles, AlertCircle, CheckCircle2, Download, Zap } from "lucide-react";
import { toast } from "sonner";
import { exportToPDF, validateContentForPDF } from "@/lib/pdf-export";

interface Evaluation {
  overallScore: number;
  strengths: string[];
  improvements: Array<{
    criterion: string;
    issue: string;
    suggestion: string;
    priority: "high" | "medium" | "low";
  }>;
  nextSteps: string[];
}

export default function Draft() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [rubric, setRubric] = useState<any>(null);
  const [outline, setOutline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [useAffineEditor, setUseAffineEditor] = useState(false); // Disabled by default for deployment

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    loadData();
  }, [user, authLoading, id, navigate]);

  const loadData = async () => {
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
        const { data: rubricData } = await supabase
          .from("rubrics")
          .select("*")
          .eq("id", assignmentData.rubric_id)
          .maybeSingle();

        if (rubricData) {
          setRubric(rubricData);
        }
      }

      // Load outline
      const { data: outlineData } = await supabase
        .from("outlines")
        .select("*")
        .eq("assignment_id", id)
        .maybeSingle();

      if (outlineData) {
        setOutline(outlineData);
      }

      // Load existing draft
      const { data: draftData } = await supabase
        .from("drafts")
        .select("*")
        .eq("assignment_id", id)
        .maybeSingle();

      if (draftData) {
        setContent(draftData.content || "");
      }
    } catch (error: any) {
      toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const wordCount = content.trim().split(/\s+/).length;

      const { data: existingDraft } = await supabase
        .from("drafts")
        .select("id")
        .eq("assignment_id", id)
        .maybeSingle();

      if (existingDraft) {
        await supabase
          .from("drafts")
          .update({
            content,
            word_count: wordCount,
          })
          .eq("id", existingDraft.id);
      } else {
        await supabase.from("drafts").insert([{
          assignment_id: id,
          content,
          word_count: wordCount,
        }]);
      }

      // Update assignment status
      await supabase
        .from("assignments")
        .update({ status: "writing" as any })
        .eq("id", id);

      toast.success("Draft saved!");
    } catch (error: any) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }

    setIsEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-draft", {
        body: {
          content,
          subject: assignment.subject,
          taskType: assignment.task_type,
          rubric: rubric?.criteria || [],
        },
      });

      if (error) throw error;
      setEvaluation(data);
      toast.success("Evaluation complete!");
    } catch (error: any) {
      console.error("Evaluation error:", error);
      toast.error(error.message || "Failed to evaluate draft");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!flags.pdfDownload) {
      toast.error("PDF export is currently disabled");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }

    // Validate content for PDF export
    const validation = validateContentForPDF(content);
    if (!validation.isValid) {
      toast.error(`Cannot export PDF: ${validation.errors.join(', ')}`);
      return;
    }

    setIsExporting(true);
    try {
      const wordCount = content.trim().split(/\s+/).filter(w => w).length;
      
      await exportToPDF({
        title: assignment?.title || "Draft",
        content: content,
        subject: assignment?.subject ? assignment.subject.replace("_", " ").toUpperCase() : undefined,
        author: user?.email || "Student",
        wordCount: wordCount
      });

      toast.success("PDF exported successfully!");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOutlineReorder = async (newSections: any[]) => {
    try {
      await supabase
        .from("outlines")
        .update({ sections: newSections })
        .eq("assignment_id", id);
      
      setOutline(prev => ({ ...prev, sections: newSections }));
      toast.success("Outline updated!");
    } catch (error) {
      toast.error("Failed to update outline");
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "text-destructive",
      medium: "text-warning-foreground",
      low: "text-muted-foreground",
    };
    return colors[priority as keyof typeof colors] || "text-muted-foreground";
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
      <div className="container max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => navigate(`/assignment/${id}/outline`)} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Outline
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} size="sm">
              Dashboard
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">{assignment?.title}</h1>
                <Button
                  variant={useAffineEditor ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseAffineEditor(!useAffineEditor)}
                  className="ml-2"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {useAffineEditor ? "AFFiNE Active" : "Use AFFiNE"}
                </Button>
              </div>
              <p className="text-muted-foreground">
                Draft Workspace {useAffineEditor ? "- AFFiNE Editor with Lovable AI" : "- Lovable AI"}
              </p>
            </div>
            <Badge className="bg-accent/20 text-accent-foreground">Writing</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {outline && (
              <DraggableBulletList
                sections={outline.sections || []}
                onReorder={handleOutlineReorder}
                enabled={flags.draggableBullets}
              />
            )}

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Write Your Draft</CardTitle>
            <CardDescription>
              {useAffineEditor 
                ? 'AFFiNE Editor - Full-featured writing with real-time collaboration, AI assistance, and rich formatting'
                : 'Transform your outline into a complete draft with AI-powered assistance. ' + (flags.equationEditor ? 'Use equations and formatting tools to enhance your writing.' : 'Focus on clear, structured writing.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {useAffineEditor ? (
              <div className="w-full rounded-lg overflow-hidden border bg-white" style={{ height: '700px' }}>
                <iframe
                  src="http://localhost:8080"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  title="AFFiNE Editor"
                  className="rounded-lg"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            ) : flags.equationEditor ? (
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Start writing your draft here... Use $equation$ for inline math or $$equation$$ for block equations."
                rows={16}
              />
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your draft here..."
                rows={20}
                className="font-serif text-base leading-relaxed"
              />
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Word count: {content.trim().split(/\s+/).filter(w => w).length}
              </p>
              <div className="flex gap-2">
                {flags.pdfDownload && (
                  <Button 
                    onClick={handleExportPDF} 
                    disabled={isExporting || !content.trim()} 
                    variant="outline"
                    size="sm"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={handleEvaluate} disabled={isEvaluating} variant="outline">
                  {isEvaluating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Evaluate Draft
                    </>
                  )}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Evaluation Panel */}
          <div className="lg:col-span-1">
            <Card className="shadow-medium sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">AI Evaluation</CardTitle>
                <CardDescription>
                  IBDP standards feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!evaluation ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Click "Evaluate Draft" to receive feedback on your writing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center pb-4 border-b">
                      <div className="text-4xl font-bold text-primary">{evaluation.overallScore}/7</div>
                      <p className="text-sm text-muted-foreground mt-1">IBDP Level</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Strengths
                      </h3>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((strength, i) => (
                          <li key={i} className="text-sm p-3 rounded-lg bg-success/10 border border-success/20">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {evaluation.improvements.map((item, i) => (
                          <li key={i} className="text-sm p-3 rounded-lg bg-accent/10 border border-accent/20">
                            <div className="font-medium mb-1 flex items-center justify-between">
                              <span>{item.criterion}</span>
                              <Badge variant="outline" className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-2 text-xs">{item.issue}</p>
                            <p className="text-xs italic">{item.suggestion}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-sm">Next Steps</h3>
                      <ul className="space-y-2">
                        {evaluation.nextSteps.map((step, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-0.5">{i + 1}.</span>
                            <span>{step}</span>
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
