import React from 'react';
import { Trophy, TrendingUp, CheckCircle2, Target, ArrowRight, Award, Gauge } from 'lucide-react';

/**
 * Renders the career_guidance.recommended_roles payload returned by the local
 * AI pipeline: ranked roles with per-role readiness/overall scores, observed
 * strengths, improvement areas, and recommended next steps.
 */
export default function RecommendedRoles({ roles }) {
  const list = Array.isArray(roles) ? roles : [];
  if (list.length === 0) return null;

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="text-emerald-600" size={22} /> Recommended Roles — Deep Analysis
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Per-role readiness breakdown with your strengths, improvement areas, and suggested next steps.
          </p>
        </div>
        <span className="rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-100">
          {list.length} Roles Analyzed
        </span>
      </div>

      <div className="grid gap-4">
        {list.map((role, idx) => (
          <div
            key={`${role.role}-${idx}`}
            className={`rounded-2xl border p-5 transition ${
              idx === 0
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 shadow-md'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm ${idx === 0 ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                  #{role.rank ?? idx + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-lg truncate flex items-center gap-2">
                    {role.role}
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                        <Award size={10} /> Best Fit
                      </span>
                    )}
                  </h3>
                  {role.domain && <p className="text-xs font-semibold text-slate-500 mt-0.5">{String(role.domain).replaceAll('_', ' ')}</p>}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                {role.jobMatchScore != null && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Match</span>
                    <span className="text-xl font-black text-blue-600">{role.jobMatchScore}%</span>
                  </div>
                )}
                {role.readinessScore != null && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end"><Gauge size={11} /> Readiness</span>
                    <span className="text-xl font-black text-indigo-600">{role.readinessScore}%</span>
                  </div>
                )}
                {role.overallScore != null && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end"><TrendingUp size={11} /> Overall</span>
                    <span className="text-xl font-black text-emerald-600">{role.overallScore}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {role.strengths.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs uppercase tracking-wider mb-2">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {role.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-emerald-900 leading-relaxed">✓ {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {role.improvementAreas.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">
                    <Target size={13} className="text-amber-600" /> Improve
                  </h4>
                  <ul className="space-y-1.5">
                    {role.improvementAreas.map((s, i) => (
                      <li key={i} className="text-xs text-amber-900 leading-relaxed">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {role.nextSteps.length > 0 && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h4 className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs uppercase tracking-wider mb-2">
                    <ArrowRight size={13} className="text-indigo-600" /> Next Steps
                  </h4>
                  <ul className="space-y-1.5">
                    {role.nextSteps.map((s, i) => (
                      <li key={i} className="text-xs text-indigo-900 leading-relaxed">{i + 1}. {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
