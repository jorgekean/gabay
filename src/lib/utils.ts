import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import type { Incident, Student } from "../services/db"

export function isStudentAtRisk(student: Student, incidents: Incident[]): boolean {
  if (!incidents || incidents.length === 0) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentIncidents = incidents.filter(inc => new Date(inc.incidentDate) >= thirtyDaysAgo);

  const majorOffenses = recentIncidents.filter(inc => inc.type === 'Major Offense').length;
  const minorOffenses = recentIncidents.filter(inc => inc.type === 'Minor Offense').length;
  const truancy = recentIncidents.filter(inc => inc.category.toLowerCase().includes('truancy') || inc.category.toLowerCase().includes('absence')).length;

  // Stricter thresholds for 4Ps beneficiaries to prevent subsidy loss
  const thresholds = student.is4Ps 
    ? { major: 2, minor: 3, truancy: 2 } 
    : { major: 3, minor: 5, truancy: 3 };

  return (
    majorOffenses >= thresholds.major ||
    minorOffenses >= thresholds.minor ||
    truancy >= thresholds.truancy
  );
}
