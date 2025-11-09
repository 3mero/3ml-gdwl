
"use client";

import React, { useState, useEffect } from 'react';
import type { DayData } from '@/lib/types';
import { TickerItemData } from './news-ticker';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Edit, Trash2, ChevronLeft, ChevronRight, Pin, MessageSquare, Library } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { DAY_OF_WEEK_NAMES } from '@/lib/constants';
import Link from 'next/link';


interface EventDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: TickerItemData[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  onLocate: (event: TickerItemData) => void;
  onUpdate: (date: string, data: Partial<DayData>) => void;
  onDelete: (item: TickerItemData) => void;
}

export function EventDetailDialog({
  isOpen,
  onOpenChange,
  items,
  currentIndex,
  onNavigate,
  onLocate,
  onUpdate,
  onDelete,
}: EventDetailDialogProps) {
  
  const event = items[currentIndex];
  
  const isEditable = event?.type === 'note' || event?.type === 'pin';
  const isInfo = event?.type === 'work' || event?.type === 'holiday';


  useEffect(() => {
    if (isOpen && event) {
      // Logic for when dialog opens or event changes
    }
  }, [isOpen, event]);

  if (!event) return null;
  
  const handleNavigate = (direction: 'next' | 'prev') => {
      const newIndex = direction === 'next'
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
      onNavigate(newIndex);
  }

  const dayFormatted = format(new Date(event.date), 'eeee, d MMMM yyyy', { locale: arSA });
  
  const getInfoNodeText = () => {
    if (!event.node) return null;

    try {
        const nodeChildren = (event.node as React.ReactElement)?.props?.children;
        if (!Array.isArray(nodeChildren)) return <span>{event.node}</span>;

        const badgeSpan = nodeChildren.find(child => child?.props?.className?.includes('bg-accent'));
        const textSpan = nodeChildren.find(child => child.type === 'span' && !child.props.className?.includes('bg-accent'));
        
        if (!badgeSpan || !textSpan) return <span>{event.node}</span>;

        const titleText = badgeSpan.props.children[1]?.props?.children;
        const fullTextContent = React.Children.toArray(textSpan.props.children).join('');
        
        const dayNamesRegex = new RegExp(`(${DAY_OF_WEEK_NAMES.join('|')})`, 'g');
        const parts = fullTextContent.split(dayNamesRegex);

        return (
            <p>
                <span className={cn(
                    'font-bold',
                    event.type === 'work' ? 'text-green-400' : 'text-orange-400'
                )}>
                    {titleText}:
                </span>
                <span className="mx-1">
                    {parts.map((part, index) => 
                        DAY_OF_WEEK_NAMES.includes(part) ? (
                            <span key={index} className="text-red-500">{part}</span>
                        ) : (
                            <span key={index}>{part}</span>
                        )
                    )}
                </span>
            </p>
        );
    } catch (e) {
        console.error("Failed to parse ticker node for dialog", e);
        // Fallback to render the original node if parsing fails
        return <span>{event.node}</span>;
    }
  }

  const renderEditableContent = () => {
    if (!isEditable) return null;

    const hasNote = event.data?.note && event.data.note.trim() !== '';
    const hasPin = event.data?.pinned;

    return (
      <div className="space-y-4">
        <div className="text-sm text-foreground bg-accent/30 p-3 rounded-md min-h-[100px] space-y-2">
            {event.type === 'note' && hasNote && (
              <div>
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> ملاحظة:
                </span>
                <p className="mr-5 text-yellow-400">"{event.data.note}"</p>
              </div>
            )}
             {event.type === 'pin' && hasNote && (
              <div>
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> ملاحظة:
                </span>
                <p className="mr-5 text-yellow-400">"{event.data.note}"</p>
              </div>
            )}
            {hasPin && (
              <div>
                <span className="font-bold text-red-500 flex items-center gap-1">
                  <Pin className="h-4 w-4" /> يوم مثبت
                </span>
                {!hasNote && event.type === 'pin' && (
                   <p className="mr-5 text-muted-foreground">لا توجد ملاحظة إضافية لهذا اليوم.</p>
                )}
              </div>
            )}
          </div>
      </div>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل الحدث</DialogTitle>
          <DialogDescription>{dayFormatted}</DialogDescription>
        </DialogHeader>
        
         {items.length > 1 && (
            <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="text-sm font-mono text-muted-foreground">
                    {currentIndex + 1} / {items.length}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            </div>
        )}

        <div className="py-4 space-y-4">
            {isInfo && (
                <div className="text-sm text-center font-semibold text-foreground bg-accent/30 p-4 rounded-md min-h-[60px]">
                   {getInfoNodeText()}
                </div>
            )}

            {renderEditableContent()}
        </div>

        <DialogFooter className="justify-between w-full flex-col sm:flex-row-reverse gap-y-2">
          <div className="flex gap-2">
            <DialogClose asChild>
                 <Button variant="outline">إغلاق</Button>
            </DialogClose>
          </div>

          <div className="flex gap-2">
            <Button asChild>
                <Link href="/overview">
                    <Library className="ml-2 h-4 w-4" /> عرض شامل
                </Link>
            </Button>
            <Button variant="secondary" onClick={() => onLocate(event)}>
              <MapPin className="ml-2 h-4 w-4" /> تحديد
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
