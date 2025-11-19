import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Settings, Download, Calculator, Palette, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { flags, updateFlag, resetToDefaults, isAdmin, setIsAdmin } = useFeatureFlags();
  const navigate = useNavigate();
  const [adminPassword, setAdminPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(!isAdmin);

  const ADMIN_PASSWORD = "ibdp2024"; // In production, this would be more secure

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, authLoading, navigate]);

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      toast.success("Admin access granted!");
    } else {
      toast.error("Invalid admin password");
    }
  };

  const handleFeatureToggle = (feature: keyof typeof flags, enabled: boolean) => {
    updateFlag(feature, enabled);
    toast.success(`${feature} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    toast.success("Reset to default settings");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    navigate("/");
    toast.info("Logged out of admin mode");
  };

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 p-6">
        <div className="container max-w-md mx-auto">
          <div className="flex gap-2 mb-6">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <Card className="shadow-medium">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                Enter the admin password to access feature controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
              <Button onClick={handleAdminLogin} className="w-full">
                Enter Admin Mode
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Demo password: ibdp2024
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 p-6">
      <div className="container max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              Exit Admin Mode
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Feature prototype controls</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Admin Mode
            </Badge>
          </div>
        </div>

        {/* Feature Controls */}
        <div className="grid gap-6">
          {/* PDF Download Control */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Download className="h-5 w-5" />
                PDF Export Feature
              </CardTitle>
              <CardDescription>
                Toggle the ability to export drafts as PDF files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable PDF Downloads</p>
                  <p className="text-sm text-muted-foreground">
                    Users can export their drafts with equations as formatted PDFs
                  </p>
                </div>
                <Switch
                  checked={flags.pdfDownload}
                  onCheckedChange={(checked) => handleFeatureToggle('pdfDownload', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Equation Editor Control */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calculator className="h-5 w-5" />
                LaTeX Equation Editor
              </CardTitle>
              <CardDescription>
                Toggle the mathematical equation editing functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Equation Editor</p>
                  <p className="text-sm text-muted-foreground">
                    Mathematical equation input with LaTeX rendering and templates
                  </p>
                </div>
                <Switch
                  checked={flags.equationEditor}
                  onCheckedChange={(checked) => handleFeatureToggle('equationEditor', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Draggable Bullets Control */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GripVertical className="h-5 w-5" />
                Draggable Bullet Points
              </CardTitle>
              <CardDescription>
                Toggle drag-and-drop functionality for outline bullets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Draggable Bullets</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to reorder outline points by dragging
                  </p>
                </div>
                <Switch
                  checked={flags.draggableBullets}
                  onCheckedChange={(checked) => handleFeatureToggle('draggableBullets', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Toggle Control */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Palette className="h-5 w-5" />
                Theme Toggle
              </CardTitle>
              <CardDescription>
                Toggle dark/light mode switching capability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Theme Toggle</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to switch between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={flags.themeToggle}
                  onCheckedChange={(checked) => handleFeatureToggle('themeToggle', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Access Control */}
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                Admin Access
              </CardTitle>
              <CardDescription>
                Control visibility of admin features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Admin Access</p>
                  <p className="text-sm text-muted-foreground">
                    Display admin controls in the main interface
                  </p>
                </div>
                <Switch
                  checked={flags.adminAccess}
                  onCheckedChange={(checked) => handleFeatureToggle('adminAccess', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reset Controls */}
          <Card className="shadow-medium border-warning/20">
            <CardHeader>
              <CardTitle>Reset Configuration</CardTitle>
              <CardDescription>
                Reset all feature flags to their default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleResetDefaults} variant="outline">
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        <Card className="shadow-medium bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Current Feature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {Object.entries(flags).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-success' : 'bg-destructive'}`} />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}