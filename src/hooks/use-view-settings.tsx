

"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import { ViewSettings, BackgroundColors, ColorPreset, CalendarSource } from '@/lib/types';
import { uuidv4 } from '@/lib/utils';


interface ViewSettingsContextType {
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  gridCols: number;
  setGridCols: (cols: number) => void;
  backgroundColors: BackgroundColors;
  setBackgroundColors: (colors: BackgroundColors | ((prev: BackgroundColors) => BackgroundColors)) => void;
  tickerSpeed: number;
  setTickerSpeed: (speed: number) => void;
  showTicker: boolean;
  setShowTicker: (show: boolean) => void;
  viewSettings: ViewSettings;
  importViewSettingsData: (data: Partial<ViewSettings>) => void;
  colorPresets: ColorPreset[];
  saveColorPreset: (name: string, colors: BackgroundColors) => void;
  deleteColorPreset: (id: string) => void;
  applyColorPreset: (colors: BackgroundColors) => void;
  customHolidayCalendars: { [countryCode: string]: string };
  saveCustomHolidayCalendar: (key: string, url: string) => void;
  deleteCustomHolidayCalendar: (key: string) => void;
  lastHolidaySource: CalendarSource | null;
  setLastHolidaySource: (source: CalendarSource | null) => void;
  lastHolidayCountry: string | null;
  setLastHolidayCountry: (country: string | null) => void;
  customHolidayNames: Record<string, string>;
  saveCustomHolidayName: (key: string, name: string) => void;
  hiddenHolidays: string[];
  addHiddenHoliday: (key: string) => void;
  removeHiddenHoliday: (key: string) => void;
  holidayTranslations: Record<string, string>;
  setHolidayTranslations: (translations: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  hasSeenRotationTip: boolean;
  setHasSeenRotationTip: (seen: boolean) => void;
}

const ViewSettingsContext = createContext<ViewSettingsContextType | undefined>(undefined);

export const defaultViewSettings: ViewSettings = {
    zoomLevel: 1,
    gridCols: 3,
    backgroundColors: {
      page: 'hsl(220 14% 10%)',
      header: 'hsl(220 14% 10%)',
      controls: 'hsl(220 14% 10%)',
      container: 'hsl(220 14% 12%)',
      monthName: 'hsl(var(--primary))',
      monthNumber: 'hsl(var(--muted-foreground))',
      monthHeaderBackground: 'hsl(var(--accent) / 0.5)',
      workDay: '#10B981',
      holidayDay: 'transparent',
    },
    tickerSpeed: 8,
    showTicker: true,
    colorPresets: [],
    customHolidayCalendars: {},
    lastHolidaySource: null,
    lastHolidayCountry: null,
    customHolidayNames: {},
    hiddenHolidays: [],
    holidayTranslations: {},
    hasSeenRotationTip: false,
}

const mergeDeep = (target: any, source: any) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};


export function ViewSettingsProvider({ children }: { children: ReactNode }) {
  const [viewSettings, setViewSettings] = useLocalStorage<ViewSettings>('viewSettings', defaultViewSettings);

  // This function ensures that any new default settings are added to existing user settings
  // without overwriting the user's customizations.
  const getMergedSettings = useCallback((userSettings: ViewSettings): ViewSettings => {
    // Start with the defaults, then layer the user's saved settings on top.
    // mergeDeep ensures nested objects like `backgroundColors` are also merged correctly.
    return mergeDeep(defaultViewSettings, userSettings);
  }, []);

  const currentSettings = getMergedSettings(viewSettings);


  const setZoomLevel = (zoomLevel: number) => {
    setViewSettings(prev => ({...getMergedSettings(prev), zoomLevel}));
  }

  const setGridCols = (gridCols: number) => {
    setViewSettings(prev => ({...getMergedSettings(prev), gridCols}));
  }

  const setBackgroundColors = (newColors: BackgroundColors | ((prev: BackgroundColors) => BackgroundColors)) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const resolvedColors = typeof newColors === 'function' ? newColors(merged.backgroundColors) : newColors;
        return {...merged, backgroundColors: resolvedColors};
    });
  }
  
  const setTickerSpeed = (tickerSpeed: number) => {
    setViewSettings(prev => ({ ...getMergedSettings(prev), tickerSpeed }));
  };

  const setShowTicker = (showTicker: boolean) => {
    setViewSettings(prev => ({ ...getMergedSettings(prev), showTicker }));
  }
  
  const setLastHolidaySource = (source: CalendarSource | null) => {
    setViewSettings(prev => ({ ...getMergedSettings(prev), lastHolidaySource: source }));
  };

  const setLastHolidayCountry = (country: string | null) => {
      setViewSettings(prev => ({ ...getMergedSettings(prev), lastHolidayCountry: country }));
  };

  const importViewSettingsData = (data: Partial<ViewSettings>) => {
    setViewSettings(prev => getMergedSettings({...prev, ...data}));
  }

  const saveColorPreset = (name: string, colors: BackgroundColors) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const newPreset: ColorPreset = { id: uuidv4(), name, colors };
        const updatedPresets = [newPreset, ...merged.colorPresets].slice(0, 3);
        return {...merged, colorPresets: updatedPresets };
    });
  }

  const deleteColorPreset = (id: string) => {
      setViewSettings(prev => {
          const merged = getMergedSettings(prev);
          const updatedPresets = merged.colorPresets.filter(p => p.id !== id);
          return {...merged, colorPresets: updatedPresets };
      });
  }

  const applyColorPreset = (colors: BackgroundColors) => {
      setBackgroundColors(colors);
  };

  const saveCustomHolidayCalendar = (key: string, url: string) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const newCustomCalendars = { ...(merged.customHolidayCalendars || {}), [key]: url };
        return { ...merged, customHolidayCalendars: newCustomCalendars };
    });
  };

  const deleteCustomHolidayCalendar = (key: string) => {
    setViewSettings(prev => {
      const merged = getMergedSettings(prev);
      const newCustomCalendars = { ...(merged.customHolidayCalendars || {}) };
      delete newCustomCalendars[key];
      return { ...merged, customHolidayCalendars: newCustomCalendars };
    });
  };

  const saveCustomHolidayName = (key: string, name: string) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const newCustomNames = { ...merged.customHolidayNames, [key]: name };
        return { ...merged, customHolidayNames: newCustomNames };
    });
  };

  const addHiddenHoliday = (key: string) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        if (merged.hiddenHolidays.includes(key)) return merged;
        const newHiddenHolidays = [...merged.hiddenHolidays, key];
        return { ...merged, hiddenHolidays: newHiddenHolidays };
    });
  };

  const removeHiddenHoliday = (key: string) => {
    setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const newHiddenHolidays = merged.hiddenHolidays.filter(hKey => hKey !== key);
        return { ...merged, hiddenHolidays: newHiddenHolidays };
    });
  };

  const setHolidayTranslations = (translations: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
     setViewSettings(prev => {
        const merged = getMergedSettings(prev);
        const resolvedTranslations = typeof translations === 'function' ? translations(merged.holidayTranslations) : translations;
        return {...merged, holidayTranslations: resolvedTranslations };
    });
  }
  
  const setHasSeenRotationTip = (seen: boolean) => {
    setViewSettings(prev => ({ ...getMergedSettings(prev), hasSeenRotationTip: seen }));
  };


  const value = {
    zoomLevel: currentSettings.zoomLevel,
    gridCols: currentSettings.gridCols,
    backgroundColors: currentSettings.backgroundColors,
    tickerSpeed: currentSettings.tickerSpeed,
    showTicker: currentSettings.showTicker,
    setZoomLevel,
    setGridCols,
    setBackgroundColors,
    setTickerSpeed,
    setShowTicker,
    viewSettings: currentSettings,
    importViewSettingsData,
    colorPresets: currentSettings.colorPresets,
    saveColorPreset,
    deleteColorPreset,
    applyColorPreset,
    customHolidayCalendars: currentSettings.customHolidayCalendars || {},
    saveCustomHolidayCalendar,
    deleteCustomHolidayCalendar,
    lastHolidaySource: currentSettings.lastHolidaySource,
    setLastHolidaySource,
    lastHolidayCountry: currentSettings.lastHolidayCountry,
    setLastHolidayCountry,
    customHolidayNames: currentSettings.customHolidayNames,
    saveCustomHolidayName,
    hiddenHolidays: currentSettings.hiddenHolidays,
    addHiddenHoliday,
    removeHiddenHoliday,
    holidayTranslations: currentSettings.holidayTranslations,
    setHolidayTranslations,
    hasSeenRotationTip: currentSettings.hasSeenRotationTip || false,
    setHasSeenRotationTip,
  };

  return (
    <ViewSettingsContext.Provider value={value}>
      {children}
    </ViewSettingsContext.Provider>
  );
}

export function useViewSettings() {
  const context = useContext(ViewSettingsContext);
  if (context === undefined) {
    throw new Error('useViewSettings must be used within a ViewSettingsProvider');
  }
  return context;
}
