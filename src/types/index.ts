// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'mentor' | 'student';
  profile?: Profile;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  role: 'admin' | 'mentor' | 'student';
  mentor_id?: string;
  semester?: number;
  year_of_admission?: number;
  // 3-step profile fields
  dob?: string;
  gender?: string;
  nationality?: string;
  religion?: string;
  roll_number?: string;
  department?: string;
  present_address?: string;
  permanent_address?: string;
  pincode?: string;
  emergency_contact?: string;
  father_name?: string;
  father_occupation?: string;
  father_phone?: string;
  mother_name?: string;
  mother_occupation?: string;
  mother_phone?: string;
  guardian_name?: string;
  guardian_occupation?: string;
  guardian_phone?: string;
  ssc_marks?: string;
  ssc_max_marks?: string;
  ssc_percentage?: string;
  ssc_month_year?: string;
  ssc_cutoff?: string;
  hssc_marks?: string;
  hssc_max_marks?: string;
  hssc_percentage?: string;
  hssc_month_year?: string;
  hssc_cutoff?: string;
  diploma_marks?: string;
  diploma_max_marks?: string;
  diploma_percentage?: string;
  diploma_month_year?: string;
  diploma_cutoff?: string;
  admission_mode?: string;
  category?: string;
}

// Academic Types
export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

export interface Marks {
  id: string;
  student_id: string;
  subject_id: string;
  type: 'internal' | 'semester';
  marks: number;
  semester: number;
  subject?: Subject;
}

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  date: string;
  present: boolean;
  subject?: Subject;
}

// Mentoring Types
export interface MentoringSession {
  id: string;
  mentor_id: string;
  student_id: string;
  title: string;
  date: string;
  notes?: string;
}

export interface InternshipReport {
  id: string;
  student_id: string;
  title: string;
  file_path: string;
  created_at: string;
}

export interface LeaveApplication {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  approved: boolean | null;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  created_by: string;
  file_path?: string;
  created_at: string;
}