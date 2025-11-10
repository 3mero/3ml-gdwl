
"use client";

import * as React from 'react';
import { useSchedules } from '@/hooks/use-schedules';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn, formatDateKey } from '@/lib/utils';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useViewSettings, defaultViewSettings } from '@/hooks/use-view-settings';
import { Schedule } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


type InitialSetupProps = {
    isDialog?: boolean;
    onFinished?: () => void;
    existingSchedule?: Schedule | null;
}

export function InitialSetup({ isDialog = false, onFinished, existingSchedule = null }: InitialSetupProps) {
  const { addSchedule, updateSchedule, setActiveScheduleId } = useSchedules();
  const { backgroundColors, setBackgroundColors } = useViewSettings();
  const { toast } = useToast();

  const [scheduleName, setScheduleName] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const [workDays, setWorkDays] = React.useState(1);
  const [holidayDays, setHolidayDays] = React.useState(3);
  const [monthsToShow] = React.useState(12);
  
  const [workColor, setWorkColor] = React.useState(defaultViewSettings.backgroundColors.workDay);
  const [holidayColor, setHolidayColor] = React.useState(defaultViewSettings.backgroundColors.holidayDay);
  
  React.useEffect(() => {
    if (existingSchedule) {
        setScheduleName(existingSchedule.name);
        if(existingSchedule.startDate) {
            setStartDate(parseISO(existingSchedule.startDate));
        }
        // Always 12 now, so we don't need to set it from existingSchedule
        // setMonthsToShow(existingSchedule.monthsToShow); 
        
        // Note: work/holiday cycle and colors are not stored per-schedule, so we don't pre-fill them
        // They are global theme settings. We could prefill from the current theme.
        setWorkColor(backgroundColors.workDay);
        setHolidayColor(backgroundColors.holidayDay);

    } else {
        // Defaults for new schedule
        setScheduleName('');
        setStartDate(undefined);
        setWorkDays(1);
        setHolidayDays(3);
        // setMonthsToShow is already 12
        setWorkColor(backgroundColors.workDay);
        setHolidayColor(backgroundColors.holidayDay);
    }
  }, [existingSchedule, backgroundColors]);


  const handleBulkUpdate = (scheduleId: string, baseDate: Date, currentDays: Schedule['days']) => {
    const newDays = { ...currentDays };
    const cycleLength = workDays + holidayDays;
    if (cycleLength === 0) return newDays;

    const totalDaysToProcess = 365 * 20; // 10 years back, 10 years forward
    const processingStartDate = addDays(baseDate, -totalDaysToProcess / 2);

    for (let i = 0; i < totalDaysToProcess; i++) {
        const currentDate = addDays(processingStartDate, i);
        const daysDiff = differenceInDays(currentDate, baseDate);
        const dayInCycle = (daysDiff % cycleLength + cycleLength) % cycleLength;
        
        const dateKey = formatDateKey(currentDate);
        
        let dayType: 'work' | 'holiday' = dayInCycle < workDays ? 'work' : 'holiday';
        
        // Preserve notes and pins
        newDays[dateKey] = { 
            ...(newDays[dateKey] || {}), 
            type: dayType 
        };
    }
    return newDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim() || !startDate) {
        toast({
            variant: "destructive",
            title: "بيانات غير مكتملة",
            description: "الرجاء إدخال اسم للجدول وتاريخ بدء.",
        });
        return;
    }
    
    // Set the schedule-specific colors in the global theme settings
    setBackgroundColors(prev => ({
        ...prev,
        workDay: workColor,
        holidayDay: holidayColor,
    }));
    
    const startDayOfWeekValue: 0 | 1 | 6 = 0; // Default to Sunday

    if (existingSchedule) {
        // Update existing schedule
        const updatedDays = handleBulkUpdate(existingSchedule.id, startDate, existingSchedule.days);
        updateSchedule(existingSchedule.id, {
            name: scheduleName.trim(),
            startDate: formatDateKey(startDate),
            monthsToShow: monthsToShow,
            startDayOfWeek: startDayOfWeekValue,
            days: updatedDays
        });
        toast({ title: "تم تحديث الجدول بنجاح!" });
    } else {
        // Create new schedule
        const newSchedule = addSchedule(
          scheduleName.trim(), 
          startDayOfWeekValue,
          monthsToShow,
          formatDateKey(startDate)
        );
        const updatedDays = handleBulkUpdate(newSchedule.id, startDate, newSchedule.days);
        updateSchedule(newSchedule.id, { days: updatedDays });
        setActiveScheduleId(newSchedule.id);
        toast({ title: "تم إنشاء الجدول بنجاح!" });
    }

    if (onFinished) {
        onFinished();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setIsCalendarOpen(false);
  };

  const cardContent = (
      <>
          <CardHeader className={cn(isDialog && "hidden")}>
            <CardTitle className="text-2xl font-bold text-primary">إنشاء جدول جديد</CardTitle>
            <CardDescription>
              أدخل تفاصيل جدولك الجديد. يتم تخزين جميع البيانات محليًا على جهازك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-right max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-2">
              <Label htmlFor="schedule-name">اسم الجدول</Label>
              <Input
                id="schedule-name"
                placeholder="مثال: جدول أعمالي"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">تاريخ بدء الدورة</Label>
               <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: arSA }) : <span>اختر تاريخًا</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" dir="rtl">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={arSA}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="work-days">أيام العمل المتتالية</Label>
                    <Input id="work-days" type="number" value={workDays} onChange={e => setWorkDays(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="holiday-days">أيام الإجازة المتتالية</Label>
                    <Input id="holiday-days" type="number" value={holidayDays} onChange={e => setHolidayDays(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="work-color">لون يوم العمل</Label>
                    <Input id="work-color" type="color" value={workColor} onChange={(e) => setWorkColor(e.target.value)} className="p-1 h-10" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="holiday-color">لون يوم الإجازة</Label>
                    <Input id="holiday-color" type="color" value={holidayColor} onChange={(e) => setHolidayColor(e.target.value)} className="p-1 h-10" />
                  </div>
                </div>

                {/* The months to show input is now hidden as it defaults to 12 */}
              </div>
          </CardContent>
          <CardFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-0">
            {isDialog && <Button variant="outline" type="button" onClick={onFinished}>إلغاء</Button>}
            <Button type="submit" className="w-full sm:w-auto" disabled={!scheduleName.trim() || !startDate}>
              {existingSchedule ? 'حفظ التعديلات' : 'إنشاء وتطبيق الإعدادات'}
            </Button>
          </CardFooter>
      </>
  );

  if (isDialog) {
    return <form onSubmit={handleSubmit} className="flex flex-col">{cardContent}</form>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl">
        <form onSubmit={handleSubmit}>
            {cardContent}
        </form>
      </Card>
    </div>
  );
}
