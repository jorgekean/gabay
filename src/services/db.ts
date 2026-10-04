import Dexie, { type EntityTable } from 'dexie';


export interface Student {
  id: string;
  lrn: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  section: string;
  dateOfBirth?: string;
  gender?: string;
  is4Ps: boolean;
  isSPED: boolean;
  isIP: boolean;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  schoolYear?: string; // Defines which academic year this record belongs to
  syncStatus?: 'Synced' | 'Pending';
}

export interface Incident {
  id: string;
  studentLrn: string; // Changed from studentId to link across yearly student snapshots
  type: string;
  category: string;
  description: string;
  incidentDate: string; // ISO String
  schoolYear?: string; // e.g. "2026-2027"
  location?: string;
  reporter?: string;
  status: 'Open' | 'Under Investigation' | 'Parent Conference Scheduled' | 'Resolved' | 'Closed';
  syncStatus: 'Synced' | 'Pending';
  counselingNotes?: string;
}

export const db = new Dexie('StudentHRIS') as Dexie & {
  students: EntityTable<Student, 'id'>;
  incidents: EntityTable<Incident, 'id'>;
};

// Schema declaration
db.version(1).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps', // Indexed fields
  incidents: 'id, studentId, type, status, syncStatus'
});

db.version(2).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP', 
  incidents: 'id, studentId, type, status, syncStatus, reporter'
}).upgrade(tx => {
  // Add missing boolean fields for existing records
  return tx.table('students').toCollection().modify(student => {
    if (student.isIP === undefined) student.isIP = false;
  });
});

db.version(3).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP', 
  incidents: 'id, studentId, type, status, syncStatus, reporter, schoolYear'
});

db.version(4).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP, schoolYear', 
  incidents: 'id, studentLrn, type, status, syncStatus, reporter, schoolYear'
}).upgrade(async tx => {
  // Migrate existing incidents from studentId to studentLrn
  const students = await tx.table('students').toArray();
  const studentMap = new Map(students.map(s => [s.id, s.lrn]));
  
  return tx.table('incidents').toCollection().modify(inc => {
    if (inc.studentId) {
      inc.studentLrn = studentMap.get(inc.studentId) || inc.studentId;
      delete inc.studentId;
    }
  });
});

db.version(5).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP, schoolYear', 
  incidents: 'id, studentLrn, type, status, syncStatus, reporter, schoolYear'
}).upgrade(async tx => {
  // Ensure all legacy students and incidents have a schoolYear assigned
  await tx.table('students').toCollection().modify(student => {
    if (!student.schoolYear) {
      student.schoolYear = '2026-2027';
    }
  });
  
  await tx.table('incidents').toCollection().modify(inc => {
    if (!inc.schoolYear) {
      inc.schoolYear = '2026-2027';
    }
  });
});

db.version(6).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP, schoolYear', 
  incidents: 'id, studentLrn, type, status, syncStatus, reporter, schoolYear' // counselingNotes is not indexed, so no change in string
});

db.version(7).stores({
  students: 'id, lrn, lastName, gradeLevel, is4Ps, isIP, schoolYear, syncStatus', 
  incidents: 'id, studentLrn, type, status, syncStatus, reporter, schoolYear'
}).upgrade(async tx => {
  await tx.table('students').toCollection().modify(student => {
    if (!student.syncStatus) {
      student.syncStatus = 'Synced';
    }
  });
});

import { encryptData, decryptData } from '../lib/encryption';

db.incidents.hook('creating', function (_primKey, obj, _transaction) {
  if (obj.counselingNotes) {
    obj.counselingNotes = encryptData(obj.counselingNotes);
  }
});

db.incidents.hook('updating', function (mods, _primKey, _obj, _transaction) {
  const modsAny = mods as any;
  if (modsAny.hasOwnProperty('counselingNotes') && modsAny.counselingNotes !== undefined) {
    return { counselingNotes: encryptData(modsAny.counselingNotes as string) };
  }
});

db.incidents.hook('reading', function (obj) {
  if (obj.counselingNotes) {
    obj.counselingNotes = decryptData(obj.counselingNotes);
  }
  return obj;
});

// --- Student Encryption Hooks ---
const encryptStudent = (student: any) => {
  if (student.firstName) student.firstName = encryptData(student.firstName);
  if (student.lastName) student.lastName = encryptData(student.lastName);
  if (student.emergencyContactName) student.emergencyContactName = encryptData(student.emergencyContactName);
  if (student.emergencyContactRelation) student.emergencyContactRelation = encryptData(student.emergencyContactRelation);
  if (student.emergencyContactNumber) student.emergencyContactNumber = encryptData(student.emergencyContactNumber);
};

db.students.hook('creating', function (_primKey, obj, _transaction) {
  encryptStudent(obj);
});

db.students.hook('updating', function (mods, _primKey, _obj, _transaction) {
  const newMods: any = { ...mods };
  const modsAny = mods as any;
  if (modsAny.hasOwnProperty('firstName') && modsAny.firstName !== undefined) newMods.firstName = encryptData(modsAny.firstName as string);
  if (modsAny.hasOwnProperty('lastName') && modsAny.lastName !== undefined) newMods.lastName = encryptData(modsAny.lastName as string);
  if (modsAny.hasOwnProperty('emergencyContactName') && modsAny.emergencyContactName !== undefined) newMods.emergencyContactName = encryptData(modsAny.emergencyContactName as string);
  if (modsAny.hasOwnProperty('emergencyContactRelation') && modsAny.emergencyContactRelation !== undefined) newMods.emergencyContactRelation = encryptData(modsAny.emergencyContactRelation as string);
  if (modsAny.hasOwnProperty('emergencyContactNumber') && modsAny.emergencyContactNumber !== undefined) newMods.emergencyContactNumber = encryptData(modsAny.emergencyContactNumber as string);
  return newMods;
});

db.students.hook('reading', function (obj) {
  if (obj.firstName) obj.firstName = decryptData(obj.firstName) as string;
  if (obj.lastName) obj.lastName = decryptData(obj.lastName) as string;
  if (obj.emergencyContactName) obj.emergencyContactName = decryptData(obj.emergencyContactName) as string;
  if (obj.emergencyContactRelation) obj.emergencyContactRelation = decryptData(obj.emergencyContactRelation) as string;
  if (obj.emergencyContactNumber) obj.emergencyContactNumber = decryptData(obj.emergencyContactNumber) as string;
  return obj;
});
