import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Mail, PhoneCall, Calendar, BookOpen, Clock, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { Profile } from '../../types';
import { format } from 'date-fns';

interface LeaveApplication {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  approved: boolean | null;
  created_at: string;
}

const fixProfile = (p: Record<string, unknown>): Profile => ({
  ...p,
  avatar_url: p.avatar_url === null ? undefined : (p.avatar_url as string | undefined),
  phone: p.phone === null ? undefined : (p.phone as string | undefined),
  mentor_id: p.mentor_id === null ? undefined : (p.mentor_id as string | undefined),
  semester: p.semester === null ? undefined : (p.semester as number | undefined),
  year_of_admission: p.year_of_admission === null ? undefined : (p.year_of_admission as number | undefined),
} as Profile);

const MenteeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mentee, setMentee] = useState<Profile | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    const fetchMenteeData = async () => {
      if (!id) return;
      setLoading(true);
      const { data: menteeData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setMentee(menteeData ? fixProfile(menteeData) : null);
      const { data: leaves } = await supabase
        .from('leave_applications')
        .select('*')
        .eq('student_id', id ?? '')
        .order('created_at', { ascending: false });
      setLeaveApplications(leaves || []);
      setLoading(false);
    };
    fetchMenteeData();
  }, [id]);

  const handleApprove = async (leaveId: string, approved: boolean) => {
    setLeaveLoading(true);
    await supabase
      .from('leave_applications')
      .update({ approved })
      .eq('id', leaveId);
    // Refresh leave applications
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('student_id', id)
      .order('created_at', { ascending: false });
    setLeaveApplications(leaves || []);
    setLeaveLoading(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mentee) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-4 text-lg font-medium">Mentee not found</h3>
        <p className="text-muted-foreground">
          The mentee you're looking for doesn't exist or you don't have access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {mentee.first_name} {mentee.last_name}
        </h1>
        <p className="text-muted-foreground">
          Mentee Profile and Performance Overview
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{mentee.email}</span>
              </div>
              {mentee.phone && (
                <div className="flex items-center text-sm">
                  <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{mentee.phone}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Semester {mentee.semester}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Admitted in {mentee.year_of_admission}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="font-medium">Student ID:</span>
                <span className="ml-2">{mentee.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium">Role:</span>
                <span className="ml-2">{mentee.role}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveApplications.length > 0 ? (
            <div className="space-y-4">
              {leaveApplications.map(leave => (
                <div key={leave.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{leave.start_date} to {leave.end_date}</div>
                      <div className="text-sm text-muted-foreground">Reason: {leave.reason}</div>
                    </div>
                    <div>
                      {leave.approved === true && (
                        <span className="flex items-center text-success"><CheckCircle className="h-4 w-4 mr-1" /> Approved</span>
                      )}
                      {leave.approved === false && (
                        <span className="flex items-center text-destructive"><XCircle className="h-4 w-4 mr-1" /> Rejected</span>
                      )}
                      {leave.approved === null && (
                        <span className="flex items-center text-warning"><AlertCircle className="h-4 w-4 mr-1" /> Pending</span>
                      )}
                    </div>
                  </div>
                  {leave.approved === null && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(leave.id, true)}
                        disabled={leaveLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleApprove(leave.id, false)}
                        disabled={leaveLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">No leave applications found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MenteeProfile;