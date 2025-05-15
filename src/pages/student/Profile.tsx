import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { UserRound, Mail, PhoneCall, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const StudentProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: currentUser?.profile?.first_name || '',
    lastName: currentUser?.profile?.last_name || '',
    email: currentUser?.profile?.email || '',
    phone: currentUser?.profile?.phone || '',
    dob: currentUser?.profile?.dob || '',
    gender: currentUser?.profile?.gender || '',
    nationality: currentUser?.profile?.nationality || '',
    religion: currentUser?.profile?.religion || '',
    rollNumber: currentUser?.profile?.roll_number || '',
    department: currentUser?.profile?.department || '',
    presentAddress: currentUser?.profile?.present_address || '',
    permanentAddress: currentUser?.profile?.permanent_address || '',
    pincode: currentUser?.profile?.pincode || '',
    emergencyContact: currentUser?.profile?.emergency_contact || '',
    // Step 2: Parent/Guardian Info
    fatherName: currentUser?.profile?.father_name || '',
    fatherOccupation: currentUser?.profile?.father_occupation || '',
    fatherPhone: currentUser?.profile?.father_phone || '',
    motherName: currentUser?.profile?.mother_name || '',
    motherOccupation: currentUser?.profile?.mother_occupation || '',
    motherPhone: currentUser?.profile?.mother_phone || '',
    guardianName: currentUser?.profile?.guardian_name || '',
    guardianOccupation: currentUser?.profile?.guardian_occupation || '',
    guardianPhone: currentUser?.profile?.guardian_phone || '',
    // Step 3: Academic Info
    sscMarks: currentUser?.profile?.ssc_marks || '',
    sscMaxMarks: currentUser?.profile?.ssc_max_marks || '',
    sscPercentage: currentUser?.profile?.ssc_percentage || '',
    sscMonthYear: currentUser?.profile?.ssc_month_year || '',
    sscCutoff: currentUser?.profile?.ssc_cutoff || '',
    hsscMarks: currentUser?.profile?.hssc_marks || '',
    hsscMaxMarks: currentUser?.profile?.hssc_max_marks || '',
    hsscPercentage: currentUser?.profile?.hssc_percentage || '',
    hsscMonthYear: currentUser?.profile?.hssc_month_year || '',
    hsscCutoff: currentUser?.profile?.hssc_cutoff || '',
    diplomaMarks: currentUser?.profile?.diploma_marks || '',
    diplomaMaxMarks: currentUser?.profile?.diploma_max_marks || '',
    diplomaPercentage: currentUser?.profile?.diploma_percentage || '',
    diplomaMonthYear: currentUser?.profile?.diploma_month_year || '',
    diplomaCutoff: currentUser?.profile?.diploma_cutoff || '',
    admissionMode: currentUser?.profile?.admission_mode || '',
    category: currentUser?.profile?.category || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Auto-calculate percentage for marks fields
      if (name === 'sscMarks' || name === 'sscMaxMarks') {
        const marks = name === 'sscMarks' ? value : prev.sscMarks;
        const max = name === 'sscMaxMarks' ? value : prev.sscMaxMarks;
        const percent = marks && max ? ((parseFloat(marks) / parseFloat(max)) * 100).toFixed(2) : '';
        return { ...prev, [name]: value, sscPercentage: percent };
      }
      if (name === 'hsscMarks' || name === 'hsscMaxMarks') {
        const marks = name === 'hsscMarks' ? value : prev.hsscMarks;
        const max = name === 'hsscMaxMarks' ? value : prev.hsscMaxMarks;
        const percent = marks && max ? ((parseFloat(marks) / parseFloat(max)) * 100).toFixed(2) : '';
        return { ...prev, [name]: value, hsscPercentage: percent };
      }
      if (name === 'diplomaMarks' || name === 'diplomaMaxMarks') {
        const marks = name === 'diplomaMarks' ? value : prev.diplomaMarks;
        const max = name === 'diplomaMaxMarks' ? value : prev.diplomaMaxMarks;
        const percent = marks && max ? ((parseFloat(marks) / parseFloat(max)) * 100).toFixed(2) : '';
        return { ...prev, [name]: value, diplomaPercentage: percent };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    // Add validation for all steps here if needed
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          nationality: formData.nationality,
          religion: formData.religion,
          roll_number: formData.rollNumber,
          department: formData.department,
          present_address: formData.presentAddress,
          permanent_address: formData.permanentAddress,
          pincode: formData.pincode,
          emergency_contact: formData.emergencyContact,
          father_name: formData.fatherName,
          father_occupation: formData.fatherOccupation,
          father_phone: formData.fatherPhone,
          mother_name: formData.motherName,
          mother_occupation: formData.motherOccupation,
          mother_phone: formData.motherPhone,
          guardian_name: formData.guardianName,
          guardian_occupation: formData.guardianOccupation,
          guardian_phone: formData.guardianPhone,
          ssc_marks: formData.sscMarks,
          ssc_max_marks: formData.sscMaxMarks,
          ssc_percentage: formData.sscPercentage,
          ssc_month_year: formData.sscMonthYear,
          ssc_cutoff: formData.sscCutoff,
          hssc_marks: formData.hsscMarks,
          hssc_max_marks: formData.hsscMaxMarks,
          hssc_percentage: formData.hsscPercentage,
          hssc_month_year: formData.hsscMonthYear,
          hssc_cutoff: formData.hsscCutoff,
          diploma_marks: formData.diplomaMarks,
          diploma_max_marks: formData.diplomaMaxMarks,
          diploma_percentage: formData.diplomaPercentage,
          diploma_month_year: formData.diplomaMonthYear,
          diploma_cutoff: formData.diplomaCutoff,
          admission_mode: formData.admissionMode,
          category: formData.category,
        })
        .eq('id', currentUser.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser?.profile) {
    return (
      <div className="text-center py-12">
        <UserRound className="mx-auto h-12 w-12 text-muted" />
        <h3 className="mt-4 text-lg font-medium">Profile not found</h3>
        <p className="text-muted-foreground">
          Unable to load your profile information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and update your profile information.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Step {step}: {step === 1 ? 'Personal Information' : step === 2 ? 'Parent/Guardian Information' : 'Academic Information'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required fullWidth />
                  <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth />
                </div>
                <Input label="Email" name="email" value={formData.email} onChange={handleChange} required fullWidth />
                <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required fullWidth />
                <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required fullWidth />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender<span className="text-red-500">*</span></label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border rounded-md p-2" required>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} required fullWidth />
                </div>
                <Input label="Religion" name="religion" value={formData.religion} onChange={handleChange} required fullWidth />
                <Input label="Roll Number" name="rollNumber" value={formData.rollNumber} onChange={handleChange} required fullWidth />
                <Input label="Department" name="department" value={formData.department} onChange={handleChange} required fullWidth />
                <Input label="Present Address" name="presentAddress" value={formData.presentAddress} onChange={handleChange} required fullWidth />
                <Input label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} required fullWidth />
                <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required fullWidth />
                <Input label="Emergency Contact (optional)" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} fullWidth />
              </>
            )}
            {step === 2 && (
              <>
                <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} required fullWidth />
                <Input label="Father's Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} required fullWidth />
                <Input label="Father's Phone Number" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} required fullWidth />
                <Input label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} required fullWidth />
                <Input label="Mother's Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} required fullWidth />
                <Input label="Mother's Phone Number" name="motherPhone" value={formData.motherPhone} onChange={handleChange} required fullWidth />
                <Input label="Guardian's Name (If applicable)" name="guardianName" value={formData.guardianName} onChange={handleChange} fullWidth />
                <Input label="Guardian's Occupation (If applicable)" name="guardianOccupation" value={formData.guardianOccupation} onChange={handleChange} fullWidth />
                <Input label="Guardian's Phone Number (If applicable)" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} fullWidth />
              </>
            )}
            {step === 3 && (
              <>
                <div className="font-semibold text-base">SSC (10th Grade) Marks</div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Marks Secured" name="sscMarks" value={formData.sscMarks} onChange={handleChange} required fullWidth />
                  <Input label="Max Marks" name="sscMaxMarks" value={formData.sscMaxMarks} onChange={handleChange} required fullWidth />
                </div>
                <Input label="Percentage" name="sscPercentage" value={formData.sscPercentage} disabled fullWidth />
                <Input label="Month and Year of Passing" name="sscMonthYear" value={formData.sscMonthYear} onChange={handleChange} required fullWidth />
                <Input label="Cut-off/JEE Score (if applicable)" name="sscCutoff" value={formData.sscCutoff} onChange={handleChange} fullWidth />
                <div className="font-semibold text-base">HSSC (12th Grade) Marks</div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Marks Secured" name="hsscMarks" value={formData.hsscMarks} onChange={handleChange} required fullWidth />
                  <Input label="Max Marks" name="hsscMaxMarks" value={formData.hsscMaxMarks} onChange={handleChange} required fullWidth />
                </div>
                <Input label="Percentage" name="hsscPercentage" value={formData.hsscPercentage} disabled fullWidth />
                <Input label="Month and Year of Passing" name="hsscMonthYear" value={formData.hsscMonthYear} onChange={handleChange} required fullWidth />
                <Input label="Cut-off/JEE Score (if applicable)" name="hsscCutoff" value={formData.hsscCutoff} onChange={handleChange} fullWidth />
                <div className="font-semibold text-base">Diploma (if applicable)</div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Marks Secured" name="diplomaMarks" value={formData.diplomaMarks} onChange={handleChange} fullWidth />
                  <Input label="Max Marks" name="diplomaMaxMarks" value={formData.diplomaMaxMarks} onChange={handleChange} fullWidth />
                </div>
                <Input label="Percentage" name="diplomaPercentage" value={formData.diplomaPercentage} disabled fullWidth />
                <Input label="Month and Year of Passing" name="diplomaMonthYear" value={formData.diplomaMonthYear} onChange={handleChange} fullWidth />
                <Input label="Cut-off/JEE Score (if applicable)" name="diplomaCutoff" value={formData.diplomaCutoff} onChange={handleChange} fullWidth />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Mode<span className="text-red-500">*</span></label>
                    <select name="admissionMode" value={formData.admissionMode} onChange={handleChange} className="w-full border rounded-md p-2" required>
                      <option value="">Select</option>
                      <option value="DTE">DTE</option>
                      <option value="Management">Management</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category<span className="text-red-500">*</span></label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-md p-2" required>
                      <option value="">Select</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC/ST">SC/ST</option>
                      <option value="EWS">EWS</option>
                      <option value="NRI">NRI</option>
                      <option value="ESM">ESM</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between mt-6">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
              )}
              {step < 3 && (
                <Button type="button" variant="primary" onClick={handleNext}>Next</Button>
              )}
              {step === 3 && (
                <Button type="submit" variant="primary" isLoading={loading}>Submit</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;