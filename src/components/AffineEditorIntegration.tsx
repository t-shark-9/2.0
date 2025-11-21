/**
 * AFFiNE Editor Integration Component
 * 
 * This component provides a bridge between your IBDP app and AFFiNE's
 * rich editing experience. It uses Lovable AI for AI-powered features.
 * 
 * Usage:
 * <AffineEditorIntegration 
 *   content={content}
 *   onChange={setContent}
 *   onSave={handleSave}
 *   enableAI={true}
 * />
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AffineEditorIntegrationProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  enableAI?: boolean;
  subject?: string;
  rubric?: any[];
}

/**
 * This is a placeholder component that shows how to integrate AFFiNE.
 * 
 * IMPLEMENTATION OPTIONS:
 * 
 * 1. IFRAME APPROACH (Easiest):
 *    - Embed AFFiNE running on localhost:8080
 *    - Use postMessage for communication
 *    - Quick to implement but limited control
 * 
 * 2. BLOCKSUITE DIRECT (Recommended):
 *    - Install @blocksuite/affine packages
 *    - Import and use BlockSuite editor directly
 *    - Full control and customization
 * 
 * 3. API ONLY (Minimal):
 *    - Keep your current editor
 *    - Use Lovable AI API for AI features only
 *    - Maintains your existing UX
 */
export default function AffineEditorIntegration({
  content,
  onChange,
  onSave,
  enableAI = true,
  subject,
  rubric,
}: AffineEditorIntegrationProps) {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor
  useEffect(() => {
    // TODO: Initialize BlockSuite editor here when installed
    // For now, this is a placeholder showing the structure
    console.log("Editor would initialize here with content:", content);
  }, []);

  const handleAIAssist = async () => {
    if (!enableAI) {
      toast.error("AI features are disabled");
      return;
    }

    setIsAIProcessing(true);
    
    try {
      // Call Lovable AI for assistance
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          subject,
          rubric,
          action: 'improve'
        })
      });

      if (!response.ok) throw new Error('AI request failed');
      
      const result = await response.json();
      onChange(result.improvedContent);
      toast.success("Content improved by AI!");
      
    } catch (error: any) {
      console.error("AI assist error:", error);
      toast.error(error.message || "AI assist failed");
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Container */}
      <div 
        ref={editorRef}
        className="min-h-[600px] border rounded-lg p-4 bg-white"
        style={{
          // AFFiNE editor styling
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* 
          IMPLEMENTATION NOTE:
          
          To use the full AFFiNE editor, install these packages:
          npm install @blocksuite/affine @blocksuite/editor
          
          Then import and initialize:
          import { createEditor } from '@blocksuite/editor';
          
          const editor = createEditor({
            container: editorRef.current,
            initialContent: content,
            onChange: onChange,
          });
          
          For now, we'll show a placeholder:
        */}
        <div className="text-center py-12 text-muted-foreground">
          <h3 className="text-lg font-semibold mb-2">AFFiNE Editor Placeholder</h3>
          <p className="text-sm mb-4">
            To enable the full AFFiNE editing experience:
          </p>
          <ol className="text-left max-w-md mx-auto space-y-2 text-sm">
            <li>1. Install BlockSuite packages (see AFFINE-IBDP-INTEGRATION.md)</li>
            <li>2. Import and initialize the editor</li>
            <li>3. Connect to Lovable AI for AI features</li>
          </ol>
          
          <div className="mt-8 p-4 bg-accent/10 rounded-lg max-w-md mx-auto">
            <p className="text-xs">
              <strong>Current Setup:</strong> Using your existing RichTextEditor with
              Lovable AI integration for evaluation and improvements.
            </p>
          </div>
        </div>
      </div>

      {/* AI Features */}
      {enableAI && (
        <div className="flex gap-2">
          <Button
            onClick={handleAIAssist}
            disabled={isAIProcessing}
            variant="outline"
            size="sm"
          >
            {isAIProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Improve
              </>
            )}
          </Button>
          
          {onSave && (
            <Button onClick={onSave} size="sm">
              Save
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * QUICK IFRAME IMPLEMENTATION
 * 
 * If you want to quickly embed AFFiNE while it's running, use this:
 */
export function AffineIframeEmbed({ height = "800px" }: { height?: string }) {
  useEffect(() => {
    // Listen for messages from AFFiNE iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "http://localhost:8080") return;
      
      console.log("Message from AFFiNE:", event.data);
      
      // Handle different message types
      switch (event.data.type) {
        case 'content-changed':
          // Update your local state
          break;
        case 'save-requested':
          // Trigger save in your app
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="w-full rounded-lg overflow-hidden border">
      <iframe
        src="http://localhost:8080"
        width="100%"
        height={height}
        style={{ border: "none" }}
        title="AFFiNE Editor"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}
