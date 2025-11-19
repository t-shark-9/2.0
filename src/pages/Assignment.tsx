import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Assignment() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    loadAssignmentAndRedirect();
  }, [user, authLoading, id, navigate]);

  const loadAssignmentAndRedirect = async () => {
    try {
      const { data: assignment, error } = await supabase
        .from("assignments")
        .select("status")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Route based on status
      switch (assignment.status) {
        case "draft":
        case "planning":
          navigate(`/assignment/${id}/plan`);
          break;
        case "outlining":
          navigate(`/assignment/${id}/outline`);
          break;
        case "writing":
        case "reviewing":
        case "complete":
          navigate(`/assignment/${id}/draft`);
          break;
        default:
          navigate(`/assignment/${id}/plan`);
      }
    } catch (error: any) {
      toast.error("Failed to load assignment");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
