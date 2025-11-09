
"use client";

import React, { useState, useEffect } from 'react';
import type { DayData } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  day: Date | null;
  dayData: DayData | undefined;
  onSave: (note: string, pinned: boolean) => void;
}

export function DayDetailDialog({
  isOpen,
  onOpenChange,
  day,
  dayData,
  onSave,
}: DayDetailDialogProps) {
  const [note, setNote] = useState('');
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote(dayData?.note || '');
      setPinned(dayData?.pinned || false);
    }
  }, [isOpen, dayData]);

  if (!day) return null;

  const handleSave = () => {
    onSave(note, pinned);
    onOpenChange(false);
  };
  
  const dayFormatted = day.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تفاصيل اليوم</DialogTitle>
          <DialogDescription>{dayFormatted}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">ملاحظة</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="إضافة ملاحظة لهذا اليوم..."
              rows={4}
              dir="rtl"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="pinned"
              checked={pinned}
              onCheckedChange={setPinned}
            />
            <Label htmlFor="pinned">تثبيت هذا اليوم</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSave}>حفظ التغييرات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
