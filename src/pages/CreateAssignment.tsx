import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CreateAssignment() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [taskType, setTaskType] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [noGhostwritingAccepted, setNoGhostwritingAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!noGhostwritingAccepted) {
      toast.error("Please accept the No Ghostwriting policy");
      return;
    }

    setIsLoading(true);

    try {
      // Get default rubric for this subject/task type
      const { data: rubrics } = await supabase
        .from("rubrics")
        .select("id")
        .eq("subject", subject as any)
        .eq("task_type", taskType as any)
        .eq("is_default", true)
        .limit(1);

      const rubricId = rubrics?.[0]?.id || null;

      const { data, error } = await supabase
        .from("assignments")
        .insert([{
          user_id: user.id,
          title,
          subject: subject as any,
          task_type: taskType as any,
          rubric_id: rubricId,
          deadline: deadline?.toISOString(),
          status: "planning" as any,
          no_ghostwriting_accepted: noGhostwritingAccepted,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Assignment created!");
      navigate(`/assignment/${data.id}/plan`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create assignment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 p-6">
      <div className="container max-w-2xl mx-auto space-y-8">
        <div>
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold tracking-tight">Create New Assignment</h1>
          <p className="text-muted-foreground mt-2">
            Set up your assignment details to begin the coaching process
          </p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Tell us about your writing project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Macbeth Literary Analysis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lang_a">Language A</SelectItem>
                      <SelectItem value="lang_b">Language B</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="economics">Economics</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="tok">Theory of Knowledge</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-type">Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType} required>
                    <SelectTrigger id="task-type">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="commentary">Commentary</SelectItem>
                      <SelectItem value="tok">ToK Essay</SelectItem>
                      <SelectItem value="ia">Internal Assessment</SelectItem>
                      <SelectItem value="ee">Extended Essay</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Pick a deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-start space-x-2 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <Checkbox
                  id="no-ghostwriting-create"
                  checked={noGhostwritingAccepted}
                  onCheckedChange={(checked) => setNoGhostwritingAccepted(checked === true)}
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="no-ghostwriting-create"
                    className="text-sm font-medium cursor-pointer"
                  >
                    I understand this coach will not write my assignment
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This tool provides guidance through questions, suggestions, and rubric-based
                    feedback. All writing must be your own work.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Creating..." : "Create & Start Planning"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
