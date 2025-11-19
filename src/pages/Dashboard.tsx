import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Plus, BookOpen, LogOut, Clock, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  task_type: string;
  deadline: string | null;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    loadAssignments();
  }, [user, authLoading, navigate]);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      planning: "bg-accent/20 text-accent-foreground",
      outlining: "bg-primary/20 text-primary",
      writing: "bg-warning/20 text-warning-foreground",
      reviewing: "bg-secondary/50 text-secondary-foreground",
      complete: "bg-success/20 text-success",
    };
    return colors[status] || "bg-muted";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Assignments</h1>
            <p className="text-muted-foreground mt-2">Track your writing journey</p>
          </div>
          <div className="flex items-center gap-2">
            {flags.themeToggle && <ThemeToggle />}
            {flags.adminAccess && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Create New Assignment */}
        <Card className="shadow-medium border-primary/20 hover:shadow-strong transition-shadow">
          <CardHeader>
            <CardTitle>
              Start New Assignment
            </CardTitle>
            <CardDescription>
              Begin your writing journey with AI-powered coaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/assignment/new")}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>

        {/* Assignments List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first assignment to get started with AI coaching
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer group"
                onClick={() => navigate(`/assignment/${assignment.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate group-hover:text-primary transition-colors">
                        {assignment.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <span className="capitalize">{assignment.subject.replace("_", " ")}</span>
                        <span>•</span>
                        <span className="capitalize">{assignment.task_type}</span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status === "complete" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : null}
                      {assignment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(assignment.deadline)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
