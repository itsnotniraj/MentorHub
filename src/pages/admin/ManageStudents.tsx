import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StudentCard from '../../components/StudentCard';
import { Search, Plus, UserRound, Upload } from 'lucide-react';
import { Profile } from '../../types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// --- Student Modal ---
const StudentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: any) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    semester: 1,
    year_of_admission: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        semester: 1,
        year_of_admission: new Date().getFullYear(),
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Student</h2>
        <input className="mb-2 w-full border p-2" placeholder="First Name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        <input className="mb-2 w-full border p-2" placeholder="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        <input className="mb-2 w-full border p-2" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <input className="mb-2 w-full border p-2" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <input className="mb-2 w-full border p-2" type="number" placeholder="Semester" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))} />
        <input className="mb-2 w-full border p-2" type="number" placeholder="Year of Admission" value={form.year_of_admission} onChange={e => setForm(f => ({ ...f, year_of_admission: Number(e.target.value) }))} />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onSave(form); onClose(); }}>Save</Button>
        </div>
      </div>
    </div>
  );
};
// --- End Student Modal ---

const ManageStudents: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('first_name');
    setStudents(studentsData || []);
    setLoading(false);
  };

  const handleSaveStudent = async (student: any) => {
    const { error } = await supabase.from('profiles').insert([
      {
        ...student,
        role: 'student',
      }
    ]);
    if (error) {
      toast.error('Failed to add student: ' + error.message);
    } else {
      toast.success('Student added!');
      fetchStudents();
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        semester?: number;
        year_of_admission?: number;
        // ignore id or any other columns
      }
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
      const { data: existing } = await supabase.from('profiles').select('email');
      const existingEmails = new Set((existing || []).map((s: { email: string }) => s.email.toLowerCase()));
      const errors: string[] = [];
      const validRows: any[] = [];
      const seenEmails = new Set<string>();
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        // Only pick allowed fields, ignore id or any extra fields
        const first_name = row.first_name?.toString().trim();
        const last_name = row.last_name?.toString().trim();
        const email = row.email?.toString().trim().toLowerCase();
        const phone = row.phone?.toString().trim() || null;
        const semester = Number(row.semester) || 1;
        const year_of_admission = Number(row.year_of_admission) || new Date().getFullYear();

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
          phone,
          semester,
          year_of_admission,
          role: 'student',
        });
      });
      if (validRows.length > 0) {
        const { error: insertError } = await supabase.from('profiles').insert(validRows);
        if (insertError) {
          toast.error(`Failed to insert students: ${insertError.message}`);
        } else {
          toast.success(`${validRows.length} students added successfully`);
          fetchStudents();
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

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      (student.phone && student.phone.includes(searchTerm));
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Students</h1>
          <p className="text-muted-foreground">View and manage all students in the system.</p>
        </div>
        <div className="flex gap-2">
          <label
            htmlFor="excel-upload-student"
            className={`flex items-center px-4 py-2 border rounded-md cursor-pointer ${
              excelLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              id="excel-upload-student"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
              disabled={excelLoading}
            />
            <Upload size={16} className="mr-2" />
            {excelLoading ? 'Uploading...' : 'Upload Student Excel'}
          </label>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Add Student
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              fullWidth
            />
          </div>
          {filteredStudents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map(student => (
                <div key={student.id}>
                  <StudentCard student={student} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserRound className="mx-auto h-12 w-12 text-muted" />
              <h3 className="mt-4 text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No students match your search criteria"
                  : "There are no students in the system yet"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Add a Student
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStudent}
      />
    </div>
  );
};

export default ManageStudents;