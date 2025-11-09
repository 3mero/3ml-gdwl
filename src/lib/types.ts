

export type DayType = 'default' | 'work' | 'holiday';

export interface DayData {
  note?: string;
  pinned?: boolean;
  type: DayType;
}

export interface Schedule {
  id: string;
  name: string;
  startDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 for Sunday
  days: { [date: string]: DayData }; // "YYYY-MM-DD" -> DayData
  monthsToShow: number;
  startDate?: string; // YYYY-MM-DD
  monthBackgrounds?: { [monthKey: string]: string }; // "YYYY-MM" -> color
}

export interface BackgroundColors {
    page: string;
    header: string;
    controls: string;
    container: string;
    dayNumber: string;
    monthName: string;
    workDay: string;
    holidayDay: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  colors: BackgroundColors;
}

export type CalendarSource = 'google' | 'officeholidays' | 'custom';

export interface ViewSettings {
    zoomLevel: number;
    gridCols: number;
    backgroundColors: BackgroundColors;
    tickerSpeed: number;
    showTicker: boolean;
    colorPresets: ColorPreset[];
    customHolidayCalendars: { [key: string]: string };
    lastHolidaySource: CalendarSource | null;
    lastHolidayCountry: string | null;
    customHolidayNames: Record<string, string>;
    hiddenHolidays: string[];
    holidayTranslations: Record<string, string>;
    hasSeenRotationTip?: boolean;
}

export interface FullExport {
    schedules: Schedule[];
    viewSettings: ViewSettings;
}

// Represents a theme file for export/import
export interface ThemeFile {
    name: string;
    colors: BackgroundColors;
}

export interface HolidayEvent {
  uid: string;
  date: string;
  originalSummary: string;
  description: string;
}

    
