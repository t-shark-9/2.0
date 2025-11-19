import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EquationEditor } from "@/components/ui/equation-editor";
import { Type } from "lucide-react";
import { InlineMath, BlockMath } from 'react-katex';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface TextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
  id: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing...", rows = 20, className = "" }: RichTextEditorProps) {
  const [isEquationEditorOpen, setIsEquationEditorOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Parse the content to identify equations
  const parseContent = (content: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    
    // Match inline equations: $equation$
    // Match block equations: $$equation$$
    const equationRegex = /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
    let match;

    while ((match = equationRegex.exec(content)) !== null) {
      // Add text before the equation
      if (match.index > currentIndex) {
        const textContent = content.slice(currentIndex, match.index);
        if (textContent) {
          segments.push({
            type: 'text',
            content: textContent,
            id: Math.random().toString(36)
          });
        }
      }

      // Add the equation
      const fullMatch = match[0];
      const isBlock = fullMatch.startsWith('$$') && fullMatch.endsWith('$$');
      const mathContent = isBlock 
        ? fullMatch.slice(2, -2) 
        : fullMatch.slice(1, -1);

      segments.push({
        type: isBlock ? 'block-math' : 'inline-math',
        content: mathContent,
        id: Math.random().toString(36)
      });

      currentIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      const remaining = content.slice(currentIndex);
      if (remaining) {
        segments.push({
          type: 'text',
          content: remaining,
          id: Math.random().toString(36)
        });
      }
    }

    // If no equations found, treat entire content as text
    if (segments.length === 0 && content) {
      segments.push({
        type: 'text',
        content: content,
        id: Math.random().toString(36)
      });
    }

    return segments;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleEquationInsert = (latex: string, isInline: boolean) => {
    const textArea = document.getElementById('draft-textarea') as HTMLTextAreaElement;
    if (!textArea) return;

    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    
    const equationWrapper = isInline ? `$${latex}$` : `$$${latex}$$`;
    const newValue = value.slice(0, start) + equationWrapper + value.slice(end);
    
    onChange(newValue);

    // Focus back to textarea after a brief delay
    setTimeout(() => {
      textArea.focus();
      const newCursorPos = start + equationWrapper.length;
      textArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 100);
  };

  const renderPreview = () => {
    const segments = parseContent(value);
    
    return (
      <div className="prose max-w-none">
        {segments.map((segment) => {
          if (segment.type === 'text') {
            return (
              <span key={segment.id} style={{ whiteSpace: 'pre-wrap' }}>
                {segment.content}
              </span>
            );
          } else if (segment.type === 'inline-math') {
            try {
              return <InlineMath key={segment.id} math={segment.content} />;
            } catch {
              return (
                <span key={segment.id} className="text-destructive bg-destructive/10 px-1 rounded">
                  ${segment.content}$ (Invalid LaTeX)
                </span>
              );
            }
          } else if (segment.type === 'block-math') {
            try {
              return (
                <div key={segment.id} className="my-4">
                  <BlockMath math={segment.content} />
                </div>
              );
            } catch {
              return (
                <div key={segment.id} className="text-destructive bg-destructive/10 p-2 rounded my-4">
                  $${segment.content}$$ (Invalid LaTeX)
                </div>
              );
            }
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const preview = document.getElementById('equation-preview');
            if (preview) {
              preview.style.display = preview.style.display === 'none' ? 'block' : 'none';
            }
          }}
        >
          <Type className="h-4 w-4" />
          Toggle Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <textarea
            id="draft-textarea"
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-serif text-base leading-relaxed"
          />
          <div className="text-xs text-muted-foreground">
            Use $equation$ for inline math, $$equation$$ for block math
          </div>
        </div>

        {/* Preview */}
        <div id="equation-preview" className="space-y-2">
          <label className="text-sm font-medium">Live Preview</label>
          <Card>
            <CardContent className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
              {value ? renderPreview() : (
                <div className="text-muted-foreground italic">
                  Preview will appear here as you type
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EquationEditor
        isOpen={isEquationEditorOpen}
        onClose={() => setIsEquationEditorOpen(false)}
        onInsert={handleEquationInsert}
      />
    </div>
  );
}