

"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Schedule, DayData, FullExport } from '@/lib/types';
import { useLocalStorage } from './use-local-storage';
import { uuidv4, formatDateKey } from '@/lib/utils';
import { useViewSettings } from './use-view-settings';
import { format, getYear } from 'date-fns';

interface SchedulesContextType {
  schedules: Schedule[];
  setSchedules: (schedules: Schedule[]) => void,
  activeSchedule: Schedule | null;
  activeScheduleId: string | null;
  isLoaded: boolean;
  addSchedule: (name: string, startDayOfWeek: 0 | 1 | 6, monthsToShow?: number, startDate?: string) => Schedule;
  updateSchedule: (id: string, updates: Partial<Schedule> | ((prev: Schedule) => Partial<Schedule>)) => void;
  deleteSchedule: (id: string) => void;
  setActiveScheduleId: (id: string | null) => void;
  updateDay: (date: string, data: Partial<DayData> | undefined) => void;
  duplicateSchedule: (id: string) => void;
  importFullData: (data: FullExport) => void;
  deleteYearData: (year: string) => void;
  deleteAllEvents: () => void;
}

const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

export function SchedulesProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useLocalStorage<Schedule[]>('schedules', []);
  const [activeScheduleId, setActiveScheduleId] = useLocalStorage<string | null>('activeScheduleId', null);
  const { importViewSettingsData } = useViewSettings();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect ensures that the component is considered "loaded" only on the client-side,
    // preventing hydration mismatches and issues with localStorage.
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    // This effect runs only on the client after the initial load.
    if (isLoaded) {
        if (schedules.length > 0 && (!activeScheduleId || !schedules.some(s => s.id === activeScheduleId))) {
          // If activeScheduleId is invalid or not in the list, set it to the first schedule.
          setActiveScheduleId(schedules[0].id);
        } else if (schedules.length === 0) {
          // If there are no schedules, clear the active ID.
          setActiveScheduleId(null);
        }
    }
  }, [isLoaded, schedules, activeScheduleId, setActiveScheduleId]);


  const addSchedule = useCallback((
    name: string, 
    startDayOfWeek: 0 | 1 | 6,
    monthsToShow?: number,
    startDate?: string
  ): Schedule => {
    const newSchedule: Schedule = {
      id: uuidv4(),
      name,
      startDayOfWeek,
      days: {},
      monthsToShow: monthsToShow || 12,
      startDate: startDate,
      monthBackgrounds: {},
    };
    setSchedules(prev => {
        const newSchedules = [...prev, newSchedule];
        // Ensure the newly added schedule is set as active
        setActiveScheduleId(newSchedule.id);
        return newSchedules;
    });
    return newSchedule;
  }, [setSchedules, setActiveScheduleId]);

  const updateSchedule = useCallback((id: string, updates: Partial<Schedule> | ((prev: Schedule) => Partial<Schedule>)) => {
    setSchedules(prevSchedules => prevSchedules.map(s => {
        if (s.id === id) {
            const newUpdates = typeof updates === 'function' ? updates(s) : updates;
            return { ...s, ...newUpdates };
        }
        return s;
    }));
  }, [setSchedules]);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules(prevSchedules => {
      const newSchedules = prevSchedules.filter(s => s.id !== id);
      if (activeScheduleId === id) {
        setActiveScheduleId(newSchedules.length > 0 ? newSchedules[0].id : null);
      }
      return newSchedules;
    });
  }, [activeScheduleId, setSchedules, setActiveScheduleId]);
  
  const duplicateSchedule = useCallback((id: string) => {
    const scheduleToCopy = schedules.find(s => s.id === id);
    if (scheduleToCopy) {
      const newSchedule = {
        ...JSON.parse(JSON.stringify(scheduleToCopy)),
        id: uuidv4(),
        name: `${scheduleToCopy.name} (نسخة)`,
      };
      // Remove schedule-specific colors if they exist to avoid confusion
      if ((newSchedule as any).colors) {
        delete (newSchedule as any).colors;
      }
      setSchedules(prev => {
        const newSchedules = [...prev, newSchedule];
        setActiveScheduleId(newSchedule.id); // Directly set the new one as active
        return newSchedules;
      });
    }
  }, [schedules, setSchedules, setActiveScheduleId]);
  
  const importFullData = useCallback((data: FullExport) => {
    if (data.schedules) {
      // Clean old color data from imported schedules
      const cleanedSchedules = data.schedules.map(s => {
        const newS = {...s};
        if ((newS as any).colors) {
          delete (newS as any).colors;
        }
        return newS;
      });
      setSchedules(cleanedSchedules);

      if(cleanedSchedules.length > 0){
        setActiveScheduleId(cleanedSchedules[0].id);
      }
    }
    if (data.viewSettings) {
      importViewSettingsData(data.viewSettings);
    }
  }, [setSchedules, setActiveScheduleId, importViewSettingsData]);

  const updateDay = useCallback((date: string, data: Partial<DayData> | undefined) => {
    if (!activeScheduleId) return;

    updateSchedule(activeScheduleId, (prevSchedule) => {
      const newDays = { ...prevSchedule.days };

      if (data === undefined) {
        // If data is undefined, completely remove the day entry
        delete newDays[date];
      } else {
        // Correctly merge existing data with new data
        const existingDayData = newDays[date] || { type: 'default' };
        const newDayData = { ...existingDayData, ...data };

        // Clean up empty notes
        if (newDayData.note === '' || newDayData.note === null || newDayData.note === undefined) {
          delete newDayData.note;
        }

        // If the day is default and has no other data, remove it to save space
        if (newDayData.type === 'default' && !newDayData.note && !newDayData.pinned) {
          delete newDays[date];
        } else {
          newDays[date] = newDayData;
        }
      }
      
      return { days: newDays };
    });
  }, [activeScheduleId, updateSchedule]);
  
  const deleteYearData = useCallback((year: string) => {
    if (!activeScheduleId) return;
    const yearNumber = parseInt(year, 10);
    updateSchedule(activeScheduleId, (prevSchedule) => {
        const newDays = { ...prevSchedule.days };
        for (const dateKey in newDays) {
            if (getYear(new Date(dateKey)) === yearNumber) {
                delete newDays[dateKey].note;
                delete newDays[dateKey].pinned;
                // If day becomes default with no data, remove it
                if (newDays[dateKey].type === 'default' && !newDays[dateKey].note && !newDays[dateKey].pinned) {
                    delete newDays[dateKey];
                }
            }
        }
        return { days: newDays };
    });
  }, [activeScheduleId, updateSchedule]);

  const deleteAllEvents = useCallback(() => {
    if (!activeScheduleId) return;
    updateSchedule(activeScheduleId, (prevSchedule) => {
        const newDays = { ...prevSchedule.days };
        for (const dateKey in newDays) {
           delete newDays[dateKey].note;
           delete newDays[dateKey].pinned;
           if (newDays[dateKey].type === 'default') {
              delete newDays[dateKey];
           }
        }
        return { days: newDays };
    });
  }, [activeScheduleId, updateSchedule]);


  const activeSchedule = isLoaded ? (schedules.find(s => s.id === activeScheduleId) || null) : null;

  const value = { 
    schedules, 
    setSchedules,
    activeSchedule,
    activeScheduleId, 
    isLoaded,
    addSchedule, 
    updateSchedule,
    deleteSchedule,
    setActiveScheduleId,
    updateDay,
    duplicateSchedule,
    importFullData,
    deleteYearData,
    deleteAllEvents,
  };

  return (
    <SchedulesContext.Provider value={value}>
      {children}
    </SchedulesContext.Provider>
  );
}

export function useSchedules() {
  const context = useContext(SchedulesContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
}

    