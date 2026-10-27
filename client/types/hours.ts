export interface Shift {
  open: string;
  close: string;
}

export interface DayHours {
  day: number;
  closed: boolean;
  shifts: Shift[];
}

export interface OpenStatus {
  isOpen: boolean;
  today: number;
  closesAt: string | null;
  nextOpen: { offset: number; day: number; time: string } | null;
}
