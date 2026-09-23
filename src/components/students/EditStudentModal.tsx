import { useState } from 'react';
import { db, type Student } from '../../services/db';
import { Button } from '../ui/Button';

interface EditStudentModalProps {
  student: Student;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditStudentModal({ student, onSuccess, onCancel }: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    lrn: student.lrn,
    gradeLevel: student.gradeLevel,
    section: student.section,
    dateOfBirth: student.dateOfBirth || '',
    gender: student.gender || '',
    is4Ps: student.is4Ps,
    isSPED: student.isSPED,
    isIP: student.isIP,
    emergencyContactName: student.emergencyContactName || '',
    emergencyContactRelation: student.emergencyContactRelation || '',
    emergencyContactNumber: student.emergencyContactNumber || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await db.students.update(student.id, {
        ...formData
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update student:', error);
      alert('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-1">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">LRN</label>
            <input required name="lrn" value={formData.lrn} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Grade Level</label>
              <input required name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Section</label>
              <input required name="section" value={formData.section} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
        </div>

        {/* Extended Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-1">Extended Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-1">Emergency Contact</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
            <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Relationship</label>
              <input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <input name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 pb-4">
          <h3 className="font-semibold text-lg border-b pb-1">Tags & Programs</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is4Ps" checked={formData.is4Ps} onChange={handleChange} className="h-4 w-4 rounded border-input" />
              4Ps Beneficiary
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isSPED" checked={formData.isSPED} onChange={handleChange} className="h-4 w-4 rounded border-input" />
              SPED Student
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isIP" checked={formData.isIP} onChange={handleChange} className="h-4 w-4 rounded border-input" />
              IP Student
            </label>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex justify-end gap-2 p-4 border-t bg-background shrink-0">
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
