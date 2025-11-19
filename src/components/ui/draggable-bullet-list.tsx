import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface DraggableBulletListProps {
  sections: Array<{
    title: string;
    bullets: string[];
    order?: number;
  }>;
  onReorder: (newSections: Array<{ title: string; bullets: string[]; order?: number }>) => void;
  enabled?: boolean;
}

export function DraggableBulletList({ sections, onReorder, enabled = true }: DraggableBulletListProps) {
  const [draggedItem, setDraggedItem] = useState<{
    sectionIndex: number;
    bulletIndex: number;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    sectionIndex: number;
    bulletIndex: number;
  } | null>(null);

  const handleDragStart = (e: React.DragEvent, sectionIndex: number, bulletIndex: number) => {
    if (!enabled) return;
    setDraggedItem({ sectionIndex, bulletIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, sectionIndex: number, bulletIndex: number) => {
    if (!enabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ sectionIndex, bulletIndex });
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetSectionIndex: number, targetBulletIndex: number) => {
    if (!enabled || !draggedItem) return;
    e.preventDefault();

    const { sectionIndex: sourceSectionIndex, bulletIndex: sourceBulletIndex } = draggedItem;
    
    if (sourceSectionIndex === targetSectionIndex && sourceBulletIndex === targetBulletIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newSections = [...sections];
    
    // Remove the dragged item
    const [movedBullet] = newSections[sourceSectionIndex].bullets.splice(sourceBulletIndex, 1);
    
    // Insert at the new position
    newSections[targetSectionIndex].bullets.splice(targetBulletIndex, 0, movedBullet);
    
    onReorder(newSections);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  if (!enabled) {
    // Static version when dragging is disabled
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-lg">Your Outline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section, idx) => (
              <div key={idx} className="text-sm">
                <p className="font-semibold text-foreground">{section.title}</p>
                <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                  {section.bullets?.map((bullet, bidx) => (
                    <li key={bidx}>• {bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Your Outline (Draggable)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="text-sm">
              <p className="font-semibold text-foreground mb-2">{section.title}</p>
              <ul className="ml-4 space-y-1 min-h-[20px]">
                {section.bullets?.map((bullet, bulletIdx) => (
                  <li
                    key={`${sectionIdx}-${bulletIdx}`}
                    draggable={enabled}
                    onDragStart={(e) => handleDragStart(e, sectionIdx, bulletIdx)}
                    onDragOver={(e) => handleDragOver(e, sectionIdx, bulletIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, sectionIdx, bulletIdx)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-2 p-2 rounded transition-all cursor-move
                      ${draggedItem?.sectionIndex === sectionIdx && draggedItem?.bulletIndex === bulletIdx 
                        ? 'opacity-50 scale-95' 
                        : ''
                      }
                      ${dragOverItem?.sectionIndex === sectionIdx && dragOverItem?.bulletIndex === bulletIdx 
                        ? 'bg-accent/20 border-2 border-dashed border-accent' 
                        : 'hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">• {bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}