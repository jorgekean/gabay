import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { db } from '../../services/db';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

const incidentSchema = z.object({
  studentLrn: z.string().min(1, 'Please select a student'),
  type: z.enum(['Major Offense', 'Minor Offense', 'Positive Anecdote', 'Counseling Note'], {
    message: 'Please select an incident type'
  }),
  category: z.string().min(1, 'Category is required'),
  location: z.string().optional(),
  incidentDate: z.string().min(1, 'Date and time are required'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface NewIncidentFormProps {
  onSuccess: () => void;
}

export function NewIncidentForm({ onSuccess }: NewIncidentFormProps) {
  const activeSchoolYear = useSettingsStore((state) => state.activeSchoolYear);
  // Fetch active students for the dropdown
  const allStudents = useLiveQuery(() => db.students.toArray());
  const students = allStudents?.filter(s => s.schoolYear === activeSchoolYear);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      studentLrn: '',
      type: 'Minor Offense',
      category: '',
      location: '',
      incidentDate: new Date().toISOString().slice(0, 16), // current datetime local
      description: ''
    }
  });

  const onSubmit = async (data: IncidentFormValues) => {
    try {
      const newIncident = {
        id: crypto.randomUUID(),
        ...data,
        reporter: user?.name || 'Unknown Reporter',
        schoolYear: activeSchoolYear,
        status: 'Open' as const,
        syncStatus: 'Pending' as const
      };
      
      // Save offline to Dexie instantly
      await db.incidents.add(newIncident);
      
      toast.success('Incident logged successfully', {
        description: 'Saved offline. Will sync when connected.'
      });
      
      reset();
      onSuccess(); // Close modal immediately
    } catch (error) {
      console.error('Failed to save incident:', error);
      toast.error('Failed to save incident');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentLrn">Student</Label>
        <select
          id="studentLrn"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...register('studentLrn')}
        >
          <option value="">Select a student...</option>
          {students?.map(student => (
            <option key={student.id} value={student.lrn}>
              {student.lastName}, {student.firstName} ({student.gradeLevel} - {student.section})
            </option>
          ))}
        </select>
        {errors.studentLrn && <p className="text-xs text-red-500">{errors.studentLrn.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Incident Type</Label>
          <select
            id="type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('type')}
          >
            <option value="Minor Offense">Minor Offense</option>
            <option value="Major Offense">Major Offense</option>
            <option value="Positive Anecdote">Positive Anecdote</option>
            {user?.role !== 'Teacher' && (
              <option value="Counseling Note">Counseling Note</option>
            )}
          </select>
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input 
            id="category" 
            placeholder="e.g. Vaping, Bullying, Truancy" 
            {...register('category')} 
          />
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incidentDate">Date & Time</Label>
          <Input 
            id="incidentDate" 
            type="datetime-local" 
            {...register('incidentDate')} 
          />
          {errors.incidentDate && <p className="text-xs text-red-500">{errors.incidentDate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input 
            id="location" 
            placeholder="e.g. Canteen, Room 101" 
            {...register('location')} 
          />
          {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Detailed description of what happened..." 
          className="min-h-[100px]"
          {...register('description')} 
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Log Incident
        </Button>
      </div>
    </form>
  );
}
