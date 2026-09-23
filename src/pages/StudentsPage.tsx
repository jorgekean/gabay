import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Search, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { db, type Student } from '../services/db';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { isStudentAtRisk } from '../lib/utils';
import { useSettingsStore } from '../store/settingsStore';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter4Ps, setFilter4Ps] = useState(false);
  const [filterSPED, setFilterSPED] = useState(false);
  const [filterAtRisk, setFilterAtRisk] = useState(false);
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all students reactively
  const allStudentsRaw = useLiveQuery(() => db.students.toArray(), []);
  const allIncidents = useLiveQuery(() => db.incidents.toArray(), []);
  const activeSchoolYear = useSettingsStore(state => state.activeSchoolYear);

  const allStudents = allStudentsRaw?.filter(s => s.schoolYear === activeSchoolYear);

  // Compute unique filter options from the filtered students
  const uniqueGrades = Array.from(new Set(allStudents?.map(s => s.gradeLevel) || [])).sort();
  const uniqueSections = Array.from(new Set(allStudents?.map(s => s.section) || [])).sort();

  // Apply filters in memory
  const students = allStudents?.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lrn.includes(searchQuery);
      
    const matches4Ps = filter4Ps ? student.is4Ps : true;
    const matchesSPED = filterSPED ? student.isSPED : true;
    const matchesGrade = filterGrade === 'All' ? true : student.gradeLevel === filterGrade;
    const matchesSection = filterSection === 'All' ? true : student.section === filterSection;

    let matchesAtRisk = true;
    if (filterAtRisk) {
      const studentIncidents = allIncidents?.filter(i => i.studentLrn === student.lrn) || [];
      matchesAtRisk = isStudentAtRisk(studentIncidents);
    }

    return matchesSearch && matches4Ps && matchesSPED && matchesGrade && matchesSection && matchesAtRisk;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const importedStudents = results.data.map((row: any) => ({
            id: crypto.randomUUID() as string, // Default new ID, might be overridden below
            lrn: row.LRN || '',
            firstName: row.FirstName || '',
            lastName: row.LastName || '',
            gradeLevel: row.GradeLevel || '',
            section: row.Section || '',
            is4Ps: row.is4Ps?.toLowerCase() === 'yes' || String(row.is4Ps) === 'true',
            isSPED: row.isSPED?.toLowerCase() === 'yes' || String(row.isSPED) === 'true',
            isIP: row.isIP?.toLowerCase() === 'yes' || String(row.isIP) === 'true',
            dateOfBirth: row.DateOfBirth || '',
            gender: row.Gender || '',
            emergencyContactName: row.EmergencyContactName || '',
            emergencyContactRelation: row.EmergencyContactRelation || '',
            emergencyContactNumber: row.EmergencyContactNumber || '',
            schoolYear: activeSchoolYear,
          }));

          // Fetch existing students for this school year to prevent duplicates
          const existingStudents = await db.students.where('schoolYear').equals(activeSchoolYear!).toArray();
          const existingLrnMap = new Map(existingStudents.map(s => [s.lrn, s.id]));

          const studentsToUpsert = importedStudents.map(student => {
            const existingId = existingLrnMap.get(student.lrn);
            if (existingId) {
              student.id = existingId; // Use existing ID to trigger an update instead of insert
            }
            return student;
          });

          await db.students.bulkPut(studentsToUpsert);
          toast.success(`Successfully imported/updated ${studentsToUpsert.length} students`);
        } catch (error) {
          console.error(error);
          toast.error('Failed to import students. Check console for details.');
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const columns: ColumnDef<Student>[] = [
    {
      header: 'LRN',
      accessorKey: 'lrn',
      cell: (student) => <span className="font-medium">{student.lrn}</span>
    },
    {
      header: 'Name',
      cell: (student) => (
        <Link to={`/students/${student.id}`} className="font-semibold text-primary hover:underline">
          {student.lastName}, {student.firstName}
        </Link>
      )
    },
    {
      header: 'Grade/Section',
      cell: (student) => `${student.gradeLevel} - ${student.section}`
    },
    {
      header: 'Tags',
      cell: (student) => {
        const studentIncidents = allIncidents?.filter(i => i.studentLrn === student.lrn) || [];
        const isAtRisk = isStudentAtRisk(studentIncidents);
        
        return (
          <div className="flex flex-wrap gap-1">
            {isAtRisk && <Badge variant="destructive" className="animate-pulse">AT RISK</Badge>}
            {student.is4Ps && <Badge variant="4Ps">4Ps</Badge>}
            {student.isSPED && <Badge variant="SPED">SPED</Badge>}
            {student.isIP && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">IP</Badge>}
          </div>
        );
      }
    }
  ];

  const renderMobileCard = (student: Student) => {
    const studentIncidents = allIncidents?.filter(i => i.studentLrn === student.lrn) || [];
    const isAtRisk = isStudentAtRisk(studentIncidents);

    return (
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <Link to={`/students/${student.id}`} className="font-bold text-lg text-primary hover:underline block">
                {student.lastName}, {student.firstName}
              </Link>
              <div className="text-sm text-muted-foreground font-mono">{student.lrn}</div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {isAtRisk && <Badge variant="destructive" className="animate-pulse">AT RISK</Badge>}
              {student.is4Ps && <Badge variant="4Ps">4Ps</Badge>}
              {student.isSPED && <Badge variant="SPED">SPED</Badge>}
              {student.isIP && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">IP</Badge>}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {student.gradeLevel} - {student.section}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Student Master Data</h1>
          <p className="text-muted-foreground">Manage and view the complete student roster.</p>
        </div>
        <div>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-card border rounded-lg shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Name or LRN..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto pb-1 md:pb-0">
          <span className="text-sm text-muted-foreground mr-1 font-medium hidden sm:block shrink-0">Filters:</span>
          
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <select 
              className="h-10 sm:h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="All">All Grades</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select 
              className="h-10 sm:h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="All">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto mt-1 sm:mt-0">
            <div className="flex flex-1 justify-center sm:justify-start items-center space-x-2 bg-background border px-2 py-2 sm:py-1.5 rounded-lg shadow-sm">
              <Switch 
                id="filter-4ps" 
                checked={filter4Ps} 
                onCheckedChange={setFilter4Ps} 
              />
              <label htmlFor="filter-4ps" className="text-sm font-medium leading-none cursor-pointer">
                4Ps
              </label>
            </div>

            <div className="flex flex-1 justify-center sm:justify-start items-center space-x-2 bg-background border px-2 py-2 sm:py-1.5 rounded-lg shadow-sm">
              <Switch 
                id="filter-sped" 
                checked={filterSPED} 
                onCheckedChange={setFilterSPED} 
              />
              <label htmlFor="filter-sped" className="text-sm font-medium leading-none cursor-pointer">
                SPED
              </label>
            </div>

            <div className="flex flex-1 justify-center sm:justify-start items-center space-x-2 bg-red-50/50 dark:bg-red-950/20 border-red-200 border px-2 py-2 sm:py-1.5 rounded-lg shadow-sm">
              <Switch 
                id="filter-atrisk" 
                checked={filterAtRisk} 
                onCheckedChange={setFilterAtRisk} 
                className="data-[state=checked]:bg-red-600"
              />
              <label htmlFor="filter-atrisk" className="text-sm font-medium leading-none text-red-700 dark:text-red-400 cursor-pointer">
                Risk
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable 
        data={students || []} 
        columns={columns} 
        keyExtractor={(s) => s.id}
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}
