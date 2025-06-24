import { useEffect, useState, ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';

type Profile = {
  first_name: string;
  last_name: string;
};

type CounsellingSession = {
  id: string;
  session_number: number;
  session_date: string;
  issue_type: string;
  corrective_actions: string;
  improvement_needed: string;
  student?: Profile;
  mentor?: Profile;
};

const CounsellingAdminView = () => {
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('counselling_sessions')
        .select('*, student:profiles(first_name, last_name), mentor:profiles!counselling_sessions_mentor_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) {
        setError('Failed to fetch counselling sessions.');
      } else {
        setSessions(data || []);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const filtered = sessions.filter(s =>
    (s.student?.first_name + ' ' + s.student?.last_name).toLowerCase().includes(search.toLowerCase()) ||
    (s.mentor?.first_name + ' ' + s.mentor?.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">All Counselling Sessions</h2>
      <input
        type="text"
        placeholder="Search by student or mentor"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 border rounded p-2 w-full"
      />
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-center py-4 text-red-600">{error}</div>}
      {!loading && !error && (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Student</th>
              <th className="p-2 border">Mentor</th>
              <th className="p-2 border">Session</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Corrective Actions</th>
              <th className="p-2 border">Improvement Needed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="p-2 border">{s.student?.first_name} {s.student?.last_name}</td>
                <td className="p-2 border">{s.mentor?.first_name} {s.mentor?.last_name}</td>
                <td className="p-2 border">{s.session_number}</td>
                <td className="p-2 border">{s.session_date}</td>
                <td className="p-2 border">{s.issue_type}</td>
                <td className="p-2 border">{s.corrective_actions}</td>
                <td className="p-2 border">{s.improvement_needed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CounsellingAdminView;