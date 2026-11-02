import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiClipboard, FiUsers, FiPlusSquare,
  FiCheckCircle, FiShield, FiFileText, FiFilePlus
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminService } from '../../services/adminService';

const StatCard = ({ icon: Icon, label, value, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.2 }}
    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono">
        {label}
      </span>
      <span className="h-7 w-7 rounded-lg bg-blue-50 text-[#0038FF] flex items-center justify-center">
        <Icon size={14} />
      </span>
    </div>
    <div className="mt-3">
      <div className="text-2xl font-black text-neutral-950 font-mono tracking-tight">{value}</div>
    </div>
  </motion.div>
);

export default function AdminAssessmentDashboard() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAssessments().then((data) => {
      setAssessments(Array.isArray(data) ? data : data?.content || []);
      setLoading(false);
    }).catch(() => {
      setAssessments([]);
      setLoading(false);
    });
  }, []);

  // Derived entirely from the real assessment bank. Attempt-level metrics
  // (submissions, mean score, completion ratio) need an admin attempts
  // endpoint that does not exist yet, so they are not shown at all.
  const publishedCount = assessments.filter((item) => ['PUBLISHED', 'ACTIVE'].includes(item.status)).length;
  const draftCount = assessments.filter((item) => item.status === 'DRAFT').length;

  const statusStats = Object.values(
    assessments.reduce((acc, a) => {
      const key = a.status || 'UNKNOWN';
      if (!acc[key]) acc[key] = { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );

  const questionVolume = [...assessments]
    .sort((a, b) => (b.totalQuestions || 0) - (a.totalQuestions || 0))
    .slice(0, 8)
    .map((a) => ({ name: a.title?.length > 18 ? `${a.title.slice(0, 18)}...` : a.title, questions: a.totalQuestions || 0 }));

  const tooltipStyle = {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace'
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 antialiased selection:bg-[#0038FF] selection:text-white">

      {/* Top Header Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Evaluation Engine
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[#0038FF] text-[9px] font-bold font-mono uppercase">
              <FiShield size={9} /> Admin
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">
            Assessment Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mt-1">
            Create, publish, and monitor the assessment bank. Attempt-level submission analytics appear here once evaluation history is available.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/assessments')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-2xs font-mono"
          >
            <FiClipboard size={13} />
            <span>Manage Bank</span>
          </button>

          <button
            onClick={() => navigate('/admin/assessments/create')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0038FF] hover:bg-blue-700 active:scale-[0.99] px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-blue-500/20"
          >
            <FiPlusSquare size={13} />
            <span>Create Assessment</span>
          </button>
        </div>
      </motion.div>

      {/* Top Metric Stat Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiClipboard} label="Total Evaluations" value={assessments.length} delay={0.05} />
        <StatCard icon={FiCheckCircle} label="Published" value={publishedCount} delay={0.1} />
        <StatCard icon={FiFilePlus} label="Drafts" value={draftCount} delay={0.15} />
        <StatCard icon={FiUsers} label="Total Questions" value={assessments.reduce((sum, a) => sum + (a.totalQuestions || 0), 0)} delay={0.2} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400 font-mono">
          Loading assessment dashboard...
        </div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <FiFileText className="mx-auto mb-3 text-neutral-300" size={36} />
          <p className="font-bold text-neutral-800 text-sm">No assessments yet</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Create your first assessment to populate the bank and see composition analytics here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Status Composition */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Bank Composition
              </span>
              <h2 className="text-sm font-bold text-neutral-950 mt-0.5">Assessments by Status</h2>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, 'Assessments']} />
                  <Bar dataKey="count" fill="#0038FF" radius={[4, 4, 0, 0]} name="Assessments" barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-100 pt-3">
              <span>Live from the assessment bank</span>
              <span>{statusStats.length} state{statusStats.length === 1 ? '' : 's'}</span>
            </div>
          </motion.div>

          {/* Question Volume */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.25 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Question Volume
              </span>
              <h2 className="text-sm font-bold text-neutral-950 mt-0.5">Largest Assessments by Question Count</h2>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionVolume} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, 'Questions']} />
                  <Bar dataKey="questions" fill="#64748B" radius={[0, 4, 4, 0]} name="Questions" barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-100 pt-3">
              <span>Top {questionVolume.length} of {assessments.length}</span>
              <Link to="/admin/assessments" className="text-[#0038FF] hover:underline flex items-center gap-1 font-semibold">
                Manage bank
              </Link>
            </div>
          </motion.div>

        </div>
      )}

    </div>
  );
}
