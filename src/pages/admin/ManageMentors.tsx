import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, UserCog, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import MentorCard from '../../components/MentorCard';
import Input from '../../components/ui/Input';
import { Profile } from '../../types';
import StudentCard from '../../components/StudentCard';
import Button from '../../components/ui/Button';

const ManageMentors: React.FC = () => {
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [excelLoading, setExcelLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [mentorStudents, setMentorStudents] = useState<Profile[]>([]);

  useEffect(() => {
    fetchMentors();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fixProfile = (p: Record<string, unknown>): Profile => ({
    ...p,
    avatar_url: p.avatar_url === null ? undefined : (p.avatar_url as string | undefined),
    phone: p.phone === null ? undefined : (p.phone as string | undefined),
    mentor_id: p.mentor_id === null ? undefined : (p.mentor_id as string | undefined),
    semester: p.semester === null ? undefined : (p.semester as number | undefined),
    year_of_admission: p.year_of_admission === null ? undefined : (p.year_of_admission as number | undefined),
  } as Profile);

  const fetchMentors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'mentor')
      .order('first_name');
    setMentors((data || []).map(fixProfile));
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('first_name');
    setStudents((data || []).map(fixProfile));
  };

  const fetchMentorStudents = async (mentorId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('mentor_id', mentorId)
      .order('first_name');
    setMentorStudents((data || []).map(fixProfile));
  };

  const handleMentorClick = (mentor: Profile) => {
    setSelectedMentor(mentor);
    fetchMentorStudents(mentor.id);
  };

  const handleMentorExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      interface ExcelRow {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        // ignore id or any other columns
      }
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
      const { data: existing } = await supabase.from('profiles').select('email');
      const existingEmails = new Set((existing || []).map((s: { email: string }) => s.email.toLowerCase()));
      const errors: string[] = [];
      const validRows: Profile[] = [];
      const seenEmails = new Set<string>();
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        // Only pick allowed fields, ignore id or any extra fields
        const first_name = row.first_name?.toString().trim();
        const last_name = row.last_name?.toString().trim();
        const email = row.email?.toString().trim().toLowerCase();
        const phone = row.phone?.toString().trim() || null;

        if (!first_name || !last_name || !email) {
          errors.push(`Row ${rowNum}: Missing required fields`);
          return;
        }
        if (seenEmails.has(email)) {
          errors.push(`Row ${rowNum}: Duplicate email in file (${email})`);
          return;
        }
        seenEmails.add(email);
        if (existingEmails.has(email)) {
          errors.push(`Row ${rowNum}: Email already exists in database (${email})`);
          return;
        }
        validRows.push({
          first_name,
          last_name,
          email,
          phone: phone || undefined,
          role: 'mentor',
        } as Profile);
      });
      if (validRows.length > 0) {
        const { error: insertError } = await supabase.from('profiles').insert(validRows);
        if (insertError) {
          toast.error(`Failed to insert mentors: ${insertError.message}`);
        } else {
          toast.success(`${validRows.length} mentors added successfully`);
          const { data: mentorsData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'mentor')
            .order('first_name');
          setMentors((mentorsData || []).map(fixProfile));
        }
      }
      if (errors.length > 0) {
        toast.error(
          <div>
            <div>Some rows could not be imported:</div>
            <ul className="list-disc pl-5">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
          </div>,
          { duration: 10000 }
        );
      }
    } finally {
      setExcelLoading(false);
      e.target.value = '';
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedMentor || !selectedStudentId) return;
    setAssignLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ mentor_id: selectedMentor.id })
      .eq('id', selectedStudentId);
    if (error) {
      toast.error('Failed to assign student: ' + error.message);
    } else {
      toast.success('Student assigned!');
      fetchMentorStudents(selectedMentor.id);
      fetchStudents();
      setAssignModalOpen(false);
      setSelectedStudentId('');
    }
    setAssignLoading(false);
  };

  const filteredMentors = mentors.filter(mentor => {
    const fullName = `${mentor.first_name} ${mentor.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) ||
      mentor.email.toLowerCase().includes(searchLower) ||
      (mentor.phone && mentor.phone.includes(searchTerm));
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Mentors</h1>
          <p className="text-muted-foreground">View and manage all mentors in the system.</p>
        </div>
        <div className="flex gap-2">
          <label
            htmlFor="excel-upload-mentor"
            className={`flex items-center px-4 py-2 border rounded-md cursor-pointer ${
              excelLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              id="excel-upload-mentor"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleMentorExcelUpload}
              className="hidden"
              disabled={excelLoading}
            />
            <Upload size={16} className="mr-2" />
            {excelLoading ? 'Uploading...' : 'Upload Mentor Excel'}
          </label>
        </div>
      </div>
      <div className="p-6 bg-white rounded shadow">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mentors by name, email, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
        {selectedMentor ? (
          <div>
            <button
              className="mb-4 text-sm text-primary underline"
              onClick={() => setSelectedMentor(null)}
            >
              ← Back to all mentors
            </button>
            <h2 className="text-xl font-bold mb-2">
              Students assigned to {selectedMentor.first_name} {selectedMentor.last_name}
            </h2>
            {mentorStudents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                {mentorStudents.map(student => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">No students assigned yet.</div>
            )}
            <Button variant="primary" onClick={() => setAssignModalOpen(true)}>
              Assign Student
            </Button>
            {/* Assign Modal */}
            {assignModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Assign Student to {selectedMentor.first_name}</h3>
                  <select
                    className="w-full border p-2 mb-4"
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                  >
                    <option value="">-- Select Student --</option>
                    {students.filter(s => !s.mentor_id).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.email})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAssignStudent}
                      disabled={!selectedStudentId || assignLoading}
                      isLoading={assignLoading}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredMentors.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map(mentor => (
                <div key={mentor.id} onClick={() => handleMentorClick(mentor)} className="cursor-pointer">
                  <MentorCard mentor={mentor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCog className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-4 text-lg font-medium">No mentors found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No mentors match your search criteria"
                  : "There are no mentors in the system yet"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ManageMentors;