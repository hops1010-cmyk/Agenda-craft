import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function calculateTimeSlot(startMilitaryMinutes: number, durationMinutes: number): { startStr: string; endStr: string } {
  const formatTime = (totalMin: number) => {
    const wrappedMin = ((totalMin % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h24 = Math.floor(wrappedMin / 60);
    const m = wrappedMin % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return {
    startStr: formatTime(startMilitaryMinutes),
    endStr: formatTime(startMilitaryMinutes + durationMinutes),
  };
}

export function parseTimeToMinutes(timeStr: string): number {
  // e.g. "09:30 AM" or "14:00"
  try {
    const clean = timeStr.trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const numbersPart = clean.replace(/[APMapm\s]/g, '');
    const [hStr, mStr] = numbersPart.split(':');
    let hours = parseInt(hStr, 10) || 9;
    const minutes = parseInt(mStr, 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch {
    return 9 * 60; // 9:00 AM default
  }
}
