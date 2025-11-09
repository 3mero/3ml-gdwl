
"use client";

import React, { useState, useRef } from 'react';
import { useSchedules } from '@/hooks/use-schedules';
import { useViewSettings } from '@/hooks/use-view-settings';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Copy, Upload, Download, Edit, Save, X, SlidersHorizontal, ZoomIn, ZoomOut, LayoutGrid, Smartphone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Schedule, FullExport } from '@/lib/types';
import { InitialSetup } from './initial-setup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";


type ScheduleManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetGridCols: (cols: number) => void;
  currentGridCols: number;
  installPrompt: any;
  isAppInstalled: boolean;
  onInstallClick: () => void;
};

export function ScheduleManager({ 
    open, 
    onOpenChange, 
    onZoomIn, 
    onZoomOut, 
    onSetGridCols, 
    currentGridCols,
    installPrompt,
    isAppInstalled,
    onInstallClick
}: ScheduleManagerProps) {
  const { schedules, addSchedule, deleteSchedule, updateSchedule, duplicateSchedule, importFullData, setSchedules } = useSchedules();
  const { viewSettings, importViewSettingsData, tickerSpeed, setTickerSpeed, showTicker, setShowTicker } = useViewSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editScheduleData, setEditScheduleData] = useState<Schedule | null>(null);


  const handleExport = () => {
    if (schedules.length === 0) return;

    const exportData: FullExport = {
      schedules,
      viewSettings
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `my_planner_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "تم تصدير البيانات", description: `تم تصدير جميع الجداول والإعدادات.` });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          const imported = JSON.parse(content as string) as FullExport | Schedule[];
          
          if ('schedules' in imported && 'viewSettings' in imported) {
            // New full export format
            importFullData(imported);
            toast({ title: "نجح الاستيراد الكامل", description: "تم استيراد الجداول والإعدادات." });
          } else if (Array.isArray(imported)) {
            // Old format (array of schedules) - clean colors from schedules
            const cleanedSchedules = imported.map(s => {
                if ((s as any).colors) {
                    delete (s as any).colors;
                }
                return s;
            });
            setSchedules(cleanedSchedules);
            toast({ title: "نجح الاستيراد (تنسيق قديم)", description: "تم استيراد الجداول. قد تحتاج لإعادة ضبط إعدادات الواجهة." });
          } else {
             throw new Error("Invalid file format");
          }

        } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "فشل الاستيراد", description: "ملف JSON غير صالح أو بتنسيق خاطئ." });
        }
      };
      reader.readAsText(file);
       // Reset file input to allow importing the same file again
       event.target.value = '';
    }
  };

  const startNameEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelNameEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveNameEditing = (id: string) => {
    if (editingName.trim()) {
      updateSchedule(id, { name: editingName.trim() });
      cancelNameEditing();
    }
  };

  const handleOpenEditDialog = (schedule: Schedule) => {
    setEditScheduleData(schedule);
  };


  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle>الإعدادات</SheetTitle>
          <SheetDescription>
            إدارة الجداول، وتخصيص الواجهة، والتحكم في بيانات التطبيق.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              <h3 className="font-semibold pt-4">إدارة الجداول</h3>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
                <Plus className="ml-2 h-4 w-4" /> إضافة جدول جديد
              </Button>
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-2 rounded-lg border p-2">
                     {editingId === schedule.id ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={cancelNameEditing}><X className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => saveNameEditing(schedule.id)}><Save className="h-4 w-4" /></Button>
                          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-9 flex-grow" />
                        </>
                      ) : (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" disabled={schedules.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيؤدي هذا إلى حذف جدول "{schedule.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSchedule(schedule.id)}>حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => duplicateSchedule(schedule.id)}><Copy className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleOpenEditDialog(schedule)}><SlidersHorizontal className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => startNameEditing(schedule.id, schedule.name)}><Edit className="h-4 w-4" /></Button>
                          <span className="font-medium flex-grow truncate text-right">{schedule.name}</span>
                        </>
                      )}
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="my-6" />
             <div className="space-y-4 text-right">
               <h3 className="font-semibold">إعدادات الواجهة</h3>
                 <div className="flex items-center justify-between">
                  <Label htmlFor="zoom-controls">التحكم في العرض</Label>
                    <div className="flex gap-2">
                       <Button variant="outline" size="icon" onClick={onZoomIn} aria-label="Zoom In">
                          <ZoomIn className="h-4 w-4" />
                       </Button>
                       <Button variant="outline" size="icon" onClick={onZoomOut} aria-label="Zoom Out">
                          <ZoomOut className="h-4 w-4" />
                       </Button>

                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" aria-label="Change grid layout">
                                  <LayoutGrid className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>تخطيط الشبكة</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={String(currentGridCols)} onValueChange={(val) => onSetGridCols(Number(val))}>
                              <DropdownMenuRadioItem value="2">عرض عمودين</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="3">عرض 3 أعمدة</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="4">عرض 4 أعمدة</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticker-speed">مؤقت عرض الأخبار (بالثواني)</Label>
                  <div className='flex items-center gap-2'>
                    <Slider
                        id="ticker-speed"
                        min={2}
                        max={15}
                        step={1}
                        value={[tickerSpeed]}
                        onValueChange={(value) => setTickerSpeed(value[0])}
                        dir='ltr'
                    />
                    <span className='text-xs text-muted-foreground font-mono'>{tickerSpeed}s</span>
                  </div>
                </div>
                 <div className="flex items-center justify-between mt-4">
                    <Label htmlFor="show-ticker" className="text-nowrap">
                       إظهار الشريط الإخباري
                    </Label>
                    <Switch
                        id="show-ticker"
                        checked={showTicker}
                        onCheckedChange={setShowTicker}
                    />
                </div>
             </div>

            <Separator className="my-6" />
            <div className="space-y-4 text-right">
               <h3 className="font-semibold">إدارة البيانات</h3>
               <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="ml-2 h-4 w-4" /> استيراد
                  </Button>
                  <input type="file" ref={fileInputRef} accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                  <Button variant="outline" className="w-full" onClick={handleExport} disabled={schedules.length === 0}>
                    <Download className="ml-2 h-4 w-4" /> تصدير
                  </Button>
               </div>
                {installPrompt && !isAppInstalled && (
                  <Button variant="outline" className="w-full mt-2" onClick={onInstallClick}>
                    <Smartphone className="ml-2 h-4 w-4" /> تثبيت التطبيق
                  </Button>
                )}
            </div>
          </ScrollArea>
        </div>
        <SheetFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">تم</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="max-w-lg p-0" dir="rtl">
        <DialogHeader className="p-6 pb-0">
            <DialogTitle>إنشاء جدول جديد</DialogTitle>
            <DialogDescription>
                أدخل تفاصيل جدولك الجديد.
            </DialogDescription>
        </DialogHeader>
        <InitialSetup 
            isDialog={true} 
            onFinished={() => setIsCreateDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
    
    <Dialog open={!!editScheduleData} onOpenChange={(open) => !open && setEditScheduleData(null)}>
        <DialogContent className="max-w-lg p-0" dir="rtl">
            <DialogHeader className="p-6 pb-0">
                 <DialogTitle>تعديل الجدول</DialogTitle>
                 <DialogDescription>
                    قم بتعديل تفاصيل جدول "{editScheduleData?.name}".
                 </DialogDescription>
            </DialogHeader>
            <InitialSetup 
                isDialog={true} 
                onFinished={() => setEditScheduleData(null)}
                existingSchedule={editScheduleData}
            />
        </DialogContent>
    </Dialog>
    </>
  );
}

    