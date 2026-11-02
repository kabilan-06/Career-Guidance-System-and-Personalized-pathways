import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2,
  Bookmark,
  BookmarkCheck,
  Send,
  Loader2,
  FileCheck,
  MapPin,
  DollarSign
} from 'lucide-react';
import jobService from '../../services/jobService';

export default function JobMatches({ jobMatches: initialMatches, selectedRoleId, onSelectRole, selectingRole }) {
  const [matches, setMatches] = useState(Array.isArray(initialMatches) ? initialMatches : []);
  const [loading, setLoading] = useState(!Array.isArray(initialMatches) || initialMatches.length === 0);
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Apply dialog state
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Fetch matches from API if not supplied via props
  useEffect(() => {
    if (Array.isArray(initialMatches) && initialMatches.length > 0) {
      setMatches(initialMatches);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await jobService.getJobMatches();
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setMatches(list);
        }
      } catch (err) {
        if (isMounted) {
          // If unauthenticated or no resume yet, keep empty without crashing
          setError(err?.response?.data?.message || 'Unable to fetch personalized job matches.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMatches();
    return () => {
      isMounted = false;
    };
  }, [initialMatches]);

  // Handle Save / Unsave
  const handleToggleSave = async (jobId, currentSaved) => {
    try {
      if (currentSaved) {
        await jobService.unsaveJob(jobId);
      } else {
        await jobService.saveJob(jobId);
      }
      setMatches((prev) =>
        prev.map((item) => {
          const id = item.job?.id || item.jobId || item.id;
          if (id === jobId) {
            const nextSaved = !currentSaved;
            return {
              ...item,
              saved: nextSaved,
              job: item.job ? { ...item.job, saved: nextSaved } : item.job,
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Failed to toggle save status:', err);
    }
  };

  // Handle Apply Submission
  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyingJobId) return;

    try {
      setSubmittingApply(true);
      const res = await jobService.applyToJob(applyingJobId, { coverLetter });
      setApplySuccessMsg('Application submitted successfully!');

      setMatches((prev) =>
        prev.map((item) => {
          const id = item.job?.id || item.jobId || item.id;
          if (id === applyingJobId) {
            return {
              ...item,
              applied: true,
              applicationStatus: res?.status || 'APPLIED',
              job: item.job ? { ...item.job, applied: true, applicationStatus: res?.status || 'APPLIED' } : item.job,
            };
          }
          return item;
        })
      );

      setTimeout(() => {
        setApplyingJobId(null);
        setCoverLetter('');
        setApplySuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit application:', err);
      alert(err?.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmittingApply(false);
    }
  };

  // Sort matches by match score descending
  const sortedMatches = [...matches].sort((a, b) => {
    const scoreA = a.matchScore ?? Math.round((a.match_score ?? 0) * (a.match_score <= 1 ? 100 : 1));
    const scoreB = b.matchScore ?? Math.round((b.match_score ?? 0) * (b.match_score <= 1 ? 100 : 1));
    return scoreB - scoreA;
  });

  if (loading) {
    return (
      <div className="card p-10 text-center text-slate-500">
        <Loader2 className="mx-auto mb-3 text-blue-600 animate-spin" size={36} />
        <p className="font-bold text-slate-800 text-base">Computing Semantic Job Matches...</p>
        <p className="text-xs text-slate-400 mt-1">Analyzing your competencies against live industry openings via Local AI vector embeddings.</p>
      </div>
    );
  }

  if (sortedMatches.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        <Briefcase className="mx-auto mb-3 text-slate-300" size={36} />
        <p className="font-bold text-slate-800 text-base">No Matching Job Openings Found</p>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          {error || 'Upload your latest resume to automatically match your profile with relevant technical positions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Briefcase className="text-blue-600" size={22} /> Semantic Job Matches
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ranked job matches computed via Local AI Vector Embeddings.
          </p>
        </div>
        <span className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
          {sortedMatches.length} Openings Analyzed
        </span>
      </div>

      {/* Job Match Cards */}
      <div className="grid gap-4">
        {sortedMatches.map((item, idx) => {
          const rank = idx + 1;
          const job = item.job || item;
          const jobId = job.id || item.jobId || item.id;
          const title = job.title || item.jobTitle || item.job_title || 'Software Role';
          const company = job.companyName || job.company?.name || item.company || '';
          const location = job.location || item.location || '';
          const employmentType = job.employmentType || item.employmentType || '';
          const matchScore = item.matchScore ?? Math.round((item.match_score ?? 0) * (item.match_score <= 1 ? 100 : 1));
          const matchedSkills = Array.isArray(item.matchedSkills) ? item.matchedSkills : (Array.isArray(item.matched_skills) ? item.matched_skills : []);
          const missingSkills = Array.isArray(item.missingSkills) ? item.missingSkills : (Array.isArray(item.missing_skills) ? item.missing_skills : []);
          const reasoning = item.reasoning || item.whyRankedHere || '';
          const domain = item.domain || '';
          const semanticSimilarity = typeof item.semanticSimilarity === 'number'
            ? item.semanticSimilarity
            : (typeof item.semantic_similarity === 'number' ? item.semantic_similarity : null);
          const jobSummary = item.jobSummary || item.job_summary || '';
          const isSaved = item.saved || job.saved || false;
          const isApplied = item.applied || job.applied || false;
          const applicationStatus = item.applicationStatus || job.applicationStatus || (isApplied ? 'APPLIED' : null);

          const isExpanded = expandedIndex === idx;
          const isSelected = selectedRoleId && (selectedRoleId === jobId || selectedRoleId === item.jobId);

          return (
            <div
              key={jobId || idx}
              className={`rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 shadow-md'
                  : rank === 1
                  ? 'border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 shadow-md'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              {/* Card Main Row */}
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                      rank === 1
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    #{rank}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-lg flex items-center gap-2 truncate">
                      <span className="truncate">{title}</span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                          <CheckCircle2 size={10} /> Selected role
                        </span>
                      ) : rank === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                          <Sparkles size={10} /> Top Match
                        </span>
                      )}
                      {applicationStatus && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 shrink-0">
                          <FileCheck size={10} /> {applicationStatus}
                        </span>
                      )}
                    </h3>
                    <div className="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      {company && (
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <Building2 size={12} className="text-slate-400" /> {company}
                        </span>
                      )}
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" /> {location}
                        </span>
                      )}
                      {employmentType && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {employmentType.replace('_', ' ')}
                        </span>
                      )}
                      {domain && (
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                          {String(domain).replaceAll('_', ' ')}
                        </span>
                      )}
                      {semanticSimilarity != null && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-100" title="Cosine similarity between your resume profile and this role's embedding">
                          Semantic fit {Math.round(semanticSimilarity * (semanticSimilarity <= 1 ? 100 : 1))}%
                        </span>
                      )}
                      {job.salaryMin && job.salaryMax && (
                        <span className="flex items-center gap-0.5 text-emerald-700 font-mono text-[11px]">
                          <DollarSign size={11} /> {Number(job.salaryMin).toLocaleString()} - {Number(job.salaryMax).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score, Save, Apply, and Expand Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Match Score</span>
                    <span className="text-2xl font-black text-blue-600">{matchScore}%</span>
                  </div>

                  {/* Save/Unsave Button */}
                  {jobId && (
                    <button
                      type="button"
                      onClick={() => handleToggleSave(jobId, isSaved)}
                      className={`rounded-xl p-2.5 border transition ${
                        isSaved
                          ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                      title={isSaved ? 'Remove from saved' : 'Save job'}
                      aria-label={isSaved ? 'Saved job' : 'Save job'}
                    >
                      {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                  )}

                  {/* Apply Button */}
                  {jobId && (
                    <button
                      type="button"
                      onClick={() => setApplyingJobId(jobId)}
                      disabled={isApplied}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                        isApplied
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 size={13} /> Applied
                        </>
                      ) : (
                        <>
                          <Send size={13} /> Apply
                        </>
                      )}
                    </button>
                  )}

                  {/* Choose Role Button (if onSelectRole provided) */}
                  {onSelectRole && jobId && (
                    <button
                      type="button"
                      onClick={() => onSelectRole(jobId)}
                      disabled={selectingRole || isSelected}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose role'}
                    </button>
                  )}

                  {/* Expand / Collapse Button */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-5 pb-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-5 pt-3 border-t border-slate-100 grid gap-4 md:grid-cols-2 bg-slate-50/50 rounded-b-2xl">
                  {/* Job Description Summary */}
                  {job.description && (
                    <div className="md:col-span-2 rounded-xl border border-slate-200/80 bg-white p-4">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
                        Position Description
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{job.description}</p>
                      {job.requirements && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <span className="font-bold text-[11px] text-slate-700">Requirements: </span>
                          <span className="text-xs text-slate-600">{job.requirements}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matched skills */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs uppercase tracking-wider mb-2">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Matched Skills ({matchedSkills.length})
                    </h4>
                    {matchedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.map((sk, i) => (
                          <span key={i} className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No direct matches recorded in resume skills.</p>
                    )}
                  </div>

                  {/* Missing skills */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">
                      <AlertCircle size={14} className="text-amber-600" /> Missing Competencies ({missingSkills.length})
                    </h4>
                    {missingSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkills.map((sk, i) => (
                          <span key={i} className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                            • {sk}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold">No missing skills detected for this role!</p>
                    )}
                  </div>

                  {/* Job Summary from AI model */}
                  {jobSummary && (
                    <div className="md:col-span-2 rounded-xl border border-slate-200/80 bg-white p-4">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
                        Role Overview
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{jobSummary}</p>
                    </div>
                  )}

                  {/* AI Reasoning / Why Ranked Here */}
                  {reasoning && (
                    <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                      <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600" /> AI Semantic Analysis & Reasoning
                      </h4>
                      <p className="text-xs text-indigo-900 leading-relaxed font-sans">{reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Modal */}
      {applyingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Send className="text-emerald-600" size={18} /> Apply for Position
              </h3>
              <button
                type="button"
                onClick={() => setApplyingJobId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {applySuccessMsg ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-emerald-800 font-bold text-sm">
                ✓ {applySuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attached Resume
                  </label>
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    Your active uploaded profile resume will be automatically attached to this submission.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Letter / Candidate Note (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Describe why you are a great fit for this position..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyingJobId(null)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {submittingApply ? (
                      <>
                        <Loader2 className="animate-spin" size={13} /> Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
