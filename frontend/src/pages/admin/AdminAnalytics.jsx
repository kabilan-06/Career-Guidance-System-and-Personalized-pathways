import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers, FiBarChart2,
  FiTarget, FiChevronDown, FiShield, FiActivity, FiFileText
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { adminService } from '../../services/adminService';

const ranges = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'This academic year'];

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

export default function AdminAnalytics() {
  const [range, setRange] = useState('Last 30 days');
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

  // All charts derive from the real assessment bank only. Per-attempt analytics
  // (pass rates, score history, mean scores) require an admin attempts endpoint
  // and stay out until that data source exists - no invented numbers.
  const categoryStats = Object.values(
    assessments.reduce((acc, a) => {
      const key = a.category || 'Uncategorized';
      if (!acc[key]) acc[key] = { category: key, assessments: 0, published: 0 };
      acc[key].assessments += 1;
      if (['PUBLISHED', 'ACTIVE'].includes(a.status)) acc[key].published += 1;
      return acc;
    }, {})
  );

  const difficultyStats = Object.values(
    assessments.reduce((acc, a) => {
      const key = a.difficulty || 'UNSPECIFIED';
      if (!acc[key]) acc[key] = { name: key, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );

  const publishedCount = assessments.filter((item) => ['PUBLISHED', 'ACTIVE'].includes(item.status)).length;

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

      {/* Header & Range Controls */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Evaluation Intelligence
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[#0038FF] text-[9px] font-bold font-mono uppercase">
              <FiShield size={9} /> Assessment bank
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">
            Cohort Analytics & Benchmarks
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Composition of the assessment bank by category and difficulty tier. Attempt-level score analytics appear here once evaluation history is available.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-xs font-mono text-neutral-800 shadow-2xs focus:border-transparent focus:ring-2 focus:ring-[#0038FF] focus:outline-none cursor-pointer"
            >
              {ranges.map((r) => <option key={r}>{r}</option>)}
            </select>
            <FiChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </motion.div>

      {/* KPI Stat Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Assessments" value={assessments.length} delay={0.05} />
        <StatCard icon={FiBarChart2} label="Categories in Use" value={categoryStats.length} delay={0.1} />
        <StatCard icon={FiTarget} label="Difficulty Tiers" value={difficultyStats.length} delay={0.15} />
        <StatCard icon={FiActivity} label="Published Assessments" value={publishedCount} delay={0.2} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400 font-mono">
          Loading assessment analytics...
        </div>
      ) : assessments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <FiFileText className="mx-auto mb-3 text-neutral-300" size={36} />
          <p className="font-bold text-neutral-800 text-sm">No assessments created yet</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Create and publish assessments to see category composition and difficulty distribution here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Category Composition */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Competency Breakdown
              </span>
              <h2 className="text-sm font-bold text-neutral-950 mt-0.5">Assessments by Category</h2>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, 'Assessments']} />
                  <Bar dataKey="assessments" fill="#0038FF" radius={[4, 4, 0, 0]} name="Assessments" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-100 pt-3">
              <span>From the live assessment bank</span>
              <span>{categoryStats.length} categor{categoryStats.length === 1 ? 'y' : 'ies'}</span>
            </div>
          </motion.div>

          {/* Difficulty Composition */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.25 }}
            className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                Curriculum Calibration
              </span>
              <h2 className="text-sm font-bold text-neutral-950 mt-0.5">Assessments by Difficulty Tier</h2>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}`, 'Assessments']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Assessments" barSize={32}>
                    {difficultyStats.map((entry, i) => (
                      <Cell key={i} fill={entry.name === 'EASY' ? '#10B981' : entry.name === 'MEDIUM' ? '#0038FF' : entry.name === 'HARD' ? '#F59E0B' : '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-100 pt-3">
              <span>Easy / Medium / Hard tier distribution</span>
              <span>{difficultyStats.length} tier{difficultyStats.length === 1 ? '' : 's'}</span>
            </div>
          </motion.div>

        </div>
      )}

    </div>
  );
}
