import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';

export default function StudentPrintPage() {
  const { id } = useParams<{ id: string }>();

  const data = useLiveQuery(async () => {
    if (!id) return null;
    const student = await db.students.get(id);
    if (!student) return null;
    
    const incidents = await db.incidents.where('studentLrn').equals(student.lrn).toArray();
    incidents.sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
    
    return { student, incidents };
  }, [id]);

  useEffect(() => {
    // Automatically open print dialog when data is loaded
    if (data) {
      // Small timeout to ensure rendering is complete
      const timeout = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [data]);

  if (data === undefined) return <div className="p-8">Loading report...</div>;
  if (data === null) return <div className="p-8">Student not found.</div>;

  const { student, incidents } = data;

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Print only controls */}
        <div className="mb-8 print:hidden flex justify-between items-center bg-muted/20 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">This is a print-optimized view.</p>
          <div className="flex gap-4">
            <Link to={`/students/${id}`} className="text-primary hover:underline">
              Back to Profile
            </Link>
            <button onClick={() => window.print()} className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm">
              Print Now
            </button>
          </div>
        </div>

        {/* Report Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">GABAY Student Behavioral Report</h1>
          <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <span className="font-bold">Student Name:</span> {student.lastName}, {student.firstName}
          </div>
          <div>
            <span className="font-bold">LRN:</span> {student.lrn}
          </div>
          <div>
            <span className="font-bold">Grade/Section:</span> {student.gradeLevel} - {student.section}
          </div>
          <div>
            <span className="font-bold">Date of Birth:</span> {student.dateOfBirth || 'N/A'}
          </div>
          <div>
            <span className="font-bold">Gender:</span> {student.gender || 'N/A'}
          </div>
          <div>
            <span className="font-bold">Special Indicators:</span> 
            {[
              student.is4Ps && '4Ps',
              student.isSPED && 'SPED',
              student.isIP && 'IP'
            ].filter(Boolean).join(', ') || 'None'}
          </div>
          {(student.emergencyContactName || student.emergencyContactNumber) && (
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
              <span className="font-bold">Emergency Contact:</span> {student.emergencyContactName} {student.emergencyContactRelation ? `(${student.emergencyContactRelation})` : ''} - {student.emergencyContactNumber}
            </div>
          )}
        </div>

        {/* Incident History */}
        <h2 className="text-lg font-bold border-b border-black pb-1 mb-4">Anecdotal & Incident History</h2>
        
        {incidents.length === 0 ? (
          <p className="italic text-gray-600 text-sm">No incidents or anecdotes recorded for this student.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="p-2 font-bold w-1/5">Date</th>
                <th className="p-2 font-bold w-1/5">Type / Category</th>
                <th className="p-2 font-bold w-2/5">Description</th>
                <th className="p-2 font-bold w-1/5">Reporter / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {incidents.map((inc) => (
                <tr key={inc.id} className="break-inside-avoid">
                  <td className="p-2 align-top text-gray-800">
                    <div>{new Date(inc.incidentDate).toLocaleString()}</div>
                    {inc.schoolYear && <div className="text-xs text-gray-500 mt-1">{inc.schoolYear}</div>}
                  </td>
                  <td className="p-2 align-top">
                    <div className="font-semibold">{inc.type}</div>
                    <div className="text-xs text-gray-600">{inc.category}</div>
                  </td>
                  <td className="p-2 align-top">
                    {inc.location && <div className="text-xs text-gray-600 mb-1"><strong>Loc:</strong> {inc.location}</div>}
                    <div className="whitespace-pre-wrap">{inc.description}</div>
                  </td>
                  <td className="p-2 align-top text-gray-800">
                    <div>{inc.reporter || 'N/A'}</div>
                    <div className="text-xs mt-1 font-semibold uppercase">{inc.status}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-12 break-inside-avoid">
          <div className="border-t border-black pt-2 text-center text-sm">
            <p className="font-bold">Guidance Counselor / Discipline Officer</p>
            <p className="text-gray-500 text-xs">Signature over printed name</p>
          </div>
          <div className="border-t border-black pt-2 text-center text-sm">
            <p className="font-bold">Parent / Guardian</p>
            <p className="text-gray-500 text-xs">Signature over printed name</p>
          </div>
        </div>

      </div>
    </div>
  );
}
