import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBriefcase,
  FiLayers,
  FiFileText,
  FiSettings,
  FiSearch,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import { adminService } from '../../services/adminService';

// ── Career Pathways (real DB jobs: role → skills, company, location) ──
export function CareerPathways() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/api/jobs', { params: { size: 100 } })
      .then(({ data }) => setJobs(data?.content || data || []))
      .catch(() => setError('Failed to load career pathways from the job catalog.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return jobs.filter(
      (j) =>
        !q ||
        String(j.title || '').toLowerCase().includes(q) ||
        String(j.companyName || '').toLowerCase().includes(q) ||
        (j.skills || []).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [jobs, query]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 antialiased selection:bg-[#0038FF] selection:text-white">
      <div className="border-b border-neutral-200/80 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          Curriculum &amp; Intelligence
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">Career Pathways</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Live role catalog from the job database — required skills, employers and locations used by the matching engine.
        </p>
      </div>

      <div className="relative max-w-md">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          size={14}
        />
        <input
          className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all shadow-2xs font-mono"
          placeholder="Search roles, employers or skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-xs font-mono text-neutral-400">Loading pathways…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-mono text-rose-700">
          {error}
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <FiBriefcase className="mx-auto text-neutral-300" size={28} />
          <p className="mt-3 text-sm font-bold text-neutral-900">No roles found</p>
          <p className="mt-1 text-xs text-neutral-400 font-mono">
            The job catalog is empty — seed jobs via the jobs API.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((job) => (
          <motion.article
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3 hover:border-[#0038FF]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-950 leading-snug">{job.title}</h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  {job.companyName || '—'}
                  {job.location ? ` · ${job.location}` : ''}
                  {job.remote ? ' · Remote' : ''}
                </p>
              </div>
              <span className="shrink-0 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-[#0038FF]">
                {String(job.employmentType || 'FULL_TIME').replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(job.skills || []).slice(0, 8).map((s) => (
                <span
                  key={s}
                  className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600"
                >
                  {s}
                </span>
              ))}
              {(!job.skills || job.skills.length === 0) && (
                <span className="text-[10px] font-mono text-neutral-400">No skill tags</span>
              )}
            </div>
            {job.active === false && (
              <p className="text-[10px] font-mono uppercase text-amber-600">Inactive listing</p>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
}

// ── Competency Standards (real skill taxonomy from /api/admin/skills) ──
export function CompetencyStandards() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminService
      .getSkills()
      .then((data) => setSkills(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load the skill taxonomy.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(skills.map((s) => s.category).filter(Boolean));
    return Array.from(set).sort();
  }, [skills]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return skills.filter(
      (s) =>
        !q ||
        String(s.skillName || '').toLowerCase().includes(q) ||
        String(s.normalizedName || '').toLowerCase().includes(q) ||
        String(s.category || '').toLowerCase().includes(q)
    );
  }, [skills, query]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 antialiased selection:bg-[#0038FF] selection:text-white">
      <div className="border-b border-neutral-200/80 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          Curriculum &amp; Intelligence
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">Competency Standards</h1>
        <p className="text-xs text-neutral-500 mt-1">
          The normalized skill taxonomy that backs resume parsing, assessment tagging and job matching.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Taxonomy Entries</p>
          <p className="text-2xl font-black font-mono text-neutral-950 mt-1">{skills.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Categories</p>
          <p className="text-2xl font-black font-mono text-[#0038FF] mt-1">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <p className="text-[10px] font-mono uppercase text-neutral-400 font-bold">Matching Records</p>
          <p className="text-2xl font-black font-mono text-neutral-950 mt-1">{visible.length}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          size={14}
        />
        <input
          className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3.5 py-2 text-xs text-neutral-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-[#0038FF] transition-all shadow-2xs font-mono"
          placeholder="Search skills or categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className="text-xs font-mono text-neutral-400">Loading taxonomy…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-mono text-rose-700">
          {error}
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <FiLayers className="mx-auto text-neutral-300" size={28} />
          <p className="mt-3 text-sm font-bold text-neutral-900">No taxonomy entries</p>
        </div>
      )}

      {visible.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left font-mono text-[10px] uppercase text-neutral-500">
                <th className="px-4 py-3">Skill</th>
                <th className="px-4 py-3">Normalized</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 100).map((s) => (
                <tr key={s.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                  <td className="px-4 py-2.5 font-semibold text-neutral-900">{s.skillName}</td>
                  <td className="px-4 py-2.5 font-mono text-neutral-500">{s.normalizedName || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-mono text-[#0038FF]">
                      {s.category || 'Uncategorized'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length > 100 && (
            <p className="border-t border-neutral-100 px-4 py-3 text-[11px] font-mono text-neutral-400">
              Showing first 100 of {visible.length} — refine the search to narrow results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Audit Reports (real dashboard/statistics/assessment data + CSV) ──
export function AuditReports() {
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([
      adminService.getDashboard(),
      adminService.getResumeStatistics(),
      adminService.getAssessments(),
    ])
      .then(([d, s, a]) => {
        if (d.status === 'fulfilled') setDashboard(d.value);
        if (s.status === 'fulfilled') setStats(s.value);
        if (a.status === 'fulfilled') setAssessments(Array.isArray(a.value) ? a.value : []);
        if (d.status === 'rejected' && s.status === 'rejected' && a.status === 'rejected') {
          setError('Failed to load report data.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!dashboard) return [];
    const statusCounts = assessments.reduce((acc, x) => {
      const key = x.status || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return [
      ['Total users', dashboard.totalUsers],
      ['Students', dashboard.totalStudents],
      ['Mentors', dashboard.totalMentors],
      ['Admins', dashboard.totalAdmins],
      ['Active users', dashboard.activeUsers],
      ['Resumes indexed', stats?.totalResumes ?? dashboard.totalResumes],
      ['Assessment sessions', dashboard.totalAssessments],
      ['Mean resume score', `${Math.round(dashboard.averageResumeScore || 0)}%`],
      ['Mean ATS score', `${Math.round(dashboard.averageAtsScore || 0)}%`],
      ['Published assessments', assessments.length],
      ...Object.entries(statusCounts).map(([k, v]) => [`Published assessments — ${k}`, v]),
    ];
  }, [dashboard, stats, assessments]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const csv = ['metric,value', ...rows.map(([k, v]) => `"${String(k).replace(/"/g, '""')}",${v}`)].join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 antialiased selection:bg-[#0038FF] selection:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
            System Configuration
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">Audit Reports</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Platform performance snapshot aggregated from the live database — exportable as CSV.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0038FF] hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2.5 text-xs font-mono font-semibold transition-all shadow-md shadow-blue-500/20"
        >
          <FiDownload size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {loading && <p className="text-xs font-mono text-neutral-400">Aggregating report data…</p>}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-mono text-rose-700">
          {error}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left font-mono text-[10px] uppercase text-neutral-500">
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                  <td className="px-4 py-2.5 font-semibold text-neutral-900">{label}</td>
                  <td className="px-4 py-2.5 font-mono text-right text-neutral-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <FiFileText className="mx-auto text-neutral-300" size={28} />
          <p className="mt-3 text-sm font-bold text-neutral-900">No report data available</p>
        </div>
      )}
    </div>
  );
}

// ── Platform Settings (admin profile, password change, health check) ──
export function PlatformSettings() {
  const [profile, setProfile] = useState(null);
  const [health, setHealth] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/api/admin/profile')
      .then(({ data }) => setProfile(data))
      .catch(() => {});
    api
      .get('/health')
      .then(({ data }) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setPwMsg('');
    setPwErr('');
    try {
      await adminService.changePassword(pw);
      setPwMsg('Password changed successfully.');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Password change failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10 antialiased selection:bg-[#0038FF] selection:text-white">
      <div className="border-b border-neutral-200/80 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          System Configuration
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-0.5">Platform Settings</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Administrator account security and platform service health.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
              Administrator Account
            </span>
            <h2 className="text-base font-bold text-neutral-950 mt-0.5">Signed-in Admin</h2>
          </div>
          {profile ? (
            <div className="grid gap-3 text-xs sm:grid-cols-2">
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
            </div>
          ) : (
            <p className="text-xs font-mono text-neutral-400">Loading account…</p>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-[#F8FAFC] p-3.5 text-xs">
            {health ? (
              <>
                <FiCheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span className="font-mono text-neutral-700">Backend health: {health}</span>
              </>
            ) : (
              <>
                <FiAlertCircle size={14} className="text-amber-600 shrink-0" />
                <span className="font-mono text-neutral-700">Backend health endpoint unreachable</span>
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4 self-start">
          <div className="border-b border-neutral-100 pb-3">
            <FiSettings size={14} className="inline text-[#0038FF] mr-1.5" />
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
