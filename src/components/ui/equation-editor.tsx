import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X, Calculator, Sigma } from "lucide-react";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface EquationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string, isInline: boolean) => void;
  selectedText?: string;
}

const commonEquations = {
  "Fractions": [
    { name: "Simple Fraction", latex: "\\frac{a}{b}", preview: "a/b" },
    { name: "Complex Fraction", latex: "\\frac{x^2 + 1}{x - 1}", preview: "(x² + 1)/(x - 1)" },
  ],
  "Powers & Roots": [
    { name: "Power", latex: "x^{n}", preview: "xⁿ" },
    { name: "Square Root", latex: "\\sqrt{x}", preview: "√x" },
    { name: "Nth Root", latex: "\\sqrt[n]{x}", preview: "ⁿ√x" },
  ],
  "Greek Letters": [
    { name: "Alpha", latex: "\\alpha", preview: "α" },
    { name: "Beta", latex: "\\beta", preview: "β" },
    { name: "Gamma", latex: "\\gamma", preview: "γ" },
    { name: "Delta", latex: "\\delta", preview: "δ" },
    { name: "Theta", latex: "\\theta", preview: "θ" },
    { name: "Pi", latex: "\\pi", preview: "π" },
    { name: "Sigma", latex: "\\sigma", preview: "σ" },
    { name: "Omega", latex: "\\omega", preview: "ω" },
  ],
  "Math Operators": [
    { name: "Plus/Minus", latex: "\\pm", preview: "±" },
    { name: "Times", latex: "\\times", preview: "×" },
    { name: "Division", latex: "\\div", preview: "÷" },
    { name: "Not Equal", latex: "\\neq", preview: "≠" },
    { name: "Less/Equal", latex: "\\leq", preview: "≤" },
    { name: "Greater/Equal", latex: "\\geq", preview: "≥" },
    { name: "Infinity", latex: "\\infty", preview: "∞" },
  ],
  "Physics": [
    { name: "Vector", latex: "\\vec{v}", preview: "v⃗" },
    { name: "Force Equation", latex: "F = ma", preview: "F = ma" },
    { name: "Energy", latex: "E = mc^2", preview: "E = mc²" },
    { name: "Velocity", latex: "v = \\frac{\\Delta x}{\\Delta t}", preview: "v = Δx/Δt" },
  ],
  "Common Formulas": [
    { name: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", preview: "Quadratic formula" },
    { name: "Pythagorean", latex: "a^2 + b^2 = c^2", preview: "a² + b² = c²" },
    { name: "Area of Circle", latex: "A = \\pi r^2", preview: "A = πr²" },
    { name: "Derivative", latex: "\\frac{d}{dx}f(x)", preview: "d/dx f(x)" },
    { name: "Integral", latex: "\\int f(x) dx", preview: "∫ f(x) dx" },
  ]
};

export function EquationEditor({ isOpen, onClose, onInsert, selectedText }: EquationEditorProps) {
  const [latex, setLatex] = useState(selectedText || "");
  const [isInline, setIsInline] = useState(true);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (selectedText) {
      setLatex(selectedText);
    }
  }, [selectedText]);

  const insertTemplate = (template: string) => {
    setLatex(prev => prev + template);
  };

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex, isInline);
      setLatex("");
      onClose();
    }
  };

  const renderPreview = () => {
    try {
      setPreviewError("");
      if (!latex.trim()) return <span className="text-muted-foreground italic">Preview will appear here</span>;
      
      if (isInline) {
        return <InlineMath math={latex} />;
      } else {
        return <BlockMath math={latex} />;
      }
    } catch (error) {
      setPreviewError("Invalid LaTeX syntax");
      return <span className="text-destructive">Invalid LaTeX syntax</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Equation Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Panel - Input and Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">LaTeX Input</label>
              <Input
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                placeholder="Enter LaTeX equation (e.g., x^2 + 1)"
                className="font-mono"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isInline ? "default" : "outline"}
                  onClick={() => setIsInline(true)}
                >
                  Inline
                </Button>
                <Button
                  size="sm"
                  variant={!isInline ? "default" : "outline"}
                  onClick={() => setIsInline(false)}
                >
                  Block
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/30 min-h-[60px] flex items-center justify-center">
                  {renderPreview()}
                </div>
                {previewError && (
                  <p className="text-sm text-destructive mt-2">{previewError}</p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleInsert} disabled={!latex.trim() || !!previewError}>
                Insert Equation
              </Button>
            </div>
          </div>

          {/* Right Panel - Templates */}
          <div className="overflow-y-auto max-h-[500px] space-y-4">
            <h3 className="font-medium text-sm">Quick Insert Templates</h3>
            
            {Object.entries(commonEquations).map(([category, equations]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {equations.map((eq, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        onClick={() => insertTemplate(eq.latex)}
                        className="justify-start h-auto p-2"
                      >
                        <div className="text-left">
                          <div className="font-medium text-xs">{eq.name}</div>
                          <div className="text-muted-foreground text-xs font-mono">
                            {eq.latex}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EquationButton({ onEquationInsert }: { onEquationInsert: (latex: string, isInline: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sigma className="h-4 w-4" />
        Equation
      </Button>
      
      <EquationEditor
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onInsert={onEquationInsert}
      />
    </>
  );
}