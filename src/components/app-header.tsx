
"use client";

import React from 'react';
import { Calendar, Settings, ChevronDown, Check, Palette, Camera, Loader2, Download, Upload, Trash2, PlusCircle, Info, Smartphone, CalendarDays } from 'lucide-react';
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
import { useViewSettings, defaultViewSettings } from '@/hooks/use-view-settings';
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

type AppHeaderProps = {
  onCapture: () => void;
  captureStatus: 'idle' | 'capturing' | 'success';
  onOpenSettings: () => void;
  onOpenHolidays: () => void;
  installPrompt: any;
  isAppInstalled: boolean;
  onInstallClick: () => void;
};


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
  const [isSavePresetPromptOpen, setIsSavePresetPromptOpen] = React.useState(false);
  const [presetName, setPresetName] = React.useState('');

  const { 
    backgroundColors, 
    setBackgroundColors, 
    colorPresets, 
    saveColorPreset, 
    deleteColorPreset,
    applyColorPreset
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
  
  const handleResetColors = () => {
    setLocalColors(defaultViewSettings.backgroundColors);
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
    if (!presetName.trim()) {
      toast({ variant: "destructive", title: "الرجاء إدخال اسم للثيم" });
      return;
    }
    saveColorPreset(presetName, localColors);
    toast({ title: `تم حفظ ثيم "${presetName}"`});
    setPresetName('');
    setIsSavePresetPromptOpen(false);
  };
  
  const handleApplyPreset = (preset: ColorPreset) => {
    setLocalColors(preset.colors);
    toast({ title: `تم تطبيق ثيم "${preset.name}"` });
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

  const colorInputs: {key: keyof BackgroundColors, label: string}[] = [
    { key: 'page', label: 'خلفية الصفحة' },
    { key: 'header', label: 'خلفية الشريط العلوي' },
    { key: 'controls', label: 'خلفية شريط الاخبار' },
    { key: 'container', label: 'خلفية إطار التقويم' },
    { key: 'dayNumber', label: 'لون أرقام الأيام' },
    { key: 'monthName', label: 'لون أسماء وأرقام الأشهر' },
    { key: 'workDay', label: 'لون يوم العمل' },
    { key: 'holidayDay', label: 'لون يوم الإجازة' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-2 sm:px-4 md:px-6 backdrop-blur-sm" dir="rtl" style={{ backgroundColor: `${backgroundColors.header}bf`}}>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={onOpenSettings}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">إعدادات</span>
          </Button>
          
          <div className="flex items-center gap-2" data-capture-btn="true">
            <Button variant="outline" onClick={onOpenHolidays} >
              <CalendarDays className="mr-2 h-4 w-4" /> مناسبات
            </Button>
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
            {installPrompt && !isAppInstalled && (
              <Button variant="outline" size="icon" onClick={onInstallClick} title="تثبيت التطبيق">
                <Smartphone className="h-5 w-5" />
                <span className="sr-only">تثبيت التطبيق</span>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setIsAboutDialogOpen(true)}>
              <Info className="h-5 w-5" />
              <span className="sr-only">حول التطبيق</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsColorPickerOpen(true)}>
              <Palette className="h-5 w-5" />
              <span className="sr-only">تغيير ألوان الواجهة</span>
            </Button>
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
        <DialogContent className="max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col" dir="rtl">
            <DialogHeader>
                <DialogTitle>تخصيص ألوان الواجهة</DialogTitle>
                <DialogDescription>
                    اختر الألوان التي تفضلها، احفظها كثيمات، وشاهد التغييرات مباشرة.
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-4 -mr-4">
                <div className="space-y-6 py-4">
                  <div>
                    <Label className="text-base font-semibold">الثيمات المحفوظة</Label>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {colorPresets.map(preset => (
                        <div key={preset.id} className="relative group">
                          <Button variant="outline" onClick={() => handleApplyPreset(preset)}>{preset.name}</Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button size="icon" variant="ghost" className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيؤدي هذا إلى حذف ثيم "{preset.name}" نهائيًا.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteColorPreset(preset.id)}>حذف</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      ))}
                      {colorPresets.length < 3 && (
                         <AlertDialog open={isSavePresetPromptOpen} onOpenChange={setIsSavePresetPromptOpen}>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حفظ الثيم الحالي</AlertDialogTitle>
                              <AlertDialogDescription>
                                أدخل اسمًا للثيم الحالي ليتم إضافته إلى قائمة الثيمات المحفوظة.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <Label htmlFor="preset-name" className="text-right">اسم الثيم</Label>
                              <Input id="preset-name" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="مثال: ثيم الصحراء" />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={handleSavePreset}>حفظ</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Right side: Color Pickers */}
                      <div className="flex flex-col gap-4">
                        {colorInputs.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between gap-4">
                              <Label htmlFor={`${key}-color`} className="text-nowrap">{label}</Label>
                              <div className="flex items-center gap-2 border rounded-md p-1 w-full">
                                 <Input id={`${key}-color`} type="color" value={localColors[key]} onChange={(e) => handleColorChange(key, e.target.value)} className="p-0 h-8 w-10 border-none"/>
                                 <Input type="text" value={localColors[key]} onChange={(e) => handleColorChange(key, e.target.value)} className="h-8 border-none bg-transparent focus-visible:ring-0" />
                              </div>
                          </div>
                        ))}
                      </div>
                      {/* Left side: Live Preview */}
                      <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-4">
                           <p className="text-sm text-muted-foreground mb-2">معاينة حية</p>
                          <div className="w-full h-80 rounded-md border-2 border-dashed p-2 overflow-hidden" style={{ backgroundColor: localColors.page }}>
                              {/* Preview Header */}
                              <div className="h-8 rounded-t-sm flex items-center px-2" style={{ backgroundColor: localColors.header }}>
                                 <div className="w-4 h-4 rounded-full bg-primary/50"></div>
                              </div>
                               {/* Preview Controls */}
                              <div className="h-10 mt-2 mx-2 rounded-sm flex items-center justify-center px-2" style={{ backgroundColor: localColors.controls }}>
                                   <p className="text-xs text-muted-foreground">. . .</p>
                              </div>
                              {/* Preview Calendar Container */}
                              <div className="h-full mt-2 mx-2 rounded-sm p-2" style={{ backgroundColor: localColors.container }}>
                                <div className="relative">
                                    <div className="absolute top-0 left-1 text-[10px] font-mono" style={{color: localColors.monthName}}>1</div>
                                    <div className="text-center font-bold mb-2" style={{color: localColors.monthName}}>اسم الشهر</div>
                                </div>
                                   <div className="grid grid-cols-4 gap-2">
                                      <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: localColors.dayNumber }}>1</div>
                                      <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: 'hsl(var(--primary-foreground))', backgroundColor: localColors.workDay }}>2</div>
                                      <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: 'hsl(var(--primary-foreground))', backgroundColor: localColors.holidayDay }}>3</div>
                                      <div className="aspect-square flex items-center justify-center text-xs rounded-sm border" style={{ color: localColors.dayNumber }}>4</div>
                                   </div>
                              </div>
                          </div>
                      </div>
                   </div>
                </div>
              </ScrollArea>
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

    
