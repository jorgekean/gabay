import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { FileWarning, RefreshCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../services/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { isStudentAtRisk } from '../lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const activeSchoolYear = useSettingsStore((state) => state.activeSchoolYear);

  const data = useLiveQuery(async () => {
    const rawIncidents = await db.incidents.toArray();
    const allStudents = await db.students.toArray();
    
    // Filter incidents and students by active school year
    const activeIncidents = rawIncidents.filter(inc => inc.schoolYear === activeSchoolYear);
    const activeStudents = allStudents.filter(s => s.schoolYear === activeSchoolYear);
    


    // KPI 1: Incidents this month (filtered by SY)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const incidentsThisMonth = activeIncidents.filter(inc => {
      const date = new Date(inc.incidentDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // KPI 2: Pending Syncs (all incidents)
    const pendingSyncs = rawIncidents.filter(inc => inc.syncStatus === 'Pending').length;

    // KPI 3: At-Risk Students (based on active SY incidents)
    const atRiskStudents = activeStudents.filter(student => {
      const studentIncidents = activeIncidents.filter(i => i.studentLrn === student.lrn);
      return isStudentAtRisk(student, studentIncidents);
    });

    // Chart Data: Incidents by Grade Level (This Month, filtered by SY)
    const gradeCounts: Record<string, number> = {};
    activeIncidents.forEach(inc => {
      const date = new Date(inc.incidentDate);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const student = activeStudents.find(s => s.lrn === inc.studentLrn);
        if (student) {
          gradeCounts[student.gradeLevel] = (gradeCounts[student.gradeLevel] || 0) + 1;
        }
      }
    });
    
    const chartData = Object.keys(gradeCounts).map(key => ({
      name: key,
      count: gradeCounts[key]
    })).sort((a, b) => {
      // Sort logically by grade (e.g., Grade 7, Grade 8)
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // Recent Incidents (Last 5, filtered by SY)
    const recentIncidents = activeIncidents
      .sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime())
      .slice(0, 5)
      .map(inc => {
        const student = activeStudents.find(s => s.lrn === inc.studentLrn);
        return {
          ...inc,
          studentName: student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student',
          gradeSection: student ? `${student.gradeLevel} - ${student.section}` : 'N/A',
          studentProfileId: student?.id
        };
      });

    return { incidentsThisMonth, pendingSyncs, atRiskStudents, chartData, recentIncidents };
  }, [activeSchoolYear]);

  if (!data) return <div className="p-4 text-muted-foreground">Loading dashboard...</div>;

  const showSardoList = user?.role === 'Guidance' || user?.role === 'Admin';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Triage Dashboard</h1>
        <p className="text-muted-foreground">Overview of school behavioral metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Incidents This Month</span>
              <FileWarning className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold">{data.incidentsThisMonth}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">Pending Syncs</span>
              <RefreshCcw className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold">{data.pendingSyncs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm font-medium">At-Risk Students</span>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">{data.atRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">3+ Major Offenses (30 days)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidents by Grade Level (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(234, 88, 12, 0.1)' }} />
                    <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No data to display for this month.
              </div>
            )}
          </CardContent>
        </Card>

        {/* SARDO Prioritization List (Guidance/Admin only) */}
        {showSardoList && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Priority Interventions (SARDO)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.atRiskStudents.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No students currently flagged as At-Risk.
                </div>
              ) : (
                <div className="divide-y max-h-64 overflow-y-auto">
                  {data.atRiskStudents.map(student => (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-semibold text-foreground">
                          {student.lastName}, {student.firstName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.gradeLevel} - {student.section}
                        </div>
                      </div>
                      <Link to={`/students/${student.id}`} className="text-sm font-medium text-primary hover:underline">
                        Review Case
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Incidents Feed */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Incidents</h2>
        <div className="flex flex-col gap-3">
          {data.recentIncidents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent incidents logged.</p>
          ) : (
            data.recentIncidents.map(inc => (
              <Card key={inc.id} className="shadow-sm hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {inc.studentProfileId ? (
                        <Link to={`/students/${inc.studentProfileId}`} className="font-semibold hover:underline">
                          {inc.studentName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{inc.studentName}</span>
                      )}
                      <span className="text-xs text-muted-foreground border-l pl-2">{inc.gradeSection}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{inc.category}:</span> {inc.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(inc.incidentDate).toLocaleString()} {inc.reporter ? `• Reported by ${inc.reporter}` : ''}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 justify-between shrink-0">
                    <Badge variant={inc.type === 'Major Offense' ? 'destructive' : inc.type === 'Positive Anecdote' ? 'default' : inc.type === 'Counseling Note' ? 'outline' : 'secondary'}>
                      {inc.type}
                    </Badge>
                    {inc.studentProfileId && (
                      <Link to={`/students/${inc.studentProfileId}`} className="text-xs text-primary flex items-center hover:underline">
                        View Profile <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
