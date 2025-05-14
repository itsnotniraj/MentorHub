import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StudentCard from '../../components/StudentCard';
import { Profile } from '../../types';
import { useNavigate } from 'react-router-dom';

const fixProfile = (p: Record<string, unknown>): Profile => ({
  ...p,
  avatar_url: p.avatar_url === null ? undefined : (p.avatar_url as string | undefined),
  phone: p.phone === null ? undefined : (p.phone as string | undefined),
  mentor_id: p.mentor_id === null ? undefined : (p.mentor_id as string | undefined),
  semester: p.semester === null ? undefined : (p.semester as number | undefined),
  year_of_admission: p.year_of_admission === null ? undefined : (p.year_of_admission as number | undefined),
} as Profile);

const MenteesOverview: React.FC = () => {
  const { currentUser } = useAuth();
  const [mentees, setMentees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMentees = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('mentor_id', currentUser.id)
        .eq('role', 'student')
        .order('first_name');
      setMentees((data || []).map(fixProfile));
      setLoading(false);
    };
    fetchMentees();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-4">My Mentees</h1>
      {mentees.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mentees.map(student => (
            <div key={student.id} onClick={() => navigate(`/mentor/mentees/${student.id}`)} className="cursor-pointer">
              <StudentCard student={student} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="mt-4 text-lg font-medium">No mentees assigned</h3>
          <p className="text-muted-foreground">
            You currently have no students assigned to you.
          </p>
        </div>
      )}
    </div>
  );
};

export default MenteesOverview;