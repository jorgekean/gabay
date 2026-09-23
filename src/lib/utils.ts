import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Incident } from "../services/db"

export function isStudentAtRisk(incidents: Incident[]): boolean {
  if (!incidents || incidents.length === 0) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const majorOffensesInLast30Days = incidents.filter(inc => {
    return inc.type === 'Major Offense' && new Date(inc.incidentDate) >= thirtyDaysAgo;
  });

  return majorOffensesInLast30Days.length >= 3;
}
