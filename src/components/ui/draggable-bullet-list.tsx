import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
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
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || !enabled) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same section
      const sectionIndex = parseInt(source.droppableId.split('-')[1]);
      const section = sections[sectionIndex];
      const newBullets = Array.from(section.bullets);
      const [reorderedBullet] = newBullets.splice(source.index, 1);
      newBullets.splice(destination.index, 0, reorderedBullet);

      const newSections = [...sections];
      newSections[sectionIndex] = {
        ...section,
        bullets: newBullets
      };
      
      onReorder(newSections);
    } else {
      // Moving between sections
      const sourceSectionIndex = parseInt(source.droppableId.split('-')[1]);
      const destSectionIndex = parseInt(destination.droppableId.split('-')[1]);
      
      const sourceSection = sections[sourceSectionIndex];
      const destSection = sections[destSectionIndex];
      
      const sourceBullets = Array.from(sourceSection.bullets);
      const destBullets = Array.from(destSection.bullets);
      
      const [movedBullet] = sourceBullets.splice(source.index, 1);
      destBullets.splice(destination.index, 0, movedBullet);
      
      const newSections = [...sections];
      newSections[sourceSectionIndex] = {
        ...sourceSection,
        bullets: sourceBullets
      };
      newSections[destSectionIndex] = {
        ...destSection,
        bullets: destBullets
      };
      
      onReorder(newSections);
    }
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
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="space-y-3">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="text-sm">
                <p className="font-semibold text-foreground mb-2">{section.title}</p>
                <Droppable droppableId={`section-${sectionIdx}`}>
                  {(provided, snapshot) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`ml-4 space-y-1 min-h-[20px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-accent/20 border-2 border-dashed border-accent' : ''
                      }`}
                    >
                      {section.bullets?.map((bullet, bulletIdx) => (
                        <Draggable
                          key={`${sectionIdx}-${bulletIdx}`}
                          draggableId={`${sectionIdx}-${bulletIdx}`}
                          index={bulletIdx}
                        >
                          {(provided, snapshot) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-2 p-1 rounded transition-all ${
                                snapshot.isDragging 
                                  ? 'bg-primary/10 shadow-lg scale-105 rotate-1' 
                                  : 'hover:bg-muted/50'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span className="text-muted-foreground">• {bullet}</span>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}