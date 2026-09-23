import { useState } from 'react';
import { Plus, Download, Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { db } from '../services/db';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { NewIncidentForm } from '../components/incidents/NewIncidentForm';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';

import { useSettingsStore } from '../store/settingsStore';

export default function IncidentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const activeSchoolYear = useSettingsStore(state => state.activeSchoolYear);

  // Fetch incidents joined with student data
  const rawIncidentsWithStudents = useLiveQuery(async () => {
    const rawIncidents = await db.incidents.toArray();
    const students = await db.students.toArray();
    
    // Filter by active school year
    const activeIncidents = rawIncidents.filter(inc => inc.schoolYear === activeSchoolYear);

    // Map student data to incidents for display
    return activeIncidents.map(inc => {
      const student = students.find(s => s.lrn === inc.studentLrn);
      return {
        ...inc,
        studentName: student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student',
        gradeSection: student ? `${student.gradeLevel} - ${student.section}` : 'N/A'
      };
    }).sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }, [activeSchoolYear]);

  const uniqueTypes = Array.from(new Set(rawIncidentsWithStudents?.map(i => i.type) || [])).sort();
  const uniqueCategories = Array.from(new Set(rawIncidentsWithStudents?.map(i => i.category) || [])).sort();

  const filteredIncidents = rawIncidentsWithStudents?.filter(inc => {
    const matchesType = filterType === 'All' ? true : inc.type === filterType;
    const matchesCategory = filterCategory === 'All' ? true : inc.category === filterCategory;
    return matchesType && matchesCategory;
  });

  const handleExport = () => {
    if (!filteredIncidents || filteredIncidents.length === 0) return;
    
    const exportData = filteredIncidents.map(inc => ({
      Date: new Date(inc.incidentDate).toLocaleString(),
      Student: inc.studentName,
      'Grade/Section': inc.gradeSection,
      Type: inc.type,
      Category: inc.category,
      Description: inc.description,
      Reporter: inc.reporter || 'N/A',
      Status: inc.status,
      'Sync Status': inc.syncStatus
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Incidents_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Date & Time',
      cell: (inc) => new Date(inc.incidentDate).toLocaleString()
    },
    {
      header: 'Student',
      cell: (inc) => (
        <div>
          <div className="font-medium">{inc.studentName}</div>
          <div className="text-xs text-muted-foreground">{inc.gradeSection}</div>
        </div>
      )
    },
    {
      header: 'Type & Category',
      cell: (inc) => (
        <div>
          <Badge variant={inc.type === 'Major Offense' ? 'destructive' : inc.type === 'Positive Anecdote' ? 'default' : 'secondary'}>
            {inc.type}
          </Badge>
          <div className="text-sm mt-1">{inc.category}</div>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (inc) => {
        let colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
        if (inc.status === 'Open') colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
        else if (inc.status === 'Under Investigation') colorClass = 'bg-purple-100 text-purple-800 border-purple-300';
        else if (inc.status === 'Parent Conference Scheduled') colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
        else if (inc.status === 'Resolved') colorClass = 'bg-green-100 text-green-800 border-green-300';
        
        return (
          <Badge variant="outline" className={colorClass}>
            {inc.status}
          </Badge>
        );
      }
    },
    {
      header: 'Sync Status',
      cell: (inc) => (
        <Badge variant={inc.syncStatus === 'Synced' ? 'default' : 'outline'} className={inc.syncStatus === 'Pending' ? 'text-amber-600 border-amber-300 bg-amber-50' : 'bg-green-100 text-green-800'}>
          {inc.syncStatus}
        </Badge>
      )
    }
  ];

  const renderMobileCard = (inc: any) => (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <Badge variant={inc.type === 'Major Offense' ? 'destructive' : inc.type === 'Positive Anecdote' ? 'default' : 'secondary'}>
            {inc.type}
          </Badge>
          <Badge variant="outline" className={inc.syncStatus === 'Pending' ? 'text-amber-600 border-amber-300 bg-amber-50' : 'bg-green-100 text-green-800'}>
            {inc.syncStatus}
          </Badge>
        </div>
        <div>
          <div className="font-bold">{inc.studentName}</div>
          <div className="text-sm text-muted-foreground">{inc.gradeSection}</div>
        </div>
        <div className="text-sm">
          <span className="font-semibold">{inc.category}:</span> {inc.description}
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-muted-foreground">{new Date(inc.incidentDate).toLocaleString()}</span>
          <Badge variant="outline" className={
            inc.status === 'Open' ? 'bg-blue-100 text-blue-800 border-blue-300' :
            inc.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800 border-purple-300' :
            inc.status === 'Parent Conference Scheduled' ? 'bg-amber-100 text-amber-800 border-amber-300' :
            inc.status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }>
            {inc.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Log and track student behaviors and anecdotes.</p>
        </div>
        
        <div className="flex w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
          <Link 
            to={`/incidents/print?type=${encodeURIComponent(filterType)}&category=${encodeURIComponent(filterCategory)}`}
            target="_blank"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Redacted</span>
          </Link>
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Log Incident
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-card border rounded-2xl shadow-sm">
        <span className="text-sm text-muted-foreground font-medium hidden md:block shrink-0">Filters:</span>
        <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
          <select 
            className="h-10 md:h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            className="h-10 md:h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <DataTable 
        data={filteredIncidents || []} 
        columns={columns} 
        keyExtractor={(inc) => inc.id}
        renderMobileCard={renderMobileCard}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Log New Incident"
        description="Record an offense or positive anecdote. It will be saved offline immediately."
      >
        <NewIncidentForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
