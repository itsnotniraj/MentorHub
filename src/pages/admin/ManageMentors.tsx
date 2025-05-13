import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const ManageMentors: React.FC = () => {
  const [mentors, setMentors] = useState([]);
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .order('first_name');
      setMentors(data || []);
    };
    fetchData();
  }, []);

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
      const validRows: any[] = [];
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
          phone,
          role: 'mentor',
        });
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
          setMentors(mentorsData || []);
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

  return (
    <div>
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
      {/* ...rest of your mentor management UI... */}
    </div>
  );
};

export default ManageMentors;