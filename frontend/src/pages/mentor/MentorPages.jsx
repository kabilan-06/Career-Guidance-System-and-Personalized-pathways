import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiUsers,
  FiClipboard,
  FiCheckCircle,
  FiAward,
  FiSearch,
  FiSend,
  FiFileText,
  FiMessageSquare,
  FiArrowRight,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiClock,
  FiActivity,
} from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { mentorService } from '../../services/mentorService';

// Standardized Editorial Header
const Heading = ({ eyebrow, title, children }) => (
  <header className="border-b border-neutral-200/80 pb-6 mb-8">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
        {eyebrow}
      </span>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[#0038FF] text-[9px] font-bold font-mono uppercase">
        <FiShield size={9} /> Mentor Workspace
      </span>
    </div>
    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
      {title}
    </h1>
    {children && (
      <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-2xl leading-relaxed">
        {children}
      </p>
    )}
  </header>
);

// Standardized KPI Stat Card
const Stat = ({ label, value, icon: Icon, note }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
        {label}
      </span>
      <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0038FF]">
        <Icon size={16} />
      </div>
    </div>
    <div>
      <p className="text-3xl font-black text-neutral-950 font-mono tracking-tight">
        {value}
      </p>
      <p className="text-[11px] text-neutral-400 font-mono mt-1 flex items-center gap-1">
        {note || '—'}
      </p>
    </div>
  </motion.div>
);

// Standardized Student Candidate Card
const StudentCard = ({ student, onOpen }) => {
  const name =
    student.name ||
    `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
    'Student Candidate';
  const completion = student.profileCompletion ?? 0;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-100 transition-all group"
    >
      <div className="space-y-4">
        {/* Candidate Header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-950 font-mono text-xs font-bold text-white flex items-center justify-center border border-neutral-800">
            {initials || 'ST'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-neutral-950 truncate group-hover:text-[#0038FF] transition-colors">
              {name}
            </h3>
            <p className="text-xs text-neutral-500 truncate font-mono mt-0.5">
              {student.collegeName || student.email || 'Candidate ID: ' + (student.id || '—')}
            </p>
          </div>
          <span className="shrink-0 rounded bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-amber-800">
            Pending Review
          </span>
        </div>

        {/* Academic & Goal Specifications */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-xs">
          <div className="rounded-lg border border-neutral-200/60 bg-[#F8FAFC] p-2.5">
            <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Target Track
            </p>
            <p className="font-semibold text-neutral-900 truncate mt-0.5">
              {student.careerGoal || 'Unspecified'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200/60 bg-[#F8FAFC] p-2.5">
            <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
              Academic CGPA
            </p>
            <p className="font-semibold font-mono text-neutral-900 mt-0.5">
              {student.cgpa ?? '—'}
            </p>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-neutral-400 uppercase">Profile Completeness</span>
            <span className="font-bold text-neutral-800">{completion}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0038FF] rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onOpen(student)}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-800 py-2 text-xs font-mono font-semibold transition-all shadow-2xs group-hover:border-neutral-400"
      >
        <span>Examine Candidate Portfolio</span>
        <FiArrowRight size={13} className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.article>
  );
};

// Qualitative Diagnostic Observation Block
const Insight = ({ title, items, danger }) => (
  <div
    className={`rounded-xl border p-4 space-y-2 ${
      danger
        ? 'border-amber-200/80 bg-amber-50/40 text-amber-900'
        : 'border-emerald-200/80 bg-emerald-50/40 text-emerald-900'
    }`}
  >
    <div className="flex items-center gap-1.5">
      {danger ? (
        <FiTarget size={13} className="text-amber-700" />
      ) : (
        <FiCheckCircle size={13} className="text-emerald-700" />
      )}
      <p className="text-xs font-mono font-bold uppercase tracking-wider">{title}</p>
    </div>
    <ul className="space-y-1.5 text-xs">
      {items.map((x) => (
        <li key={x} className="flex items-start gap-2 leading-relaxed text-neutral-800">
          <span
            className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
              danger ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  </div>
);

// Standardized Mentor Evaluation Feedback Form
function FeedbackForm({ studentId, type }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const submit = async (values) => {
    if (!studentId) return;
    setServerError('');
    try {
      const feedback = values.feedback?.trim();
      if (!feedback) return;
      if (type === 'RESUME') {
        await mentorService.submitResumeFeedback(studentId, feedback);
      } else {
        await mentorService.submitAssessmentFeedback(studentId, feedback);
      }
      setSent(true);
      reset();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to submit feedback. Please try again.'
      );
    }
  };

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs xl:col-span-2 flex flex-col justify-between space-y-6">
      <div className="space-y-5">
        <div className="border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0038FF]">
              <FiMessageSquare size={14} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Advisory Protocol
              </span>
              <h2 className="text-sm font-bold text-neutral-950">
                Mentor Formal Assessment
              </h2>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Provide actionable academic interventions and trajectory feedback for the candidate profile.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(submit)} id="mentor-review-form">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 font-mono">
              Written Evaluation & Notes
            </label>
            <textarea
              required
              {...register('feedback')}
              rows="6"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all resize-none leading-relaxed"
              placeholder="Detail specific gaps, recommended electives, or resume adjustments..."
            />
          </div>

          {!studentId && (
            <p className="text-xs font-mono text-neutral-400">
              Select a candidate above to enable feedback.
            </p>
          )}

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs font-mono text-rose-700 flex items-center gap-2"
            >
              <FiMessageSquare size={14} className="shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </motion.div>
          )}

          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs font-mono text-emerald-800 flex items-center gap-2"
            >
              <FiCheckCircle size={14} className="shrink-0 text-emerald-600" />
              <span>Feedback stored for this candidate.</span>
            </motion.div>
          )}
        </form>
      </div>

      <button
        form="mentor-review-form"
        type="submit"
        disabled={isSubmitting || !studentId}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0038FF] hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white py-3 px-4 font-mono text-xs font-semibold tracking-wide transition-all shadow-md shadow-blue-500/20"
      >
        <FiSend size={13} />
        <span>{isSubmitting ? 'Transmitting...' : 'Commit Evaluation'}</span>
      </button>
    </aside>
  );
}

// ── MAIN MENTOR DASHBOARD ──────────────────────────────────────────
export function MentorDashboard() {
  const [dashData, setDashData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([mentorService.getDashboard(), mentorService.getStudents()])
      .then(([dash, studs]) => {
        setDashData(dash);
        const stdList = studs?.content || studs || [];
        setStudents(stdList);
      })
      .catch((err) => console.error('Failed to load mentor dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const m = dashData || {};

  // Real per-candidate profile completeness from the mentor students API (0–100).
  const scores =
    students.length > 0
      ? students.slice(0, 6).map((s, i) => ({
          name: s.firstName || `Candidate ${i + 1}`,
          score: Math.max(0, Math.min(100, Number(s.profileCompletion ?? 0))),
        }))
      : [];

  const careers = useMemo(() => {
    const interests = {};
    students.forEach((s) => {
      const goal = s.careerGoal || 'Unassigned';
      interests[goal] = (interests[goal] || 0) + 1;
    });
    return Object.entries(interests)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [students]);

  const pieColors = ['#0038FF', '#0F172A', '#64748B', '#94A3B8', '#CBD5E1'];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 w-1/3 rounded-xl bg-neutral-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading
        eyebrow="Advisory Telemetry"
        title="Candidate Cohort Supervision"
      >
        Track assigned student candidate performance, review pending technical submissions, and issue advisory feedback.
      </Heading>

      {/* KPI Stats Section */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Supervised Students"
          value={m.assignedStudents ?? students.length}
          icon={FiUsers}
          note={`${students.length} active candidates`}
        />
        <Stat
          label="Pending Portfolios"
          value={m.pendingResumeReviews ?? 0}
          icon={FiClipboard}
          note="Action required"
        />
        <Stat
          label="Completed Reviews"
          value={m.completedReviews ?? 0}
          icon={FiCheckCircle}
          note="Current academic term"
        />
        <Stat
          label="Mean Resume Index"
          value={
            m.averageResumeScore ? `${Math.round(m.averageResumeScore)}%` : '—'
          }
          icon={FiAward}
          note={
            m.averageAssessmentScore
              ? `Diagnostic Avg: ${Math.round(m.averageAssessmentScore)}%`
              : 'Calibrated'
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 xl:grid-cols-5">
        
        {/* Assessment Distribution Bar Chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Cohort Metrics
              </span>
              <h2 className="text-sm font-bold text-neutral-950 mt-0.5">
                Candidate Readiness
              </h2>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Profile completeness (%)
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {scores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: 8,
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#0038FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs font-mono text-neutral-400">
                No cohort data available
              </div>
            )}
          </div>
        </section>

        {/* Career Interests Pie Chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs xl:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Track Taxonomy
                </span>
                <h2 className="text-sm font-bold text-neutral-950 mt-0.5">
                  Career Trajectory Distribution
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Active Cohort
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {careers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={careers}
                      dataKey="value"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {careers.map((x, i) => (
                        <Cell key={x.name} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: 8,
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-mono text-neutral-400">
                  No track data available
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-[11px] font-mono">
            {careers.map((x, i) => (
              <span key={x.name} className="flex items-center gap-2 text-neutral-600 truncate">
                <span
                  className="h-2 w-2 rounded-xs shrink-0"
                  style={{ backgroundColor: pieColors[i % pieColors.length] }}
                />
                <span className="truncate">{x.name}</span>
                <span className="text-neutral-400 font-bold">({x.value})</span>
              </span>
            ))}
          </div>
        </section>

      </div>

      {/* Supervised Students Assignment Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200/80 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Supervised Candidates
            </span>
            <h2 className="text-lg font-extrabold text-neutral-950 mt-0.5">
              Recent Candidate Assignments
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Showing {Math.min(students.length, 6)} active students
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {students.slice(0, 6).map((s) => (
            <StudentCard student={s} key={s.id} onOpen={() => {}} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── STUDENTS DIRECTORY PAGE ────────────────────────────────────────
export function StudentsPage({ profiles = false }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    mentorService
      .getStudents()
      .then((x) => setRows(x.content || x || []))
      .catch((err) => console.error('Failed to load students:', err));
  }, []);

  const shown = useMemo(
    () =>
      rows.filter((x) =>
        JSON.stringify(x).toLowerCase().includes(query.toLowerCase())
      ),
    [rows, query]
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading
        eyebrow={profiles ? 'Candidate Directory' : 'Assigned Students'}
        title={profiles ? 'Student Profile Matrix' : 'Supervised Student Registry'}
      >
        Audit academic records, skill gap analysis vectors, and curriculum progression.
      </Heading>

      <div className="relative max-w-md">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          size={15}
        />
        <input
          className="w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all shadow-2xs font-mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by student name, email, or career track..."
        />
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <FiUsers className="mx-auto text-neutral-300" size={28} />
          <p className="mt-3 text-sm font-bold text-neutral-900">No Candidate Records Found</p>
          <p className="mt-1 text-xs text-neutral-400 font-mono">
            Adjust search criteria or check assigned cohort roster.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <StudentCard student={s} key={s.id} onOpen={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// Candidate selector shared by the assessment and resume review views
function StudentPicker({ students, studentId, onChange, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
        Candidate
      </label>
      <select
        value={studentId ?? ''}
        disabled={disabled || students.length === 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-mono font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-400"
      >
        {students.length === 0 && <option value="">No assigned students</option>}
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {`${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email}
          </option>
        ))}
      </select>
    </div>
  );
}

function useAssignedStudents() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mentorService
      .getStudents()
      .then((x) => {
        const list = x?.content || x || [];
        setStudents(list);
        if (list.length > 0) setStudentId(list[0].id);
      })
      .catch(() => setError('Failed to load assigned students.'))
      .finally(() => setLoading(false));
  }, []);

  return { students, studentId, setStudentId, loading, error };
}

// ── ASSESSMENT EVALUATION VIEW ──────────────────────────────────────
export function AssessmentPage() {
  const { students, studentId, setStudentId, loading: loadingStudents, error: studentsError } =
    useAssignedStudents();
  const [review, setReview] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return undefined;
    setFetching(true);
    setReview(null);
    setError('');
    mentorService
      .getStudentAssessment(studentId)
      .then(setReview)
      .catch((err) => {
        setError(
          err.response?.status === 404
            ? 'No submitted assessment for this candidate yet.'
            : 'Failed to load the assessment review.'
        );
      })
      .finally(() => setFetching(false));
    return undefined;
  }, [studentId]);

  const selected = students.find((s) => s.id === studentId);
  const studentName = selected
    ? `${selected.firstName || ''} ${selected.lastName || ''}`.trim() || 'Candidate'
    : '—';
  const initials =
    studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase() || '—';

  const scores = review
    ? [
        { name: 'Technical Skills', score: Math.round(Number(review.technicalScore ?? 0)) },
        { name: 'Aptitude', score: Math.round(Number(review.aptitudeScore ?? 0)) },
        { name: 'Interest', score: Math.round(Number(review.interestScore ?? 0)) },
        { name: 'Personality', score: Math.round(Number(review.personalityScore ?? 0)) },
      ]
    : [];

  // Derived strictly from the real returned category scores — no invented text.
  const strengthItems = scores
    .filter((x) => x.score >= 70)
    .map((x) => `${x.name}: ${x.score}% (at or above the 70% benchmark)`);
  const gapItems = scores
    .filter((x) => x.score < 60)
    .map((x) => `${x.name}: ${x.score}% (below the 60% review threshold)`);

  const completedAt = review?.completedAt
    ? new Date(review.completedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading
        eyebrow="Diagnostic Review"
        title="Candidate Competency Evaluation"
      >
        Review standardized diagnostic scores, qualitative insights, and provide proctored mentor feedback.
      </Heading>

      <StudentPicker
        students={students}
        studentId={studentId}
        onChange={setStudentId}
        disabled={loadingStudents}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        
        {/* Left: Detailed Student Evaluation Breakdown */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-950 font-mono text-xs font-bold text-white flex items-center justify-center">
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-950">
                  {studentName}
                </h2>
                <p className="text-xs text-neutral-400 font-mono">
                  {completedAt ? `Assessment Completed · ${completedAt}` : 'No submitted assessment'}
                </p>
              </div>
            </div>
            <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#0038FF]">
              {review?.recommendedCategory ? `Track: ${review.recommendedCategory}` : 'Awaiting data'}
            </span>
          </div>

          {(fetching || loadingStudents) && (
            <p className="text-xs font-mono text-neutral-400">Loading candidate review…</p>
          )}
          {!fetching && !loadingStudents && (error || studentsError) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-mono text-amber-800">
              {error || studentsError}
            </div>
          )}

          {/* 4 Score Metric Blocks */}
          <div className="grid gap-4 sm:grid-cols-2">
            {scores.map((x) => (
              <div
                key={x.name}
                className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-500 uppercase">
                    {x.name}
                  </span>
                  <span className="text-base font-black font-mono text-neutral-950">
                    {x.score}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0038FF] rounded-full"
                    style={{ width: `${x.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Qualitative Insights — derived strictly from the real returned scores */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <Insight
              title="Demonstrated Proficiencies"
              items={
                strengthItems.length > 0
                  ? strengthItems
                  : ['No category has reached the 70% benchmark yet.']
              }
            />
            <Insight
              title="Target Remediation Gaps"
              danger
              items={
                gapItems.length > 0
                  ? gapItems
                  : ['No category is below the 60% review threshold.']
              }
            />
          </div>
        </section>

        {/* Right: Advisor Feedback Panel */}
        <FeedbackForm studentId={studentId} type="ASSESSMENT" />
      </div>
    </div>
  );
}

// ── RESUME PORTFOLIO EVALUATION VIEW ────────────────────────────────
export function ResumePage() {
  const { students, studentId, setStudentId, loading: loadingStudents, error: studentsError } =
    useAssignedStudents();
  const [review, setReview] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = (id) => {
    setFetching(true);
    mentorService
      .getStudentResume(id)
      .then(setReview)
      .catch((err) => {
        setReview(null);
        setError(
          err.response?.status === 404
            ? 'No resume uploaded by this candidate yet.'
            : 'Failed to load the resume review.'
        );
      })
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (!studentId) return undefined;
    setReview(null);
    setError('');
    setActionMsg('');
    setRejecting(false);
    setRejectReason('');
    load(studentId);
    return undefined;
  }, [studentId]);

  const selected = students.find((s) => s.id === studentId);
  const studentName = selected
    ? `${selected.firstName || ''} ${selected.lastName || ''}`.trim() || 'Candidate'
    : '—';

  const pctStr = (v) => (v == null ? '—' : `${Math.round(Number(v))}%`);
  const uploadedAt = review?.uploadedAt
    ? new Date(review.uploadedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const download = async () => {
    if (!studentId) return;
    try {
      const res = await mentorService.downloadResume(studentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', review?.fileName || 'resume');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionMsg(err.response?.status === 404 ? 'No stored document for this candidate.' : 'Download failed.');
    }
  };

  const approve = async () => {
    if (!studentId) return;
    try {
      await mentorService.approveResume(studentId);
      setActionMsg('Resume approved.');
      load(studentId);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Approve action failed.');
    }
  };

  const reject = async () => {
    if (!studentId || !rejectReason.trim()) return;
    try {
      await mentorService.rejectResume(studentId, rejectReason.trim());
      setActionMsg('Resume rejected with feedback.');
      setRejecting(false);
      setRejectReason('');
      load(studentId);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Reject action failed.');
    }
  };

  // Revision flags derived strictly from the real returned scores/skills.
  const revisionItems = [];
  if (review?.atsScore != null && review.atsScore < 70) {
    revisionItems.push(`ATS compatibility ${pctStr(review.atsScore)} — below 70%: reformat sections and standardize headings.`);
  }
  if (review?.resumeScore != null && review.resumeScore < 70) {
    revisionItems.push(`Resume quality ${pctStr(review.resumeScore)} — below 70%: add quantified impact metrics.`);
  }
  if (review && (review.skills?.length ?? 0) < 5) {
    revisionItems.push(`Only ${review.skills?.length ?? 0} skills detected — add more role-relevant keywords.`);
  }
  if (review && revisionItems.length === 0) {
    revisionItems.push('Scores at or above thresholds — no automatic revision flags.');
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading
        eyebrow="Portfolio Auditing"
        title="Resume & ATS Validation"
      >
        Review extracted technical proficiencies, parse telemetry, and issue structured guidance.
      </Heading>

      <StudentPicker
        students={students}
        studentId={studentId}
        onChange={setStudentId}
        disabled={loadingStudents}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        
        {/* Left: Resume Details & Review */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-xs xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950">
                {studentName} — Curriculum Vitae
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                {review
                  ? `${review.fileName}${uploadedAt ? ` · Uploaded ${uploadedAt}` : ''}`
                  : 'No stored document'}
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0038FF]">
              <FiFileText size={16} />
            </div>
          </div>

          {(fetching || loadingStudents) && (
            <p className="text-xs font-mono text-neutral-400">Loading resume review…</p>
          )}
          {!fetching && !loadingStudents && (error || studentsError) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-mono text-amber-800">
              {error || studentsError}
            </div>
          )}
          {actionMsg && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs font-mono text-[#0038FF]">
              {actionMsg}
            </div>
          )}

          {/* KPI Metrics — real analysis scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                Quality Benchmark
              </p>
              <p className="text-2xl font-black font-mono text-neutral-950 mt-1">
                {pctStr(review?.resumeScore)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-4">
              <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                ATS Compatibility
              </p>
              <p className="text-2xl font-black font-mono text-[#0038FF] mt-1">
                {pctStr(review?.atsScore)}
              </p>
            </div>
          </div>

          {/* Document Access Box */}
          <div className="rounded-xl border border-dashed border-neutral-200 bg-[#F8FAFC] p-8 text-center space-y-3">
            <FiFileText className="mx-auto text-neutral-400" size={30} />
            <div>
              <p className="text-xs font-bold text-neutral-900 uppercase font-mono">
                {review?.fileName || 'No document stored'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-0.5">
                {review
                  ? `Stored file · ${review.fileType || 'document'}${review.fileSize ? ` · ${Math.max(1, Math.round(review.fileSize / 1024))} KB` : ''}`
                  : 'The candidate has not uploaded a resume yet.'}
              </p>
            </div>
            <button
              onClick={download}
              disabled={!review || fetching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 text-xs font-mono font-semibold transition-all shadow-2xs"
            >
              <FiFileText size={12} />
              <span>Download Stored Document</span>
            </button>
          </div>

          {/* Review status actions */}
          {review && (
            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-mono font-bold uppercase text-[#0038FF]">
                  Status: {review.reviewStatus}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={approve}
                    disabled={fetching || review.reviewStatus === 'APPROVED'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-mono font-semibold transition-all"
                  >
                    <FiCheckCircle size={12} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejecting((v) => !v)}
                    disabled={fetching || review.reviewStatus === 'REJECTED'}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 text-xs font-mono font-semibold transition-all"
                  >
                    <FiTarget size={12} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
              {rejecting && (
                <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                  <textarea
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required, stored as resume feedback)..."
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejecting(false)}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono text-neutral-600 hover:bg-neutral-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={reject}
                      disabled={!rejectReason.trim()}
                      className="rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white px-3 py-1.5 text-xs font-mono font-semibold transition-all"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualitative Tags — real extracted skills + derived revision flags */}
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <Insight
              title="Extracted Technical Stack"
              items={
                review?.skills?.length
                  ? review.skills.slice(0, 12)
                  : ['No skills extracted yet.']
              }
            />
            <Insight
              title="Revision Signals"
              danger
              items={revisionItems.length > 0 ? revisionItems : ['Awaiting resume analysis data.']}
            />
          </div>
        </section>

        {/* Right: Advisor Feedback Panel */}
        <FeedbackForm studentId={studentId} type="RESUME" />
      </div>
    </div>
  );
}

// ── FEEDBACK HISTORY (real GET /api/mentor/feedback) ───────────────────
export function FeedbackHub() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mentorService
      .getFeedback()
      .then(setItems)
      .catch(() => setError('Failed to load feedback history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading eyebrow="Advisory Records" title="Feedback History">
        Every evaluation you have submitted for assigned candidates — assessment reviews and resume reviews, newest first.
      </Heading>

      {loading && <p className="text-xs font-mono text-neutral-400">Loading feedback history…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-mono text-rose-700">
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <FiMessageSquare className="mx-auto text-neutral-300" size={28} />
          <p className="mt-3 text-sm font-bold text-neutral-900">No feedback submitted yet</p>
          <p className="mt-1 text-xs text-neutral-400 font-mono">
            Open Assessments or Resume Reviews, pick a candidate and commit an evaluation.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((f) => (
          <article
            key={`${f.type}-${f.id}`}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#0038FF]">
                  {f.type || 'FEEDBACK'}
                </span>
                <span className="text-sm font-bold text-neutral-950">{f.studentName || 'Candidate'}</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {f.createdAt
                  ? new Date(f.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''}
              </span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">{f.feedback}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── ADVISOR PROFILE (real GET /api/mentor/profile + dashboard) ──────
export function MentorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.allSettled([mentorService.getProfile(), mentorService.getDashboard()])
      .then(([p, d]) => {
        if (p.status === 'fulfilled') setProfile(p.value);
        else setError('Failed to load advisor profile.');
        if (d.status === 'fulfilled') setDash(d.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setPwMsg('');
    setPwErr('');
    try {
      await mentorService.changePassword(pw);
      setPwMsg('Password changed successfully.');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Password change failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-xs font-mono text-neutral-400">Loading advisor profile…</p>;
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading eyebrow="Advisor Profile" title="Professional Account">
        Your verified mentor account, cohort load and credential management.
      </Heading>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-mono text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Account Details
            </span>
            <h2 className="text-base font-bold text-neutral-950 mt-0.5">Verified Advisor</h2>
          </div>
          {profile ? (
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-3.5">
                <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Name</p>
                <p className="font-semibold text-neutral-900 mt-1">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-3.5">
                <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Email</p>
                <p className="font-mono text-neutral-900 mt-1 break-all">{profile.email}</p>
              </div>
              <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-3.5">
                <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Account Status</p>
                <p className="font-semibold text-neutral-900 mt-1">
                  {profile.active === false ? 'Disabled' : 'Active'}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-3.5">
                <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Role</p>
                <p className="font-semibold text-neutral-900 mt-1">Verified Mentor</p>
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-neutral-400">Profile data unavailable.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-center">
              <p className="text-xl font-black font-mono text-[#0038FF]">{dash?.assignedStudents ?? '—'}</p>
              <p className="text-[10px] font-mono uppercase text-neutral-500 mt-1">Assigned Students</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-center">
              <p className="text-xl font-black font-mono text-amber-600">{dash?.pendingResumeReviews ?? '—'}</p>
              <p className="text-[10px] font-mono uppercase text-neutral-500 mt-1">Pending Reviews</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-center">
              <p className="text-xl font-black font-mono text-emerald-600">{dash?.completedReviews ?? '—'}</p>
              <p className="text-[10px] font-mono uppercase text-neutral-500 mt-1">Completed Reviews</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4 self-start">
          <div className="border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Credentials
            </span>
            <h2 className="text-base font-bold text-neutral-950 mt-0.5">Change Password</h2>
          </div>
          <form className="space-y-3" onSubmit={changePassword}>
            <input
              type="password"
              required
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              placeholder="Current password"
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all"
            />
            <input
              type="password"
              required
              minLength={8}
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              placeholder="New password (min 8 characters)"
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all"
            />
            {pwErr && <p className="text-xs font-mono text-rose-600">{pwErr}</p>}
            {pwMsg && <p className="text-xs font-mono text-emerald-600">{pwMsg}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#0038FF] hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 text-xs font-mono font-semibold transition-all shadow-md shadow-blue-500/20"
            >
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

// ── PLACEHOLDER WORKSPACE MODULE ───────────────────────────────────
export function Placeholder({ title, description }) {
  return (
    <div className="space-y-8 max-w-[1400px] mx-auto antialiased selection:bg-[#0038FF] selection:text-white">
      <Heading eyebrow="Mentor Workspace" title={title}>
        {description}
      </Heading>
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-14 text-center space-y-3">
        <FiActivity className="mx-auto text-neutral-300" size={32} />
        <div>
          <p className="text-sm font-bold text-neutral-900 font-mono uppercase">
            {title} — Not Available Yet
          </p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
            This module has no backing service in the current system. Use Feedback Hub and the
            per-candidate review pages for advisor communication.
          </p>
        </div>
      </div>
    </div>
  );
}