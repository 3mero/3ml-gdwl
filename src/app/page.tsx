

"use client";

import * as React from 'react';
import { useSchedules } from '@/hooks/use-schedules';
import { useViewSettings } from '@/hooks/use-view-settings';
import { AppHeader } from '@/components/app-header';
import { InitialSetup } from '@/components/initial-setup';
import { CalendarMonth } from '@/components/calendar-month';
import { NewsTicker, TickerItemData } from '@/components/news-ticker';
import { addYears, subYears, format, isSameYear, startOfYear, getYear, getMonth, parseISO, isAfter, startOfToday, differenceInDays, subMonths, endOfYear, isBefore, isToday, isTomorrow, isSameDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Briefcase, Coffee, MessageSquare, Pin, Settings, Undo2, Smartphone, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Schedule, DayData } from '@/lib/types';
import { ScheduleManager } from '@/components/schedule-manager';
import { useHighlight } from '@/hooks/use-highlight';
import { EventDetailDialog } from '@/components/event-detail-dialog';
import { OfficialHolidaysDialog } from '@/components/official-holidays-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";


const generateTickerItems = (schedule: Schedule | null, today: Date): TickerItemData[] => {
    if (!schedule) return [];

    const items: TickerItemData[] = [];
    const todayStart = startOfToday();
    
    const sortedDays = Object.keys(schedule.days).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Find next work day and calculate days remaining
    let nextWorkDay: Date | null = null;
    const futureWorkDays = sortedDays.filter(dayKey => {
      const dayDate = parseISO(dayKey);
      return (isSameDay(dayDate, todayStart) || isAfter(dayDate, todayStart)) && schedule.days[dayKey]?.type === 'work';
    });

    if (futureWorkDays.length > 0) {
        nextWorkDay = parseISO(futureWorkDays[0]);
    }

    if (nextWorkDay) {
        const daysRemaining = differenceInDays(nextWorkDay, todayStart);
        items.push({
            id: `work-${format(nextWorkDay, 'yyyy-MM-dd')}`,
            date: nextWorkDay.toISOString(),
            type: 'work',
            relatedDays: [format(nextWorkDay, 'yyyy-MM-dd')],
            node: (
                <div className="flex items-center gap-2" dir="rtl">
                    <span className="bg-accent/50 text-foreground font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        <Briefcase className="h-4 w-4 text-green-400" />
                        <span>عملك التالي</span>
                    </span>
                    <span>
                        يوم {format(nextWorkDay, 'eeee, d MMMM yyyy', { locale: arSA })} (يتبقى {daysRemaining} أيام)
                    </span>
                </div>
            )
        });
    }
    
    // Find next consecutive holidays, starting from today or in the future
    let nextHolidayStreak: Date[] = [];
    const futureDays = sortedDays.filter(dayKey => isSameDay(parseISO(dayKey), todayStart) || isAfter(parseISO(dayKey), todayStart));
    
    let firstHolidayIndex = -1;
    for (let i = 0; i < futureDays.length; i++) {
        if (schedule.days[futureDays[i]]?.type === 'holiday') {
            firstHolidayIndex = i;
            break;
        }
    }

    if (firstHolidayIndex !== -1) {
        const firstHolidayDate = parseISO(futureDays[firstHolidayIndex]);
        nextHolidayStreak.push(firstHolidayDate);

        for (let i = firstHolidayIndex + 1; i < futureDays.length; i++) {
            const currentKey = futureDays[i];
            const currentDate = parseISO(currentKey);
            const prevDate = nextHolidayStreak[nextHolidayStreak.length - 1];

            if (differenceInDays(currentDate, prevDate) === 1 && schedule.days[currentKey]?.type === 'holiday') {
                nextHolidayStreak.push(currentDate);
            } else {
                break; // Streak broken
            }
        }
    }


    if (nextHolidayStreak.length > 0) {
        const streakStartDate = nextHolidayStreak[0];
        const streakEndDate = nextHolidayStreak[nextHolidayStreak.length - 1];
        const remainingDaysInStreak = nextHolidayStreak.filter(d => isSameDay(d, todayStart) || isAfter(d, todayStart)).length;

        let holidayText;

        if (nextHolidayStreak.length > 6) {
            const startFormatted = format(streakStartDate, 'd MMMM', { locale: arSA });
            const endFormatted = format(streakEndDate, 'd MMMM', { locale: arSA });
            holidayText = `من ${startFormatted} إلى ${endFormatted}`;
        } else {
            const dayFormatter = (date: Date) => {
                if (isToday(date)) return `اليوم (${format(date, 'eeee', { locale: arSA })})`;
                if (isTomorrow(date)) return `غداً (${format(date, 'eeee', { locale: arSA })})`;
                const diff = differenceInDays(date, todayStart);
                if (diff === 2) return `بعد غد (${format(date, 'eeee', { locale: arSA })})`;
                return format(date, 'eeee, d MMMM', { locale: arSA });
            };
            holidayText = nextHolidayStreak.map(dayFormatter).join('، ');
        }
        
        const remainingText = `(يتبقى ${remainingDaysInStreak} ${remainingDaysInStreak > 2 ? 'أيام' : 'يوم'})`;

        items.push({
            id: `holiday-${format(streakStartDate, 'yyyy-MM-dd')}`,
            date: streakStartDate.toISOString(),
            type: 'holiday',
            relatedDays: nextHolidayStreak.map(d => format(d, 'yyyy-MM-dd')),
            node: (
                <div className="flex items-center gap-2" dir="rtl">
                    <span className="bg-accent/50 text-foreground font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        <Coffee className="h-4 w-4 text-orange-400" />
                        <span>إجازتك التالية</span>
                    </span>
                    <span>{holidayText} {remainingText}</span>
                </div>
            )
        });
    }

    const allDaysWithData = sortedDays
        .map(key => ({ key, data: schedule.days[key], date: parseISO(key) }));

    const pinnedEvents = allDaysWithData.filter(event => event.data.pinned);
    const noteEvents = allDaysWithData.filter(event => event.data.note && event.data.note.trim() !== '');

    const eventSorter = (a: {date: Date}, b: {date: Date}) => {
        const diffA = differenceInDays(a.date, todayStart);
        const diffB = differenceInDays(b.date, todayStart);
        if (diffA >= 0 && diffB >= 0) return diffA - diffB; // Future events, closer first
        if (diffA < 0 && diffB < 0) return diffB - diffA; // Past events, closer first
        if (diffA >= 0 && diffB < 0) return -1; // Future before past
        if (diffA < 0 && diffB >= 0) return 1;  // Future before past
        return 0;
    };
    
    pinnedEvents.sort(eventSorter).forEach(event => {
        const daysDiff = differenceInDays(event.date, todayStart);
        let timeText: string;
        if (daysDiff > 0) timeText = `(يتبقى ${daysDiff} أيام)`;
        else if (daysDiff < 0) timeText = `(قبل ${Math.abs(daysDiff)} أيام)`;
        else timeText = "(اليوم)";

        items.push({
            id: `pin-${event.key}`,
            date: event.date.toISOString(),
            type: 'pin',
            data: event.data,
            relatedDays: [event.key],
            node: (
                <div className="flex items-center gap-2" dir="rtl">
                    <span className="bg-accent/50 text-foreground font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                         <Pin className="h-4 w-4 text-red-500 fill-red-500" />
                        <span>يوم مثبت</span>
                    </span>
                    <span>
                       {format(event.date, 'eeee, d MMMM yyyy', { locale: arSA })} {timeText}
                    </span>
                </div>
            )
        });
    });

    noteEvents.sort(eventSorter).forEach(event => {
        const daysDiff = differenceInDays(event.date, todayStart);
        let timeText: string;
        if (daysDiff > 0) timeText = `(يتبقى ${daysDiff} أيام)`;
        else if (daysDiff < 0) timeText = `(قبل ${Math.abs(daysDiff)} أيام)`;
        else timeText = "(اليوم)";

        items.push({
            id: `note-${event.key}`,
            date: event.date.toISOString(),
            type: 'note',
            data: event.data,
            relatedDays: [event.key],
            node: (
                <div className="flex items-center gap-2" dir="rtl">
                    <span className="bg-accent/50 text-foreground font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <span>ملاحظة:</span>
                    </span>
                    <span className="font-semibold text-yellow-400 mx-1">"{event.data.note}"</span>
                    <span>ليوم {format(event.date, 'd MMMM yyyy', { locale: arSA })} {timeText}</span>
                </div>
            )
        });
    });

    if (items.length === 0) {
        items.push({
            id: 'welcome',
            date: today.toISOString(),
            type: 'info',
            node: <span key="welcome">مرحباً بك في مخططك! قم بتثبيت يوم أو أضف ملاحظة لعرضها هنا.</span>
        });
    }
    
    // Sort all collected items by date proximity
    items.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        const diffA = Math.abs(differenceInDays(dateA, todayStart));
        const diffB = Math.abs(differenceInDays(dateB, todayStart));
        
        const isFutureA = isAfter(dateA, todayStart) || isSameDay(dateA, todayStart);
        const isFutureB = isAfter(dateB, todayStart) || isSameDay(dateB, todayStart);

        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;

        if (isFutureA && isFutureB) { // Both future
            return differenceInDays(dateA, todayStart) - differenceInDays(dateB, todayStart);
        } else { // Both past
            return differenceInDays(dateB, todayStart) - differenceInDays(dateA, todayStart);
        }
    });

    return items;
};


export default function Home() {
  const { schedules, activeSchedule, isLoaded, updateDay, updateSchedule } = useSchedules();
  const { zoomLevel, gridCols, setZoomLevel, setGridCols, tickerSpeed, showTicker, backgroundColors, hasSeenRotationTip, setHasSeenRotationTip } = useViewSettings();
  const { highlightedItem, setHighlightedItem } = useHighlight();
  const [currentDate] = React.useState(new Date());
  const [isManagerOpen, setIsManagerOpen] = React.useState(false);
  const [isHolidaysOpen, setIsHolidaysOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  const [viewDate, setViewDate] = React.useState(startOfYear(new Date()));
  const [isFullYearView, setIsFullYearView] = React.useState(true);
  const [shouldScroll, setShouldScroll] = React.useState(true);


  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = React.useState(false);
  
  const [selectedEventIndex, setSelectedEventIndex] = React.useState<number | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = React.useState(false);
  
  const startMonthRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [captureStatus, setCaptureStatus] = React.useState<'idle' | 'capturing' | 'success'>('idle');
  const [isRotationTipOpen, setIsRotationTipOpen] = React.useState(false);

  const tickerItems = React.useMemo(() => generateTickerItems(activeSchedule, currentDate), [activeSchedule, currentDate]);
  
  const tickerSeparator = React.useMemo(() => (
    <div className="text-primary font-semibold text-lg">
        سبحان الله وبحمده سبحان الله العظيم
    </div>
  ), []);


  React.useEffect(() => {
    document.documentElement.style.setProperty('--page-background', backgroundColors.page);
    document.documentElement.style.setProperty('--header-background', backgroundColors.header);
    document.documentElement.style.setProperty('--controls-background', backgroundColors.controls);
    document.documentElement.style.setProperty('--container-background', backgroundColors.container);
    document.documentElement.style.setProperty('--day-number-color', backgroundColors.dayNumber);
  }, [backgroundColors]);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const checkInstalled = async () => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }
    };
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  React.useEffect(() => {
    if (activeSchedule?.startDate && isLoaded) {
      const scheduleStartDate = new Date(activeSchedule.startDate);
      const today = startOfToday();
      
      const initialViewDate = isBefore(today, scheduleStartDate) ? scheduleStartDate : today;
      
      setViewDate(initialViewDate);
      setIsFullYearView(false); 
      setShouldScroll(true);
    }
  }, [activeSchedule?.id, isLoaded]); 


  React.useEffect(() => {
    if (startMonthRef.current && !isFullYearView && shouldScroll) {
        startMonthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setShouldScroll(false); // Prevent scrolling on subsequent renders
    }
  }, [viewDate, isFullYearView, activeSchedule?.id, shouldScroll]);
  
  React.useEffect(() => {
    if (highlightedItem) {
        // Use a timeout to ensure the DOM has updated after viewDate change
        setTimeout(() => {
            const element = document.getElementById(`month-${highlightedItem.monthKey}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }, 100);
    }
  }, [highlightedItem]);


  const performCapture = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;
    
    setCaptureStatus('capturing');
    let styleEl: HTMLStyleElement | null = null;
    
    let originalClasses: string | null = null;
    if (isMobile) {
      originalClasses = calendarContainer.className;
      calendarContainer.className = 'grid grid-cols-3 gap-4 transition-transform duration-300 origin-top sm:gap-6 p-2 sm:p-4';
    }
    
    try {
        const fontResponse = await fetch(
            'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap'
        );
        const fontCss = await fontResponse.text();
        styleEl = document.createElement('style');
        styleEl.textContent = fontCss;
        document.head.appendChild(styleEl);

        await new Promise(resolve => setTimeout(resolve, 500));

        const elementToCapture = document.body;
        const canvas = await html2canvas(elementToCapture, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            imageTimeout: 15000,
            backgroundColor: null,
            onclone: (clonedDoc) => {
                if (styleEl) {
                    clonedDoc.head.appendChild(styleEl.cloneNode(true));
                }
                const header = clonedDoc.querySelector('header');
                if (header) {
                    const captureButton = header.querySelector('button[data-capture-btn="true"]');
                    if (captureButton) {
                      (captureButton.parentElement as HTMLElement).style.display = 'none';
                    }
                }
            },
        });

        const link = document.createElement('a');
        const now = new Date();
        const timestamp = format(now, 'yyyy-MM-dd_HH-mm-ss');
        link.download = `my-planner_${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setCaptureStatus('success');

    } catch (err) {
        console.error("Oops, something went wrong during capture!", err);
        setCaptureStatus('idle');
         toast({
            variant: "destructive",
            title: "حدث خطأ!",
            description: "لم نتمكن من حفظ الصورة. يرجى المحاولة مرة أخرى.",
        });
    } finally {
        if (styleEl && document.head.contains(styleEl)) {
            document.head.removeChild(styleEl);
        }
        if (isMobile && originalClasses !== null) {
          calendarContainer.className = originalClasses;
        }
        setTimeout(() => setCaptureStatus('idle'), 2000);
    }
  };
  
  const handleCaptureClick = () => {
    if (isMobile && !hasSeenRotationTip) {
        setIsRotationTipOpen(true);
    } else {
        performCapture();
    }
  };

  const handleRotationTipClose = () => {
    setIsRotationTipOpen(false);
    setHasSeenRotationTip(true);
    performCapture();
  };


  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoomLevel(Math.min(zoomLevel + 0.1, 1.5));
    } else {
      setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
    }
  };
  
  const handleTickerItemClick = (item: TickerItemData) => {
      if (item.type === 'info') return;
      
      const index = tickerItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        setSelectedEventIndex(index);
        setIsEventDetailOpen(true);
      }
  }

  const handleLocateEvent = (event: TickerItemData) => {
    const eventDate = parseISO(event.date);
    setViewDate(eventDate);
    setIsFullYearView(true);
    setHighlightedItem({
      monthKey: format(eventDate, 'yyyy-MM'),
      dayKeys: event.relatedDays || [format(eventDate, 'yyyy-MM-dd')],
    });
    setIsEventDetailOpen(false);
  };
  
  const handleUpdateEvent = (dateStr: string, data: Partial<DayData>) => {
      updateDay(format(parseISO(dateStr), 'yyyy-MM-dd'), data);
  };

  const handleDeleteEvent = (item: TickerItemData) => {
      const dateKey = format(parseISO(item.date), 'yyyy-MM-dd');
      if (item.type === 'pin') {
          updateDay(dateKey, { pinned: false });
      } else if (item.type === 'note') {
          updateDay(dateKey, { note: undefined });
      }
      toast({ title: 'تم حذف الحدث' });
  };
  
  const handleAddHolidays = (holidays: { date: string; note: string }[]) => {
    if (!activeSchedule) return;

    const updates: { [date: string]: DayData } = {};
    holidays.forEach(holiday => {
      const existingData = activeSchedule.days[holiday.date] || { type: 'default' };
      const newNote = existingData.note
        ? `${existingData.note}\n\n${holiday.note}`
        : holiday.note;
      
      updates[holiday.date] = {
        ...existingData,
        type: 'holiday',
        note: newNote
      };
    });

    updateSchedule(activeSchedule.id, (prev) => ({
      days: { ...prev.days, ...updates }
    }));

    toast({
      title: "تم إضافة الإجازات",
      description: `تم تحديث ${holidays.length} يومًا في جدولك.`,
    });
  };


  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">جار تحميل المخطط ...</div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return <InitialSetup />;
  }

  if (!activeSchedule?.startDate) {
    return (
      <>
        <div className="flex h-screen w-full items-center justify-center" dir="rtl">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">لم يتم تحديد جدول</h1>
            <p className="text-muted-foreground">
              الرجاء إنشاء أو تحديد جدول للبدء.
            </p>
            <Button onClick={() => setIsManagerOpen(true)}>
              <Settings className="ml-2 h-4 w-4" />
              فتح مدير الجداول
            </Button>
          </div>
        </div>
        <ScheduleManager 
            open={isManagerOpen} 
            onOpenChange={setIsManagerOpen}
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
            onSetGridCols={setGridCols}
            currentGridCols={gridCols}
            installPrompt={installPrompt}
            isAppInstalled={isAppInstalled}
            onInstallClick={() => {}}
        />
      </>
    );
  }
  
  const scheduleStartDate = new Date(activeSchedule.startDate);
  const scheduleInitialDate = isBefore(startOfToday(), scheduleStartDate) ? scheduleStartDate : startOfToday();

  let months: Date[] = [];
  if (isFullYearView) {
      months = Array.from({ length: 12 }, (_, i) => new Date(getYear(viewDate), i, 1));
  } else {
      const startMonthIndex = getMonth(scheduleInitialDate);
      const startYear = getYear(scheduleInitialDate);
      months = Array.from({ length: 12 }, (_, i) => {
          const monthIndex = (startMonthIndex + i) % 12;
          const monthYear = startYear + Math.floor((startMonthIndex + i) / 12);
          return new Date(monthYear, monthIndex, 1);
      });
  }

  const handlePrevYear = () => {
    if (!isFullYearView) {
        setViewDate(prev => new Date(getYear(prev), 0, 1));
        setIsFullYearView(true);
        return;
    }
    const currentYear = getYear(viewDate);
    const scheduleStartYear = getYear(scheduleInitialDate);
    // If moving from the year after the schedule starts, go back to multi-year view
    if (currentYear === scheduleStartYear + 1) {
        setViewDate(scheduleInitialDate);
        setIsFullYearView(false);
        setShouldScroll(true); // Allow scrolling when going back to split view
    } else {
        setViewDate(prev => subYears(prev, 1));
        setIsFullYearView(true);
    }
  };
  
  const handleNextYear = () => {
    if (!isFullYearView) {
        // If in multi-year view, go to the full year of the second year.
        const endYear = getYear(months[11]);
        setViewDate(new Date(endYear, 0, 1));
        setIsFullYearView(true);
    } else {
        setViewDate(prev => addYears(prev, 1));
        setIsFullYearView(true);
    }
  };
  
  const handleReturnToCurrent = () => {
    setViewDate(scheduleInitialDate);
    setIsFullYearView(false);
    setShouldScroll(false); // Do not scroll when user clicks this button
  };

   const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: 'تم تثبيت التطبيق بنجاح!' });
        setIsAppInstalled(true);
      }
      setInstallPrompt(null);
    }
  };


  const getDisplayYearText = () => {
    if (!months || months.length === 0) return '';
    let startYear, endYear;
    
    if (isFullYearView) {
        startYear = getYear(viewDate);
        endYear = startYear;
    } else {
        const years = [getYear(months[0]), getYear(months[11])];
        startYear = Math.min(...years);
        endYear = Math.max(...years);
    }
    
    const currentActualYear = getYear(new Date());

    const startYearFormatted = format(new Date(startYear, 0, 1), 'yyyy', { locale: arSA });
    const isStartFuture = startYear > currentActualYear;

    if (startYear === endYear) {
        return <span className={cn(isStartFuture && "text-destructive")}>{startYearFormatted}</span>;
    }
    
    const endYearFormatted = format(new Date(endYear, 0, 1), 'yyyy', { locale: arSA });
    const isEndFuture = endYear > currentActualYear;

    return (
        <>
            <span className={cn(isEndFuture && "text-destructive")}>{endYearFormatted}</span>
            <span className="mx-2">-</span>
            <span className={cn(isStartFuture && "text-destructive")}>{startYearFormatted}</span>
        </>
    );
  };
  
  const gridClasses: { [key: number]: string } = {
    2: 'md:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'xl:grid-cols-4',
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--page-background)] transition-colors duration-300">
       <AppHeader 
        onCapture={handleCaptureClick}
        captureStatus={captureStatus}
        onOpenSettings={() => setIsManagerOpen(true)}
        onOpenHolidays={() => setIsHolidaysOpen(true)}
        installPrompt={installPrompt}
        isAppInstalled={isAppInstalled}
        onInstallClick={handleInstallClick}
      />
      <main className="flex-1 p-2 sm:p-4 lg:p-6" dir="rtl">
        <div 
          id="main-controls" 
          className="sticky top-[65px] z-20 mb-4 flex flex-col items-center justify-center gap-4 rounded-lg border shadow-sm backdrop-blur-sm transition-colors duration-300 sm:px-4"
          style={{ backgroundColor: `${backgroundColors.controls}bf`}}
        >
            
            {showTicker && tickerItems.length > 0 && (
                <div className="w-full overflow-hidden py-3">
                    <NewsTicker 
                      items={tickerItems} 
                      separator={tickerSeparator}
                      duration={tickerSpeed}
                      onItemClick={handleTickerItemClick}
                    />
                </div>
            )}

            <div className="mx-auto flex w-full items-center justify-center gap-2 px-2 pb-3 sm:gap-4 sm:px-0">
                <Button variant="outline" size="icon" onClick={handlePrevYear} aria-label="Previous Year">
                    <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex h-10 flex-grow items-center justify-center rounded-md border bg-accent/50 px-2 text-center font-semibold text-primary sm:flex-grow-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-wider">
                      {getDisplayYearText()}
                    </h2>
                </div>

                {isFullYearView && (
                    <Button variant="secondary" onClick={handleReturnToCurrent} className="hidden sm:flex">
                        <Undo2 className="ml-2 h-4 w-4" />
                        العودة للشهر الحالي
                    </Button>
                )}
                
                <Button variant="outline" size="icon" onClick={handleNextYear} aria-label="Next Year">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </div>
             {isFullYearView && (
                <Button variant="secondary" onClick={handleReturnToCurrent} className="flex sm:hidden w-full mx-2 mb-2">
                    <Undo2 className="ml-2 h-4 w-4" />
                    العودة للشهر الحالي
                </Button>
            )}
        </div>
        
        <div 
          id="calendar-grid" 
          className="scroll-mt-4 rounded-xl border border-border p-2 shadow-xl transition-colors duration-300 sm:p-4"
          style={{ backgroundColor: backgroundColors.container }}
        >
            <div 
              id="calendar-container"
              className={cn(
                "grid grid-cols-1 gap-4 transition-transform duration-300 origin-top sm:grid-cols-2 sm:gap-6", 
                gridClasses[gridCols]
              )}
              style={{ transform: `scale(${zoomLevel})`}}
            >
              {months.map((month) => {
                const isStartMonth = !isFullYearView && isSameYear(month, viewDate) && getMonth(month) === getMonth(viewDate);

                const monthKey = format(month, 'yyyy-MM');
                return (
                  <div id={`month-${monthKey}`} key={month.toISOString()} ref={isStartMonth ? startMonthRef : null}>
                     <CalendarMonth 
                        month={month} 
                        currentDate={currentDate}
                        activeSchedule={activeSchedule}
                        monthKey={monthKey}
                        isHighlighted={highlightedItem?.monthKey === monthKey}
                        highlightedDays={highlightedItem?.monthKey === monthKey ? highlightedItem.dayKeys : undefined}
                     />
                  </div>
                );
              })}
            </div>
        </div>
      </main>
       <ScheduleManager 
            open={isManagerOpen} 
            onOpenChange={setIsManagerOpen}
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
            onSetGridCols={setGridCols}
            currentGridCols={gridCols}
            installPrompt={installPrompt}
            isAppInstalled={isAppInstalled}
            onInstallClick={handleInstallClick}
        />
        {(selectedEventIndex !== null) && (
            <EventDetailDialog
                isOpen={isEventDetailOpen}
                onOpenChange={setIsEventDetailOpen}
                items={tickerItems}
                currentIndex={selectedEventIndex}
                onNavigate={(newIndex) => setSelectedEventIndex(newIndex)}
                onLocate={handleLocateEvent}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteEvent}
            />
        )}
        <OfficialHolidaysDialog 
            isOpen={isHolidaysOpen}
            onOpenChange={setIsHolidaysOpen}
            onAddHolidays={handleAddHolidays}
        />
         <Dialog open={isRotationTipOpen} onOpenChange={setIsRotationTipOpen}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>نصيحة للحصول على أفضل صورة</DialogTitle>
                    <DialogDescription>
                        للحصول على صورة واضحة وعالية الجودة للتقويم، نوصي بتدوير هاتفك إلى الوضع الأفقي قبل الحفظ.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col items-center justify-center text-center">
                    <Smartphone className="h-16 w-16 text-primary animate-pulse" />
                    <RotateCw className="h-8 w-8 my-2 text-muted-foreground" />
                    <p className="font-semibold">قم بتدوير هاتفك</p>
                    <p className="text-sm text-muted-foreground">( الوضع الأفقي )</p>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsRotationTipOpen(false)} variant="outline">
                        حفظ على أي حال
                    </Button>
                    <Button onClick={handleRotationTipClose}>
                        فهمت، لنبدأ الحفظ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    
