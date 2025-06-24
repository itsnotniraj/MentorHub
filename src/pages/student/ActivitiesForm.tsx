import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'sonner';

interface ParentVisit {
  date: string;
  purpose: string;
  discussion: string;
  sign: string;
}

interface ActivitiesData {
  id?: string;
  area_of_interest: string;
  prizes_awards: string;
  co_curricular: string;
  extra_curricular: string;
  professional_membership: string;
  project_journal: string;
  placement_details: string;
  internship_industry?: string;
  internship_faculty_mentor?: string;
  parent_visits: ParentVisit[];
}

const defaultParentVisit: ParentVisit = {
  date: '',
  purpose: '',
  discussion: '',
  sign: '',
};

const ActivitiesForm: React.FC = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState<ActivitiesData>({
    area_of_interest: '',
    prizes_awards: '',
    co_curricular: '',
    extra_curricular: '',
    professional_membership: '',
    project_journal: '',
    placement_details: '',
    internship_industry: '',
    internship_faculty_mentor: '',
    parent_visits: [ { ...defaultParentVisit } ],
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('student_activities')
        .select('*')
        .eq('student_id', currentUser.id)
        .single();
      if (data) {
        setForm({
          ...data,
          parent_visits: data.parent_visits || [ { ...defaultParentVisit } ],
        });
        setEditing(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleParentVisitChange = (idx: number, field: keyof ParentVisit, value: string) => {
    setForm(prev => {
      const visits = prev.parent_visits.map((v, i) => i === idx ? { ...v, [field]: value } : v);
      return { ...prev, parent_visits: visits };
    });
  };

  const addParentVisit = () => {
    setForm(prev => ({ ...prev, parent_visits: [ ...prev.parent_visits, { ...defaultParentVisit } ] }));
  };

  const removeParentVisit = (idx: number) => {
    setForm(prev => ({ ...prev, parent_visits: prev.parent_visits.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    if (!form.area_of_interest.trim()) return 'Area of Interest is required';
    if (!form.prizes_awards.trim()) return 'Prizes/Awards is required';
    if (!form.co_curricular.trim()) return 'Co-curricular Activities is required';
    if (!form.extra_curricular.trim()) return 'Extra-curricular Activities is required';
    if (!form.professional_membership.trim()) return 'Professional Body Membership is required';
    if (!form.project_journal.trim()) return 'Project/Journal Details is required';
    if (!form.placement_details.trim()) return 'Placement/Higher Studies/Entrepreneur Details is required';
    if (!form.internship_industry?.trim()) return 'Internship Industry Name is required';
    if (!form.internship_faculty_mentor?.trim()) return 'Internship Faculty Mentor is required';
    for (let i = 0; i < form.parent_visits.length; i++) {
      const v = form.parent_visits[i];
      if (!v.date) return `Date required for parent visit #${i+1}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return `Invalid date format for parent visit #${i+1}`;
      if (!v.purpose.trim()) return `Purpose required for parent visit #${i+1}`;
      if (!v.discussion.trim()) return `Discussion/Suggestions required for parent visit #${i+1}`;
      if (!v.sign.trim()) return `Parent's Sign required for parent visit #${i+1}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    setLoading(true);
    try {
      if (editing && form.id) {
        const { error } = await supabase
          .from('student_activities')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', form.id);
        if (error) throw error;
        toast.success('Updated successfully');
      } else {
        const { error } = await supabase
          .from('student_activities')
          .insert({ ...form, student_id: currentUser.id, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success('Submitted successfully');
        setEditing(true);
      }
    } catch (err) {
      toast.error('Failed to save.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Student Activities Form</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Area of Interest and Hobbies" name="area_of_interest" value={form.area_of_interest} onChange={handleChange} required />
          <Input label="Prizes/Awards Received" name="prizes_awards" value={form.prizes_awards} onChange={handleChange} required />
          <div>
            <label className="block font-medium mb-1">Co-curricular Activities</label>
            <textarea name="co_curricular" value={form.co_curricular} onChange={handleChange} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Extra-curricular Activities</label>
            <textarea name="extra_curricular" value={form.extra_curricular} onChange={handleChange} className="w-full border rounded p-2" required />
          </div>
          <Input label="Professional Body Membership Details" name="professional_membership" value={form.professional_membership} onChange={handleChange} required />
          <Input label="Project Work Details / Journal Published" name="project_journal" value={form.project_journal} onChange={handleChange} required />
          <Input label="Placement/Higher Studies/Entrepreneur Details" name="placement_details" value={form.placement_details} onChange={handleChange} required />
          <Input label="Internship Industry Name" name="internship_industry" value={form.internship_industry} onChange={handleChange} required />
          <Input label="Internship Faculty Mentor" name="internship_faculty_mentor" value={form.internship_faculty_mentor} onChange={handleChange} required />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Details of Parents Visit</h2>
          <table className="w-full border mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Purpose of Visit</th>
                <th className="p-2 border">Discussion/Suggestions</th>
                <th className="p-2 border">Parent's Sign</th>
                <th className="p-2 border"></th>
              </tr>
            </thead>
            <tbody>
              {form.parent_visits.map((visit, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">
                    <input type="date" className="border rounded p-1" value={visit.date} onChange={e => handleParentVisitChange(idx, 'date', e.target.value)} required />
                  </td>
                  <td className="p-2 border">
                    <input type="text" className="border rounded p-1" value={visit.purpose} onChange={e => handleParentVisitChange(idx, 'purpose', e.target.value)} required />
                  </td>
                  <td className="p-2 border">
                    <textarea className="border rounded p-1" value={visit.discussion} onChange={e => handleParentVisitChange(idx, 'discussion', e.target.value)} required />
                  </td>
                  <td className="p-2 border">
                    <input type="text" className="border rounded p-1" value={visit.sign} onChange={e => handleParentVisitChange(idx, 'sign', e.target.value)} required />
                  </td>
                  <td className="p-2 border text-center">
                    {form.parent_visits.length > 1 && (
                      <button type="button" className="text-red-500" onClick={() => removeParentVisit(idx)}>&times;</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" variant="outline" onClick={addParentVisit}>Add Row</Button>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={loading}>{editing ? 'Update' : 'Submit'}</Button>
        </div>
      </form>
    </div>
  );
};

export default ActivitiesForm;
