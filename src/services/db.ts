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

export const seedDatabase = async () => {
  const count = await db.students.count();
  if (count > 0) return; // Already seeded

  const mockStudents: Student[] = [
    { id: 'a1b2c3d4-0001-4a1b-8c9d-111111111111', lrn: '102938475612', firstName: 'Juan', lastName: 'Dela Cruz', gradeLevel: 'Grade 10', section: 'Rizal', is4Ps: true, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0002-4a1b-8c9d-222222222222', lrn: '102938475613', firstName: 'Maria', lastName: 'Clara', gradeLevel: 'Grade 10', section: 'Rizal', is4Ps: false, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0003-4a1b-8c9d-333333333333', lrn: '102938475614', firstName: 'Jose', lastName: 'Bonifacio', gradeLevel: 'Grade 9', section: 'Mabini', is4Ps: true, isSPED: false, isIP: true, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0004-4a1b-8c9d-444444444444', lrn: '102938475615', firstName: 'Ana', lastName: 'Reyes', gradeLevel: 'Grade 9', section: 'Mabini', is4Ps: false, isSPED: true, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0005-4a1b-8c9d-555555555555', lrn: '102938475616', firstName: 'Pedro', lastName: 'Penduko', gradeLevel: 'Grade 8', section: 'Bonifacio', is4Ps: true, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0006-4a1b-8c9d-666666666666', lrn: '102938475617', firstName: 'Leonor', lastName: 'Rivera', gradeLevel: 'Grade 8', section: 'Bonifacio', is4Ps: false, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0007-4a1b-8c9d-777777777777', lrn: '102938475618', firstName: 'Apolinario', lastName: 'Mabini', gradeLevel: 'Grade 7', section: 'Aguinaldo', is4Ps: true, isSPED: true, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0008-4a1b-8c9d-888888888888', lrn: '102938475619', firstName: 'Gabriela', lastName: 'Silang', gradeLevel: 'Grade 7', section: 'Aguinaldo', is4Ps: false, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0009-4a1b-8c9d-999999999999', lrn: '102938475620', firstName: 'Emilio', lastName: 'Jacinto', gradeLevel: 'Grade 10', section: 'Quezon', is4Ps: true, isSPED: false, isIP: false, schoolYear: '2026-2027' },
    { id: 'a1b2c3d4-0010-4a1b-8c9d-000000000000', lrn: '102938475621', firstName: 'Melchora', lastName: 'Aquino', gradeLevel: 'Grade 10', section: 'Quezon', is4Ps: false, isSPED: false, isIP: false, schoolYear: '2026-2027' },
  ];

  await db.students.bulkPut(mockStudents);

  const mockIncidents: Incident[] = [
    { id: 'inc-0001', studentLrn: '102938475612', type: 'Major Offense', category: 'Vaping', description: 'Caught vaping in the comfort room during recess.', incidentDate: new Date(Date.now() - 86400000 * 2).toISOString(), schoolYear: '2026-2027', location: 'Canteen', reporter: 'Mr. Cruz', status: 'Under Investigation', syncStatus: 'Pending' },
    { id: 'inc-0002', studentLrn: '102938475612', type: 'Minor Offense', category: 'Dress Code', description: 'Wearing improper uniform for the 3rd time this week.', incidentDate: new Date(Date.now() - 86400000 * 5).toISOString(), schoolYear: '2026-2027', location: 'Gate', reporter: 'Guard Santos', status: 'Resolved', syncStatus: 'Synced' },
    { id: 'inc-0003', studentLrn: '102938475613', type: 'Positive Anecdote', category: 'Honesty', description: 'Returned a lost wallet to the principal\'s office.', incidentDate: new Date(Date.now() - 86400000 * 1).toISOString(), schoolYear: '2026-2027', location: 'Hallway', reporter: 'Ms. Reyes', status: 'Closed', syncStatus: 'Synced' },
    { id: 'inc-0004', studentLrn: '102938475614', type: 'Major Offense', category: 'Bullying', description: 'Involved in a physical altercation with another student in Grade 8.', incidentDate: new Date().toISOString(), schoolYear: '2026-2027', location: 'Quadrangle', reporter: 'Mr. Cruz', status: 'Open', syncStatus: 'Pending' },
    { id: 'inc-0005', studentLrn: '102938475615', type: 'Counseling Note', category: 'Academic Intervention', description: 'Student expressed difficulty keeping up with Math modules. Will schedule a follow-up session.', incidentDate: new Date(Date.now() - 86400000 * 10).toISOString(), schoolYear: '2026-2027', location: 'Guidance Office', reporter: 'Guidance Counselor', status: 'Parent Conference Scheduled', syncStatus: 'Synced' },
    { id: 'inc-0006', studentLrn: '102938475612', type: 'Major Offense', category: 'Truancy', description: 'Skipped classes after lunch without permission.', incidentDate: new Date(Date.now() - 86400000 * 15).toISOString(), schoolYear: '2026-2027', location: 'Outside Campus', reporter: 'Mr. Cruz', status: 'Resolved', syncStatus: 'Synced' }, // 3rd major offense for Juan Dela Cruz to trigger SARDO
    { id: 'inc-0007', studentLrn: '102938475612', type: 'Major Offense', category: 'Vandalism', description: 'Defaced school property.', incidentDate: new Date(Date.now() - 86400000 * 20).toISOString(), schoolYear: '2026-2027', location: 'Classroom', reporter: 'Ms. Reyes', status: 'Resolved', syncStatus: 'Synced' }
  ];

  await db.incidents.bulkPut(mockIncidents);
  console.log('Database seeded with 10 mock students and 7 mock incidents.');
};
