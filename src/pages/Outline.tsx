import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DraggableOutlineSections } from "@/components/ui/draggable-outline-sections";
import { ArrowLeft, ArrowRight, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Section {
  id: string;
  title: string;
  bullets: string[];
  order: number;
}

export default function Outline() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([
    { id: "1", title: "Introduction", bullets: [""], order: 0 },
    { id: "2", title: "Context & Background", bullets: [""], order: 1 },
    { id: "3", title: "Main Argument", bullets: [""], order: 2 },
    { id: "4", title: "Evidence & Analysis", bullets: [""], order: 3 },
    { id: "5", title: "Counterargument", bullets: [""], order: 4 },
    { id: "6", title: "Conclusion", bullets: [""], order: 5 },
  ]);

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

      // Load existing outline if any
      const { data: outlineData } = await supabase
        .from("outlines")
        .select("*")
        .eq("assignment_id", id)
        .single();

      if (outlineData && outlineData.sections) {
        setSections(outlineData.sections as any);
      }
    } catch (error: any) {
      toast.error("Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, title } : s));
  };

  const updateBullet = (sectionId: string, bulletIndex: number, value: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newBullets = [...s.bullets];
        newBullets[bulletIndex] = value;
        return { ...s, bullets: newBullets };
      }
      return s;
    }));
  };

  const addBullet = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, bullets: [...s.bullets, ""] } : s
    ));
  };

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: "New Section",
      bullets: [""],
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const handleSectionUpdate = (id: string, field: string, value: any) => {
    if (id === 'reorder' && field === 'sections') {
      // Handle section reordering
      setSections(value);
    } else if (field === 'title') {
      updateSectionTitle(id, value);
    } else if (field === 'bullets') {
      // Handle bullet updates
      setSections(sections.map(s => s.id === id ? { ...s, bullets: value } : s));
    } else if (field === 'bullet') {
      updateBullet(id, value.index, value.value);
    }
  };

  const saveOutline = async () => {
    try {
      const { data: existingOutline } = await supabase
        .from("outlines")
        .select("id")
        .eq("assignment_id", id)
        .single();

      if (existingOutline) {
        await supabase
          .from("outlines")
          .update({ sections: sections as any })
          .eq("id", existingOutline.id);
      } else {
        await supabase.from("outlines").insert([{
          assignment_id: id,
          sections: sections as any,
        }]);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      await saveOutline();

      await supabase
        .from("assignments")
        .update({ status: "draft" as any })
        .eq("id", id);

      toast.success("Outline saved!");
      navigate(`/assignment/${id}/draft`);
    } catch (error: any) {
      toast.error("Failed to save outline");
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
              <p className="text-muted-foreground mt-2">Outline & Flow</p>
            </div>
            <Badge className="bg-accent/20 text-accent-foreground">Outlining</Badge>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {flags.draggableBullets && <GripVertical className="h-4 w-4 text-muted-foreground" />}
              Build Your Structure
              {flags.draggableBullets && <span className="text-sm font-normal text-muted-foreground">(Draggable)</span>}
            </CardTitle>
            <CardDescription>
              Organize your ideas into sections. {flags.draggableBullets ? 'Drag to reorder sections and bullet points.' : 'Add bullet points for each key concept.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DraggableOutlineSections
              sections={sections}
              onUpdateSection={handleSectionUpdate}
              onAddBullet={addBullet}
              onAddSection={addSection}
              enabled={flags.draggableBullets}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/assignment/${id}/plan`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plan
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
            Save & Exit
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save & Continue to Draft
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
