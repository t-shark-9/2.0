/**
 * EXAMPLE: Updated Draft.tsx with AFFiNE Integration
 * 
 * This is an example showing how to modify your existing Draft.tsx
 * to include AFFiNE editor features while keeping your current functionality.
 * 
 * IMPORTANT: This is just an example/reference file.
 * You can apply these changes to your actual Draft.tsx when ready.
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ArrowLeft, Save, Loader2, Sparkles, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

// NEW IMPORT - AFFiNE Integration Component
import { AffineIframeEmbed, default as AffineEditorIntegration } from "@/components/AffineEditorIntegration";

export default function DraftWithAFFiNE() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [rubric, setRubric] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // NEW STATE - Toggle between editors
  const [useAffineEditor, setUseAffineEditor] = useState(false);

  // Your existing loadData, handleSave, handleEvaluate functions stay the same
  // ... (keep all your existing logic)

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
        {/* Header Section - Same as before */}
        <div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => navigate(`/assignment/${id}/outline`)} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Outline
            </Button>
            
            {/* NEW - Toggle between editors */}
            <Button 
              variant={useAffineEditor ? "default" : "outline"} 
              onClick={() => setUseAffineEditor(!useAffineEditor)}
              size="sm"
            >
              {useAffineEditor ? "Using AFFiNE Editor" : "Switch to AFFiNE"}
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{assignment?.title}</h1>
              <p className="text-muted-foreground mt-2">
                Draft Workspace {useAffineEditor && "- Powered by AFFiNE"}
              </p>
            </div>
            <Badge className="bg-accent/20 text-accent-foreground">Writing</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - UPDATED to support both editors */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* OPTION 1: Quick Iframe Integration (Easiest) */}
            {useAffineEditor && (
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Write Your Draft - AFFiNE Editor</CardTitle>
                  <CardDescription>
                    Full-featured writing experience with AI assistance from Lovable AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AffineIframeEmbed height="600px" />
                  
                  {/* Your existing save/evaluate buttons */}
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Word count: {content.trim().split(/\s+/).filter(w => w).length}
                    </p>
                    <div className="flex gap-2">
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
            )}

            {/* OPTION 2: Your Existing Editor (when AFFiNE is toggled off) */}
            {!useAffineEditor && (
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Write Your Draft</CardTitle>
                  <CardDescription>
                    Your current editor with AI evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flags.equationEditor ? (
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Start writing your draft here..."
                      rows={16}
                    />
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Start writing your draft here..."
                      className="w-full min-h-[400px] p-4 rounded-lg border"
                    />
                  )}
                  
                  {/* Your existing buttons */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Word count: {content.trim().split(/\s+/).filter(w => w).length}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleEvaluate} disabled={isEvaluating} variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Evaluate Draft
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Evaluation Panel - Same as before */}
          <div className="lg:col-span-1">
            <Card className="shadow-medium sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">AI Evaluation</CardTitle>
                <CardDescription>
                  IBDP standards feedback powered by Lovable AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Your existing evaluation display */}
                {!evaluation ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Click "Evaluate Draft" to receive feedback
                    </p>
                  </div>
                ) : (
                  // Your existing evaluation display
                  <div className="space-y-6">
                    {/* Keep your existing evaluation UI */}
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

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. This example shows a toggle between your current editor and AFFiNE
 * 2. All your existing functionality is preserved
 * 3. The AFFiNE editor is added as an optional enhancement
 * 
 * TO USE THIS:
 * 1. Install the AFFiNE integration component (already created)
 * 2. Add your Lovable API key to .env files
 * 3. Ensure AFFiNE is running on localhost:8080
 * 4. Copy the parts you want to your actual Draft.tsx
 * 
 * ALTERNATIVES:
 * - Use only AFFiNE editor (remove toggle, always use AFFiNE)
 * - Use only iframe approach (simpler but less integrated)
 * - Use full BlockSuite integration (most powerful but requires npm install)
 */
