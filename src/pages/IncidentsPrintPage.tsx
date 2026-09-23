import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { useSettingsStore } from '../store/settingsStore';

export default function IncidentsPrintPage() {
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('type') || 'All';
  const filterCategory = searchParams.get('category') || 'All';
  const activeSchoolYear = useSettingsStore(state => state.activeSchoolYear);

  const data = useLiveQuery(async () => {
    const allIncidents = await db.incidents.toArray();
    const students = await db.students.toArray();
    
    // Filter by active school year
    const rawIncidents = allIncidents.filter(inc => inc.schoolYear === activeSchoolYear);
    
    // Map student data to incidents for display, but REDACT names
    let mapped = rawIncidents.map(inc => {
      const student = students.find(s => s.lrn === inc.studentLrn);
      
      let redactedName = 'Unknown Student';
      if (student) {
        // Initials format: Juan Dela Cruz -> J. D. C.
        const firstInitial = student.firstName ? student.firstName.charAt(0) + '.' : '';
        const lastInitial = student.lastName ? student.lastName.charAt(0) + '.' : '';
        redactedName = `${firstInitial} ${lastInitial}`.trim();
      }

      return {
        ...inc,
        studentName: redactedName,
        gradeSection: student ? `${student.gradeLevel} - ${student.section}` : 'N/A'
      };
    }).sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());

    // Apply filters matching the IncidentsPage state
    mapped = mapped.filter(inc => {
      const matchesType = filterType === 'All' ? true : inc.type === filterType;
      const matchesCategory = filterCategory === 'All' ? true : inc.category === filterCategory;
      return matchesType && matchesCategory;
    });

    return mapped;
  }, [filterType, filterCategory, activeSchoolYear]);

  useEffect(() => {
    if (data) {
      const timeout = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [data]);

  if (data === undefined) return <div className="p-8">Loading redacted report...</div>;

  return (
    <div className="bg-white text-black min-h-screen p-8 print:p-0">
      <div className="max-w-5xl mx-auto">
        {/* Print only controls */}
        <div className="mb-8 print:hidden flex justify-between items-center bg-muted/20 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Privacy Mode Active:</strong> Student names have been redacted (Initials only) for DPA compliance.
          </p>
          <div className="flex gap-4">
            <Link to={`/incidents`} className="text-primary hover:underline">
              Back to Incidents
            </Link>
            <button onClick={() => window.print()} className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm">
              Print Now
            </button>
          </div>
        </div>

        {/* Report Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Redacted Incident Report</h1>
          <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
          <div className="mt-2 text-xs flex gap-4">
            <span><strong>Filtered Type:</strong> {filterType}</span>
            <span><strong>Filtered Category:</strong> {filterCategory}</span>
          </div>
        </div>

        {/* Incident List */}
        {data.length === 0 ? (
          <p className="italic text-gray-600 text-sm">No incidents match the current filters.</p>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="p-2 font-bold w-1/5">Date</th>
                <th className="p-2 font-bold w-1/5">Student (Redacted)</th>
                <th className="p-2 font-bold w-1/5">Type / Category</th>
                <th className="p-2 font-bold w-2/5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {data.map((inc) => (
                <tr key={inc.id} className="break-inside-avoid">
                  <td className="p-2 align-top text-gray-800">
                    <div>{new Date(inc.incidentDate).toLocaleString()}</div>
                  </td>
                  <td className="p-2 align-top">
                    <div className="font-bold font-mono tracking-widest">{inc.studentName}</div>
                    <div className="text-xs text-gray-600">{inc.gradeSection}</div>
                  </td>
                  <td className="p-2 align-top">
                    <div className="font-semibold">{inc.type}</div>
                    <div className="text-xs text-gray-600">{inc.category}</div>
                  </td>
                  <td className="p-2 align-top">
                    <div className="whitespace-pre-wrap">{inc.description}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-12 break-inside-avoid">
          <div className="border-t border-black pt-2 text-center text-sm">
            <p className="font-bold">Generated By</p>
            <p className="text-gray-500 text-xs">Signature over printed name</p>
          </div>
          <div className="border-t border-black pt-2 text-center text-sm">
            <p className="font-bold">Noted By (Principal)</p>
            <p className="text-gray-500 text-xs">Signature over printed name</p>
          </div>
        </div>

      </div>
    </div>
  );
}
