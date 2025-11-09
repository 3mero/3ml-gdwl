
"use client";

import React, { useRef, useState } from 'react';
import { useSchedules } from '@/hooks/use-schedules';
import { cn, formatDateKey } from '@/lib/utils';
import { DayType } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Pin, MessageSquare, Edit2, Check, X, Trash2 } from 'lucide-react';
import { getDay, isSameDay } from 'date-fns';
import { DayDetailDialog } from './day-detail-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewSettings } from '@/hooks/use-view-settings';
import { useIsMobile } from '@/hooks/use-mobile';


type DayCellProps = {
  day: Date | null;
  currentDate: Date;
  isHighlighted?: boolean;
};

export function DayCell({ day, currentDate, isHighlighted }: DayCellProps) {
  const { activeSchedule, updateDay } = useSchedules();
  const { backgroundColors } = useViewSettings();
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const pressTimer = useRef<NodeJS.Timeout>();

  if (!day) {
    return <div className="aspect-square rounded-md border" />;
  }

  const dateKey = formatDateKey(day);
  const dayData = activeSchedule?.days[dateKey];
  const dayOfWeek = getDay(day);
  
  const handleSetType = (type: DayType) => {
    updateDay(dateKey, { type: type });
  };
  
  const handleTogglePin = () => {
    updateDay(dateKey, { pinned: !dayData?.pinned });
  };

  const handleSaveDetails = (note: string, pinned: boolean) => {
    updateDay(dateKey, { note, pinned });
  };
  
  const handleClearData = () => {
    // Only clears note and pin, preserves the type ('work' or 'holiday')
    updateDay(dateKey, { note: undefined, pinned: false });
  };

  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  const isCurrentDay = isSameDay(day, currentDate);

  const getBackgroundColor = () => {
    if (dayData?.type === 'work') return backgroundColors.workDay;
    if (dayData?.type === 'holiday') return backgroundColors.holidayDay;
    return 'transparent';
  };
  
  const cellStyle = {
    backgroundColor: getBackgroundColor(),
  };

  const getDayNumberColor = () => {
    if (dayData?.type === 'work' || dayData?.type === 'holiday') {
        // Use a high-contrast color for readability on colored backgrounds
        return 'hsl(var(--primary-foreground))';
    }
    if (isWeekend && (!dayData || dayData.type === 'default')) {
        return 'rgb(52 211 153)'; // Tailwind's green-400
    }
    // Fallback to the user-defined or default day number color
    return backgroundColors.dayNumber;
  }
  
  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
        setIsMenuOpen(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
        clearTimeout(pressTimer.current);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
      if (isMobile) {
          e.preventDefault();
          setIsMenuOpen(true);
      }
  };

  const cellContent = (
    <div
      style={cellStyle}
      className={cn(
        "relative flex aspect-square cursor-pointer items-center justify-center rounded-md border border-transparent transition-all duration-200 select-none",
        isCurrentDay && 'border-red-500 ring-2 ring-red-500',
        isHighlighted && "animate-flash border-2 border-transparent"
      )}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onContextMenu={handleContextMenu}
    >
      <span className="text-sm font-bold" style={{ color: getDayNumberColor() }}>{day.getDate()}</span>
      {dayData?.pinned && (
        <Pin className="absolute top-1 right-1 h-3 w-3 fill-red-500 text-red-500" />
      )}
      {dayData?.note && (
        <MessageSquare className="absolute bottom-1 left-1 h-3 w-3 fill-accent text-transparent" />
      )}
    </div>
  );

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild disabled={isMobile}>
                    <div className="w-full h-full">{cellContent}</div>
                </DropdownMenuTrigger>
            </TooltipTrigger>
            {dayData?.note && <TooltipContent><p>{dayData.note}</p></TooltipContent>}
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="w-48" dir="rtl" align="end">
          <DropdownMenuItem onSelect={() => setIsDetailOpen(true)}>
            <Edit2 className="ml-2 h-4 w-4" />
            <span>تعديل التفاصيل</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleTogglePin}>
            <Pin className="ml-2 h-4 w-4" />
            <span>{dayData?.pinned ? 'إلغاء تثبيت اليوم' : 'تثبيت هذا اليوم'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => handleSetType('work')}>
            <Check className="ml-2 h-4 w-4" />
            <span>تعيين "عمل"</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSetType('holiday')}>
            <X className="ml-2 h-4 w-4" />
            <span>تعيين "إجازة"</span>
          </DropdownMenuItem>
          {dayData && (dayData.note || dayData.pinned) && <DropdownMenuSeparator />}
          {dayData && (dayData.note || dayData.pinned) &&
            <DropdownMenuItem onSelect={handleClearData} className="text-destructive">
              <Trash2 className="ml-2 h-4 w-4" />
              <span>مسح البيانات (ملاحظة ودبوس)</span>
            </DropdownMenuItem>
          }
        </DropdownMenuContent>
      </DropdownMenu>

      <DayDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        day={day}
        dayData={dayData}
        onSave={handleSaveDetails}
      />
    </>
  );
}
