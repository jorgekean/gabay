import { useState, useEffect } from 'react';
import { db, type Incident } from '../../services/db';
import { Button } from '../ui/Button';

interface UpdateIncidentModalProps {
  incidentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UpdateIncidentModal({ incidentId, onSuccess, onCancel }: UpdateIncidentModalProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [status, setStatus] = useState<Incident['status']>('Open');
  const [counselingNotes, setCounselingNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadIncident() {
      const inc = await db.incidents.get(incidentId);
      if (inc) {
        setIncident(inc);
        setStatus(inc.status);
        setCounselingNotes(inc.counselingNotes || '');
      }
    }
    loadIncident();
  }, [incidentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;

    setIsSaving(true);
    try {
      await db.incidents.update(incidentId, {
        status,
        counselingNotes,
        syncStatus: 'Pending'
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update incident:', error);
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!incident) {
    return <div className="p-4 text-center">Loading incident details...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      
      <div className="bg-muted/30 p-3 rounded-md text-sm mb-2 border border-border">
        <p className="font-semibold">{incident.type}: {incident.category}</p>
        <p className="text-muted-foreground mt-1 line-clamp-2">{incident.description}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Update Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Incident['status'])}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Parent Conference Scheduled">Parent Conference Scheduled</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-700 flex justify-between">
          <span>Private Counseling Notes</span>
          <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Vault Protected</span>
        </label>
        <p className="text-xs text-muted-foreground -mt-1 mb-1">These notes will only be visible to Guidance Counselors and Administration.</p>
        <textarea
          placeholder="Enter psychological assessment, intervention steps, or therapy notes here..."
          value={counselingNotes}
          onChange={(e) => setCounselingNotes(e.target.value)}
          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
