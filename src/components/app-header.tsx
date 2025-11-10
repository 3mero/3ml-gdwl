
"use client";

import React from 'react';
import { Calendar, Settings, ChevronDown, Check, Palette, Camera, Loader2, Download, Upload, Trash2, PlusCircle, Info, Smartphone, CalendarDays, SlidersHorizontal, Paintbrush, Save } from 'lucide-react';
import { useSchedules } from '@/hooks/use-schedules';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from './ui/card';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useViewSettings } from '@/hooks/use-view-settings';
import { BackgroundColors, ThemeFile, ColorPreset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';


type AppHeaderProps = {
  onCapture: () => void;
  captureStatus: 'idle' | 'capturing' | 'success';
  onOpenSettings: () => void;
  onOpenHolidays: () => void;
  installPrompt: any;
  isAppInstalled: boolean;
  onInstallClick: () => void;
};


const ColorInputTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { color: string }
>(({ color, ...props }, ref) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                ref={ref}
                className="h-6 w-6 rounded-full border-2 border-background shadow-md cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                {...props}
            />
        </TooltipTrigger>
        <TooltipContent side="top">
            <p>تغيير اللون</p>
        </TooltipContent>
    </Tooltip>
));
ColorInputTrigger.displayName = 'ColorInputTrigger';


export function AppHeader({ 
  onCapture, 
  captureStatus, 
  onOpenSettings,
  onOpenHolidays,
  installPrompt,
  isAppInstalled,
  onInstallClick
}: AppHeaderProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = React.useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = React.useState(false);
  const { schedules, activeSchedule, activeScheduleId, setActiveScheduleId } = useSchedules();
  
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [themeName, setThemeName] = React.useState('');
  const [isSavePromptOpen, setIsSavePromptOpen] = React.useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = React.useState(false);

  const { 
    backgroundColors, 
    setBackgroundColors,
    colorPresets,
    saveColorPreset,
    deleteColorPreset,
    applyColorPreset,
  } = useViewSettings();

  const [localColors, setLocalColors] = React.useState<BackgroundColors>(backgroundColors);
  
  React.useEffect(() => {
    if (isColorPickerOpen) {
      setLocalColors(backgroundColors);
    }
  }, [backgroundColors, isColorPickerOpen]);


  const handleColorSave = () => {
    setBackgroundColors(localColors);
    setIsColorPickerOpen(false);
    toast({ title: "تم حفظ الألوان بنجاح!", duration: 2000 });
  };
  
  const handleColorChange = (key: keyof BackgroundColors, value: string) => {
    setLocalColors(prev => ({...prev, [key]: value}));
  };
  
  const handleExportTheme = () => {
    if (!themeName.trim()) {
      toast({ variant: "destructive", title: "الرجاء إدخال اسم للثيم" });
      return;
    }
    const themeFile: ThemeFile = {
      name: themeName.trim(),
      colors: localColors,
    };
    const dataStr = JSON.stringify(themeFile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${themeName.trim().replace(/\s+/g, '_')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setIsSavePromptOpen(false);
    setThemeName('');
    toast({ title: `تم تصدير ثيم "${themeFile.name}"` });
  };
  
  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          const imported = JSON.parse(content as string) as ThemeFile;
          if (imported.name && imported.colors) {
            setLocalColors(imported.colors); // Update the preview
            setBackgroundColors(imported.colors); // Save and apply
            toast({ title: `تم استيراد ثيم "${imported.name}"` });
          } else {
             throw new Error("Invalid theme file format");
          }
        } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "فشل الاستيراد", description: "ملف الثيم غير صالح." });
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  const handleSavePreset = () => {
    if (!themeName.trim()) {
      toast({ variant: "destructive", title: "الرجاء إدخال اسم للثيم" });
      return;
    }
    saveColorPreset(themeName, localColors);
    toast({ title: "تم حفظ الثيم بنجاح!" });
    setIsSavePresetOpen(false);
    setThemeName('');
  };


  const todayFormatted = format(new Date(), "eeee, d MMMM yyyy", { locale: arSA });

  const getCaptureButtonContent = () => {
    switch (captureStatus) {
      case 'capturing':
        return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الحفظ...</>;
      case 'success':
        return <>تم الحفظ!</>;
      default:
        return <><Camera className="mr-2 h-4 w-4" /> حفظ كصورة</>;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-2 sm:px-4 md:px-6 backdrop-blur-sm" dir="rtl" style={{ backgroundColor: `${backgroundColors.header}bf`}}>
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">فتح الإعدادات</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" dir="rtl">
                <DropdownMenuLabel>الإعدادات العامة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onOpenSettings}>
                  <SlidersHorizontal className="ml-2 h-4 w-4" />
                  <span>إعدادات الجداول والواجهة</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onOpenHolidays}>
                  <CalendarDays className="ml-2 h-4 w-4" />
                  <span>المناسبات الرسمية</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setIsColorPickerOpen(true)}>
                  <Palette className="ml-2 h-4 w-4" />
                  <span>تخصيص ألوان الواجهة</span>
                </DropdownMenuItem>
                {installPrompt && !isAppInstalled && (
                  <DropdownMenuItem onSelect={onInstallClick}>
                    <Smartphone className="ml-2 h-4 w-4" />
                    <span>تثبيت التطبيق</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsAboutDialogOpen(true)}>
                  <Info className="ml-2 h-4 w-4" />
                  <span>حول التطبيق</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2" data-capture-btn="true">
              <Button variant="outline" onClick={onCapture} disabled={captureStatus !== 'idle'} className="w-36">
                  {getCaptureButtonContent()}
              </Button>
            </div>

            {schedules.length > 1 && activeSchedule && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="max-w-[150px] sm:max-w-xs">
                    <ChevronDown className="mr-2 h-4 w-4" />
                    <span className="truncate">{activeSchedule.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56" dir="rtl">
                  <DropdownMenuLabel>تبديل الجدول</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {schedules.map((schedule) => (
                    <DropdownMenuItem
                      key={schedule.id}
                      onSelect={() => setActiveScheduleId(schedule.id)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{schedule.name}</span>
                      {schedule.id === activeScheduleId && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>

        <div className="mx-auto flex items-center justify-center">
            <Card className="hidden sm:block w-fit max-w-full mx-auto px-4 py-1 shadow-lg border-primary/20">
                <div className="flex flex-col justify-center items-center h-12 rounded-md border bg-accent/50 p-1 text-center font-semibold">
                    <p className="text-xs font-medium text-muted-foreground">اليوم</p>
                    <p className="text-base sm:text-lg tracking-wide text-primary">{todayFormatted}</p>
                </div>
            </Card>
        </div>


        <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex justify-center items-center h-10 rounded-md border bg-accent/50 p-2 px-4 text-center font-semibold text-primary">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">جداول العمل</h1>
            </div>
            <Calendar className="h-6 w-6 text-primary" />
        </div>
      </header>
      
      <Dialog open={isAboutDialogOpen} onOpenChange={setIsAboutDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
                <DialogTitle>حول التطبيق</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 text-center text-muted-foreground">
                <p>
                    تم تصميم هذا التطبيق لجداول العمل المحلي من قبل 
                    <span className="font-semibold text-primary"> عمر الوهيبي </span>
                    عبر الذكاء الاصطناعي الخاص بجوجل (Gemini) وباستخدام منصة Firebase Studio.
                </p>
                <p>
                    المشروع تجريبي وقد تواجه بعض الأخطاء.
                </p>
                <p>
                    للتواصل عبر الواتساب:
                    <a 
                        href="https://wa.me/96892670679" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary font-bold tracking-wider hover:underline mx-1"
                    >
                         +96892670679
                    </a>
                </p>
            </div>
            <DialogFooter>
                <Button onClick={() => setIsAboutDialogOpen(false)}>إغلاق</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    <Dialog open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] sm:h-auto flex flex-col" dir="rtl">
            <DialogHeader>
                <DialogTitle>تخصيص ألوان الواجهة</DialogTitle>
                <DialogDescription>
                    انقر على الدوائر الملونة لتغيير الألوان، أو اختر من الثيمات المحفوظة.
                </DialogDescription>
            </DialogHeader>
            
            <div className="border-b -mx-6 pb-4">
                <div className="px-6">
                    <h4 className="font-semibold mb-2">الثيمات المحفوظة</h4>
                    <div className="flex gap-2 items-center">
                        <AlertDialog open={isSavePresetOpen} onOpenChange={setIsSavePresetOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon"><Save className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>حفظ الثيم الحالي</AlertDialogTitle>
                                    <AlertDialogDescription>الرجاء إدخال اسم للثيم ليتم حفظه.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="preset-name" className="text-right">اسم الثيم</Label>
                                    <Input id="preset-name" value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="مثال: ثيم الصحراء" />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setThemeName('')}>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSavePreset}>حفظ</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Separator orientation="vertical" className="h-8" />
                        {colorPresets.length > 0 ? (
                            <div className="flex gap-2">
                                {colorPresets.map((preset) => (
                                    <div key={preset.id} className="relative group">
                                        <Button variant="secondary" onClick={() => applyColorPreset(preset.colors)}>{preset.name}</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                    <AlertDialogDescription>سيتم حذف ثيم "{preset.name}" نهائيًا.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteColorPreset(preset.id)}>نعم، احذف</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">لم يتم حفظ أي ثيمات بعد.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 py-4">
                <TooltipProvider>
                    <div className="relative w-full h-full rounded-md border-2 border-dashed p-4 overflow-hidden flex flex-col items-center justify-start gap-4" style={{ backgroundColor: localColors.page }}>
                        
                        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                             <Label htmlFor="page-color-picker" className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>خلفية الصفحة</Label>
                             <div className="relative">
                                 <ColorInputTrigger color={localColors.page} onClick={() => document.getElementById('page-color-picker')?.click()} />
                                 <Input id="page-color-picker" type="color" value={localColors.page} onChange={(e) => handleColorChange('page', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                             </div>
                        </div>

                        {/* Live Preview Container */}
                        <div className="w-[600px] max-w-full rounded-md border-2 border-border/30 shadow-2xl flex flex-col overflow-hidden bg-muted">
                            {/* Preview Header */}
                            <div className="relative h-16 rounded-t-sm flex items-center justify-between px-4" style={{ backgroundColor: localColors.header }}>
                                <div className="absolute top-1/2 -translate-y-1/2 left-4 flex items-center gap-2">
                                     <Label htmlFor="header-color-picker" className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>الشريط العلوي</Label>
                                     <div className="relative">
                                        <ColorInputTrigger color={localColors.header} onClick={() => document.getElementById('header-color-picker')?.click()} />
                                        <Input id="header-color-picker" type="color" value={localColors.header} onChange={(e) => handleColorChange('header', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                     </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-primary/50"></div>
                            </div>
                             {/* Preview Controls */}
                            <div className="relative h-14 mt-4 mx-4 rounded-sm flex items-center justify-center px-4" style={{ backgroundColor: localColors.controls }}>
                                <p className="text-xs text-muted-foreground">. . . شريط الأخبار . . .</p>
                                <div className="absolute top-1/2 -translate-y-1/2 left-2 flex items-center gap-2">
                                    <Label htmlFor="controls-color-picker" className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>الأخبار</Label>
                                     <div className="relative">
                                        <ColorInputTrigger color={localColors.controls} onClick={() => document.getElementById('controls-color-picker')?.click()} />
                                        <Input id="controls-color-picker" type="color" value={localColors.controls} onChange={(e) => handleColorChange('controls', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                     </div>
                                </div>
                            </div>
                            {/* Preview Calendar Container */}
                            <div className="relative flex-1 mt-4 mx-4 mb-4 rounded-sm p-4 pt-8" style={{ backgroundColor: localColors.container }}>
                                 <div className="absolute top-2 right-2 flex items-center gap-2">
                                    <Label htmlFor="container-color-picker" className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>إطار التقويم</Label>
                                     <div className="relative">
                                        <ColorInputTrigger color={localColors.container} onClick={() => document.getElementById('container-color-picker')?.click()} />
                                        <Input id="container-color-picker" type="color" value={localColors.container} onChange={(e) => handleColorChange('container', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                     </div>
                                </div>
                                
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <div className="relative text-center font-bold mb-2 text-lg px-4 py-1 rounded-md border" style={{color: localColors.monthName, backgroundColor: localColors.monthHeaderBackground}}>
                                        اسم الشهر
                                        <div className="absolute -top-6 -right-16 flex items-center gap-2">
                                            <Label className="text-xs">خلفية العنوان</Label>
                                            <div className="relative">
                                                <ColorInputTrigger color={localColors.monthHeaderBackground} onClick={() => document.getElementById('monthHeader-color-picker')?.click()} />
                                                <Input id="monthHeader-color-picker" type="color" value={localColors.monthHeaderBackground} onChange={(e) => handleColorChange('monthHeaderBackground', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 w-48">
                                        <div className="aspect-square flex items-center justify-center rounded-sm border relative" style={{ color: "hsl(var(--foreground))" }}>
                                            <span className="absolute -top-5 text-xs font-mono" style={{ color: localColors.monthNumber }}>1</span>1
                                        </div>
                                        <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: 'hsl(var(--primary-foreground))', backgroundColor: localColors.workDay }}>
                                            2
                                        </div>
                                        <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: 'hsl(var(--primary-foreground))', backgroundColor: localColors.holidayDay }}>
                                            3
                                        </div>
                                        <div className="aspect-square flex items-center justify-center rounded-sm border" style={{ color: 'hsl(var(--foreground))' }}>4</div>
                                    </div>
                                </div>
                               
                            </div>
                        </div>

                         <div className="w-[600px] max-w-full rounded-md border-2 border-border/30 shadow-xl p-4 bg-muted space-y-3">
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>اسم الشهر</Label>
                                    <div className="relative">
                                        <ColorInputTrigger color={localColors.monthName} onClick={() => document.getElementById('monthName-color-picker')?.click()} />
                                        <Input id="monthName-color-picker" type="color" value={localColors.monthName} onChange={(e) => handleColorChange('monthName', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>رقم الشهر</Label>
                                    <div className="relative">
                                        <ColorInputTrigger color={localColors.monthNumber} onClick={() => document.getElementById('monthNumber-color-picker')?.click()} />
                                        <Input id="monthNumber-color-picker" type="color" value={localColors.monthNumber} onChange={(e) => handleColorChange('monthNumber', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                    </div>
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label>يوم عمل</Label>
                                    <div className="relative">
                                        <ColorInputTrigger color={localColors.workDay} onClick={() => document.getElementById('workDay-color-picker')?.click()} />
                                        <Input id="workDay-color-picker" type="color" value={localColors.workDay} onChange={(e) => handleColorChange('workDay', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>يوم إجازة</Label>
                                    <div className="relative">
                                        <ColorInputTrigger color={localColors.holidayDay} onClick={() => document.getElementById('holidayDay-color-picker')?.click()} />
                                        <Input id="holidayDay-color-picker" type="color" value={localColors.holidayDay} onChange={(e) => handleColorChange('holidayDay', e.target.value)} className="absolute opacity-0 w-0 h-0"/>
                                    </div>
                                </div>
                             </div>
                         </div>
                    </div>
                </TooltipProvider>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-y-2 pt-4 border-t shrink-0">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button variant="ghost" onClick={() => setIsColorPickerOpen(false)}>إلغاء</Button>
                <Button onClick={handleColorSave}>حفظ وإغلاق</Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-start">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> استيراد ثيم
                  </Button>
                  <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImportTheme} />
                  <AlertDialog open={isSavePromptOpen} onOpenChange={setIsSavePromptOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> حفظ كملف
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حفظ الثيم الحالي</AlertDialogTitle>
                        <AlertDialogDescription>
                          الرجاء إدخال اسم للثيم ليتم حفظه في ملف JSON.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="theme-name" className="text-right">اسم الثيم</Label>
                        <Input id="theme-name" value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="مثال: ثيم الصحراء" />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExportTheme}>حفظ وتنزيل</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
