import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import PerformanceChart from '../../components/PerformanceChart';
import { FileSpreadsheet, Calendar } from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [marks, setMarks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch marks
        const { data: marksData, error: marksError } = await supabase
          .from('marks')
          .select(`*, subject:subject_id (id, name, code, semester)`)
          .eq('student_id', currentUser?.id)
          .order('semester', { ascending: true });
        if (marksError) throw marksError;
        setMarks(marksData || []);
        // Fetch upcoming sessions (limit to next 5)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('mentoring_sessions')
          .select('id, title, date, mentor_id, notes')
          .eq('student_id', currentUser?.id)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(5);
        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [currentUser]);

  // Calculate semester performance for chart
  const calculateSemesterPerformance = () => {
    const semesterMarks = marks.reduce((acc, mark) => {
      if (!acc[mark.semester]) acc[mark.semester] = { total: 0, count: 0 };
      acc[mark.semester].total += mark.marks;
      acc[mark.semester].count += 1;
      return acc;
    }, {});
    return Object.entries(semesterMarks).map(([semester, data]) => ({
      semester: Number(semester),
      average: data.total / data.count,
    }));
  };
  const semesterPerformance = calculateSemesterPerformance();
  const performanceData = {
    labels: semesterPerformance.map(sem => `Semester ${sem.semester}`),
    datasets: [
      {
        label: 'Average Marks',
        data: semesterPerformance.map(sem => sem.average),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
      },
    ],
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {marks.length > 0 ? (
            <PerformanceChart title="Overall Performance" data={performanceData} type="line" />
          ) : (
            <div className="text-center py-8 text-muted-foreground">No marks data available.</div>
          )}
        </CardContent>
      </Card>
      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <ul className="divide-y">
              {sessions.map(session => (
                <li key={session.id} className="py-3 flex items-center gap-4">
                  <Calendar className="text-primary" />
                  <div>
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-muted-foreground">{new Date(session.date).toLocaleString()}</div>
                    {session.notes && <div className="text-xs text-gray-500 mt-1">{session.notes}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No upcoming sessions.</div>
          )}
        </CardContent>
      </Card>
      {/* Detailed Marks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Marks</CardTitle>
        </CardHeader>
        <CardContent>
          {marks.length > 0 ? (
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Marks</th>
                  <th className="p-2 border">Semester</th>
                </tr>
              </thead>
              <tbody>
                {marks.map(mark => (
                  <tr key={mark.id}>
                    <td className="p-2 border">{mark.subject?.name}</td>
                    <td className="p-2 border">{mark.type}</td>
                    <td className="p-2 border">{mark.marks}</td>
                    <td className="p-2 border">{mark.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No marks available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}