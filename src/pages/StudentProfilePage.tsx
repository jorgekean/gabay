import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, UserCircle2, Printer } from 'lucide-react';
import { db } from '../services/db';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { cn, isStudentAtRisk } from '../lib/utils';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();

  const data = useLiveQuery(async () => {
    if (!id) return null;
    const student = await db.students.get(id);
    if (!student) return null;
    
    const incidents = await db.incidents.where('studentLrn').equals(student.lrn).toArray();
    incidents.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
    
    return { student, incidents };
  }, [id]);

  if (data === undefined) return <div className="p-4 text-muted-foreground">Loading profile...</div>;
  if (data === null) return <div className="p-4 text-destructive font-semibold">Student not found.</div>;

  const { student, incidents } = data;
  const isAtRisk = isStudentAtRisk(incidents);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Major Offense': return 'bg-red-500';
      case 'Minor Offense': return 'bg-amber-500';
      case 'Positive Anecdote': return 'bg-green-500';
      case 'Counseling Note': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Top Nav */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/students" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roster
        </Link>
        <Link 
          to={`/students/${id}/print`} 
          className="inline-flex items-center text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          target="_blank"
        >
          <Printer className="mr-2 h-4 w-4" />
          Export Report
        </Link>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/30">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="bg-primary/10 p-4 rounded-full relative">
            <UserCircle2 className="h-24 w-24 text-primary" />
          </div>
          <div className="flex flex-col gap-2 flex-1 pt-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {student.lastName}, {student.firstName}
            </h1>
            <div className="text-lg text-muted-foreground font-mono">
              LRN: {student.lrn}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Grade/Section:</span> {student.gradeLevel} - {student.section}</div>
              {student.dateOfBirth && <div><span className="font-medium text-muted-foreground">DOB:</span> {student.dateOfBirth}</div>}
              {student.gender && <div><span className="font-medium text-muted-foreground">Gender:</span> {student.gender}</div>}
            </div>
            
            {(student.emergencyContactName || student.emergencyContactNumber) && (
              <div className="mt-2 text-sm bg-background/50 p-2 rounded-md border text-left">
                <span className="font-medium text-muted-foreground block mb-1">Emergency Contact:</span>
                <div className="font-semibold">{student.emergencyContactName} {student.emergencyContactRelation ? `(${student.emergencyContactRelation})` : ''}</div>
                <div>{student.emergencyContactNumber}</div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {isAtRisk && <Badge variant="destructive" className="animate-pulse shadow-sm">AT RISK (SARDO)</Badge>}
              {student.is4Ps && <Badge variant="4Ps">4Ps Beneficiary</Badge>}
              {student.isSPED && <Badge variant="SPED">SPED Student</Badge>}
              {student.isIP && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">IP Student</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">Behavioral Timeline</h2>
        
        {incidents.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center border rounded-lg border-dashed">
            No incidents recorded for this student.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 py-4 border-l-2 border-muted space-y-8">
            {incidents.map((inc) => (
              <div key={inc.id} className="relative">
                {/* Timeline Dot */}
                <div 
                  className={cn(
                    "absolute -left-[35px] sm:-left-[41px] top-1.5 h-4 w-4 rounded-full border-4 border-background",
                    getTypeColor(inc.type)
                  )}
                />
                
                {/* Timeline Content */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          <span>{new Date(inc.incidentDate).toLocaleString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                          })}</span>
                          {inc.schoolYear && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] h-5 py-0 px-1.5">{inc.schoolYear}</Badge>
                            </>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{inc.category}</h3>
                      </div>
                      <Badge variant={inc.type === 'Major Offense' ? 'destructive' : inc.type === 'Positive Anecdote' ? 'default' : 'secondary'} className="w-fit">
                        {inc.type}
                      </Badge>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md text-sm text-foreground">
                      {inc.description}
                    </div>

                    <div className="flex justify-end pt-1">
                      <span className="text-xs text-muted-foreground">
                        Status: <strong className="text-foreground">{inc.status}</strong> • Sync: {inc.syncStatus}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
