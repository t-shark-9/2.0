import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus } from "lucide-react";

interface Section {
  id: string;
  title: string;
  bullets: string[];
  order: number;
}

interface DraggableOutlineSectionsProps {
  sections: Section[];
  onUpdateSection: (id: string, field: string, value: any) => void;
  onAddBullet: (sectionId: string) => void;
  onAddSection: () => void;
  enabled?: boolean;
}

export function DraggableOutlineSections({ 
  sections, 
  onUpdateSection, 
  onAddBullet, 
  onAddSection, 
  enabled = true 
}: DraggableOutlineSectionsProps) {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedBullet, setDraggedBullet] = useState<{
    sectionId: string;
    bulletIndex: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    type: 'section' | 'bullet';
    sectionId: string;
    bulletIndex?: number;
  } | null>(null);

  // Section drag handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    if (!enabled) return;
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    if (!enabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSection && draggedSection !== sectionId) {
      setDragOverTarget({ type: 'section', sectionId });
    }
  };

  const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
    if (!enabled || !draggedSection || draggedSection === targetSectionId) return;
    e.preventDefault();
    
    const draggedIdx = sections.findIndex(s => s.id === draggedSection);
    const targetIdx = sections.findIndex(s => s.id === targetSectionId);
    
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newSections = [...sections];
      const [movedSection] = newSections.splice(draggedIdx, 1);
      newSections.splice(targetIdx, 0, movedSection);
      
      // Update order
      newSections.forEach((section, index) => {
        section.order = index;
      });
      
      onUpdateSection('reorder', 'sections', newSections);
    }
    
    setDraggedSection(null);
    setDragOverTarget(null);
  };

  // Bullet drag handlers
  const handleBulletDragStart = (e: React.DragEvent, sectionId: string, bulletIndex: number) => {
    if (!enabled) return;
    setDraggedBullet({ sectionId, bulletIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBulletDragOver = (e: React.DragEvent, sectionId: string, bulletIndex: number) => {
    if (!enabled || !draggedBullet) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedBullet.sectionId !== sectionId || draggedBullet.bulletIndex !== bulletIndex) {
      setDragOverTarget({ type: 'bullet', sectionId, bulletIndex });
    }
  };

  const handleBulletDrop = (e: React.DragEvent, targetSectionId: string, targetBulletIndex: number) => {
    if (!enabled || !draggedBullet) return;
    e.preventDefault();
    
    const { sectionId: sourceSectionId, bulletIndex: sourceBulletIndex } = draggedBullet;
    
    if (sourceSectionId === targetSectionId && sourceBulletIndex === targetBulletIndex) {
      setDraggedBullet(null);
      setDragOverTarget(null);
      return;
    }

    const sourceSection = sections.find(s => s.id === sourceSectionId);
    const targetSection = sections.find(s => s.id === targetSectionId);
    
    if (sourceSection && targetSection) {
      const sourceBullets = [...sourceSection.bullets];
      const targetBullets = [...targetSection.bullets];
      
      const [movedBullet] = sourceBullets.splice(sourceBulletIndex, 1);
      
      if (sourceSectionId === targetSectionId) {
        // Moving within same section
        sourceBullets.splice(targetBulletIndex, 0, movedBullet);
        onUpdateSection(sourceSectionId, 'bullets', sourceBullets);
      } else {
        // Moving between sections
        targetBullets.splice(targetBulletIndex, 0, movedBullet);
        onUpdateSection(sourceSectionId, 'bullets', sourceBullets);
        onUpdateSection(targetSectionId, 'bullets', targetBullets);
      }
    }
    
    setDraggedBullet(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDraggedBullet(null);
    setDragOverTarget(null);
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card 
          key={section.id} 
          className={`border-2 transition-all ${
            dragOverTarget?.type === 'section' && dragOverTarget.sectionId === section.id
              ? 'border-accent bg-accent/10'
              : 'border-border'
          } ${
            draggedSection === section.id ? 'opacity-50 scale-95' : ''
          }`}
          draggable={enabled}
          onDragStart={(e) => handleSectionDragStart(e, section.id)}
          onDragOver={(e) => handleSectionDragOver(e, section.id)}
          onDrop={(e) => handleSectionDrop(e, section.id)}
          onDragEnd={handleDragEnd}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {enabled && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />}
              <Input
                value={section.title}
                onChange={(e) => onUpdateSection(section.id, 'title', e.target.value)}
                className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
                placeholder="Section title..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {section.bullets.map((bullet, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2 transition-all ${
                  dragOverTarget?.type === 'bullet' && 
                  dragOverTarget.sectionId === section.id && 
                  dragOverTarget.bulletIndex === idx
                    ? 'bg-accent/20 border-2 border-dashed border-accent rounded'
                    : ''
                } ${
                  draggedBullet?.sectionId === section.id && 
                  draggedBullet?.bulletIndex === idx
                    ? 'opacity-50 scale-95'
                    : ''
                }`}
                draggable={enabled && bullet.trim() !== ''}
                onDragStart={(e) => handleBulletDragStart(e, section.id, idx)}
                onDragOver={(e) => handleBulletDragOver(e, section.id, idx)}
                onDrop={(e) => handleBulletDrop(e, section.id, idx)}
                onDragEnd={handleDragEnd}
              >
                {enabled && bullet.trim() && (
                  <div className="flex items-start pt-2">
                    <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                  </div>
                )}
                <span className="text-muted-foreground mt-2">•</span>
                <Textarea
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...section.bullets];
                    newBullets[idx] = e.target.value;
                    onUpdateSection(section.id, 'bullets', newBullets);
                  }}
                  placeholder="Add a key point or sub-topic..."
                  rows={2}
                  className="flex-1"
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddBullet(section.id)}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add bullet
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={onAddSection} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  );
}