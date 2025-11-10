
"use client";

import React, { useState, useEffect } from 'react';
import { generateMonthMatrix, formatDateKey, cn } from '@/lib/utils';
import { MONTH_NAMES, DAY_OF_WEEK_NAMES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { DayCell } from './day-cell';
import { eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameYear, getMonth, getYear, format, getDay, isBefore } from 'date-fns';
import { Schedule } from '@/lib/types';
import { Button } from './ui/button';
import { Paintbrush } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { useSchedules } from '@/hooks/use-schedules';
import { useViewSettings } from '@/hooks/use-view-settings';


type CalendarMonthProps = {
  month: Date;
  currentDate: Date;
  activeSchedule: Schedule;
  monthKey: string;
  isHighlighted?: boolean;
  highlightedDays?: string[];
};

export function CalendarMonth({ month, currentDate, activeSchedule, monthKey, isHighlighted = false, highlightedDays }: CalendarMonthProps) {
  const { updateSchedule } = useSchedules();
  const { backgroundColors } = useViewSettings();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  const savedBackgroundColor = activeSchedule.monthBackgrounds?.[monthKey] || '';
  const [tempBackgroundColor, setTempBackgroundColor] = useState(savedBackgroundColor);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    // When the popover opens, or if the saved color changes from elsewhere,
    // reset the temporary color to match the currently saved one.
    setTempBackgroundColor(savedBackgroundColor);
  }, [savedBackgroundColor, isColorPickerOpen]);


  const scheduleStartDate = activeSchedule.startDate ? new Date(activeSchedule.startDate) : null;
  const year = getYear(month);
  const monthIndex = getMonth(month);
  const startDay = activeSchedule.startDayOfWeek;

  const weeks = generateMonthMatrix(year, monthIndex, startDay);
  const dayHeaders = [...DAY_OF_WEEK_NAMES.slice(startDay), ...DAY_OF_WEEK_NAMES.slice(0, startDay)];
  const dayIndices = [...Array(7).keys()].map(i => (i + startDay) % 7);


  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const summary = daysInMonth.reduce((acc, day) => {
      const dateKey = formatDateKey(day);
      const dayData = activeSchedule.days[dateKey];
      if (dayData) {
          if (dayData.type === 'work') acc.work++;
          if (dayData.type === 'holiday') acc.holiday++;
      }
      return acc;
  }, { work: 0, holiday: 0 });

  const isCurrentMonth = isSameMonth(month, currentDate) && isSameYear(month, currentDate);
  const isPastMonth = isBefore(monthEnd, currentDate) && !isSameMonth(monthEnd, currentDate);

  const handleSaveColor = () => {
    const newBackgrounds = { ...(activeSchedule.monthBackgrounds || {}) };

    if (applyToAll) {
      const visibleYear = getYear(month);
      const yearMonths = Array.from({ length: 12 }, (_, i) => format(new Date(visibleYear, i, 1), 'yyyy-MM'));
      yearMonths.forEach(key => {
        newBackgrounds[key] = tempBackgroundColor;
      });
    } else {
      if (!tempBackgroundColor) {
        delete newBackgrounds[monthKey];
      } else {
        newBackgrounds[monthKey] = tempBackgroundColor;
      }
    }
    updateSchedule(activeSchedule.id, { monthBackgrounds: newBackgrounds });
    setIsColorPickerOpen(false);
  };
  
  const cardStyle = {
    backgroundColor: isColorPickerOpen ? tempBackgroundColor : savedBackgroundColor,
  };


  const handleResetColor = () => {
    // Clear temp color for immediate visual feedback
    setTempBackgroundColor(''); 
    
    const newBackgrounds = { ...(activeSchedule.monthBackgrounds || {}) };
    if (applyToAll) {
      const visibleYear = getYear(month);
      const yearMonths = Array.from({ length: 12 }, (_, i) => format(new Date(visibleYear, i, 1), 'yyyy-MM'));
      yearMonths.forEach(key => {
        delete newBackgrounds[key];
      });
    } else {
      delete newBackgrounds[monthKey];
    }
    
    updateSchedule(activeSchedule.id, { monthBackgrounds: newBackgrounds });
    setIsColorPickerOpen(false);
  };


  return (
    <>
      <Card 
        style={cardStyle}
        className={cn(
          "flex flex-col transition-all duration-300",
          isCurrentMonth && "border-primary/50",
          isHighlighted && "animate-flash border-2 border-transparent"
        )}>
        <CardHeader className="relative pb-2">
          {isPastMonth && <div className="absolute top-0 left-0 right-0 text-center text-xs text-muted-foreground bg-accent/30 rounded-t-md py-0.5">شهر منقضٍ</div>}
          <div className={cn("absolute top-2 left-3 text-xs font-mono", isPastMonth && "top-6")} style={{color: backgroundColors.monthNumber}}>{monthIndex + 1}</div>
           <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
              <PopoverTrigger asChild>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:text-foreground", isPastMonth && "top-5")}
                    aria-label="Change month background"
                  >
                    <Paintbrush className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" dir="rtl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                      <Label htmlFor="bg-color" className="text-right">
                          اللون
                      </Label>
                      <Input
                          id="bg-color"
                          type="color"
                          value={tempBackgroundColor}
                          onChange={(e) => setTempBackgroundColor(e.target.value)}
                          className="p-1 h-10 w-full"
                      />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox id="apply-to-all" checked={applyToAll} onCheckedChange={(checked) => setApplyToAll(!!checked)} />
                      <Label htmlFor="apply-to-all">تطبيق على كل أشهر السنة</Label>
                  </div>
                  <div className="flex justify-between items-center gap-2 mt-2">
                     <Button variant="ghost" size="sm" onClick={handleResetColor}>إعادة تعيين</Button>
                     <Button size="sm" onClick={handleSaveColor}>حفظ</Button>
                  </div>
                </div>
              </PopoverContent>
           </Popover>

            <div className={cn("flex justify-center items-center h-8 rounded-md border p-1 text-center font-semibold", isPastMonth && "mt-4")} style={{color: backgroundColors.monthName, backgroundColor: backgroundColors.monthHeaderBackground}}>
                <span>{MONTH_NAMES[monthIndex]} </span>
                <span className={cn("ml-2", getYear(month) > getYear(new Date()) && "text-destructive")}>{year}</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-2">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2 xl:gap-2">
            {dayHeaders.map((day, index) => {
              const dayIndex = dayIndices[index];
              const isWeekend = dayIndex === 5 || dayIndex === 6; // Friday or Saturday
              return (
                <div key={day} className={cn(
                  "flex h-8 items-center justify-center rounded-md border bg-accent/50 p-1 text-[10px] sm:text-xs",
                   isWeekend ? "text-green-400" : "text-foreground"
                )}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 grid-rows-6 gap-1 xl:gap-2">
            {weeks.flat().map((day, index) => (
              <DayCell 
                key={day ? day.toISOString() : `empty-${index}`} 
                day={day} 
                currentDate={currentDate}
                isHighlighted={day ? highlightedDays?.includes(formatDateKey(day)) : false}
              />
            ))}
          </div>
        </CardContent>
        {(summary.work > 0 || summary.holiday > 0) && (
          <CardFooter className="justify-center gap-4 border-t p-3 pt-2 text-sm text-muted-foreground">
              <div>أيام العمل: <span className="font-semibold" style={{ color: backgroundColors.workDay }}>{summary.work}</span></div>
              <div>أيام الإجازة: <span className="font-semibold" style={{ color: backgroundColors.holidayDay }}>{summary.holiday}</span></div>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
