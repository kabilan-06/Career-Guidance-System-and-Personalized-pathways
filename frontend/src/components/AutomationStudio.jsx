import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiZap,
  FiTerminal,
  FiFileText,
  FiCopy,
  FiCheck,
  FiDownload,
  FiPlay,
  FiShield,
  FiCpu,
  FiActivity,
  FiAward,
  FiAlertTriangle,
  FiRefreshCw,
  FiLayers,
  FiRadio,
  FiEye,
  FiMic
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { CODE_SNIPPETS } from '../data/codeSnippets';

export default function AutomationStudio() {
  const [activeTab, setActiveTab] = useState('simulators'); // 'automation' | 'simulators' | 'resume'
  const [selectedSnippetKey, setSelectedSnippetKey] = useState('adaptiveTestingService');
  const [copiedKey, setCopiedKey] = useState(null);

  // ==========================================
  // SIMULATOR 1: 3PL IRT Mathematical Engine
  // ==========================================
  const [theta, setTheta] = useState(0.5); // Candidate Ability (-3 to 3)
  const [paramA, setParamA] = useState(1.4); // Discrimination (0.5 to 2.5)
  const [paramB, setParamB] = useState(0.8); // Difficulty (-2 to 2)
  const [paramC, setParamC] = useState(0.25); // Guessing (0.1 to 0.3)
  const [answeredCount, setAnsweredCount] = useState(6);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [answerLatency, setAnswerLatency] = useState(2400);

  // Compute 3PL Probability curve
  const irtChartData = useMemo(() => {
    const points = [];
    for (let t = -3.0; t <= 3.0; t += 0.25) {
      const exponent = -1.702 * paramA * (t - paramB);
      const prob = paramC + (1 - paramC) / (1 + Math.exp(exponent));
      points.push({
        theta: Number(t.toFixed(2)),
        probability: Number((prob * 100).toFixed(1)),
      });
    }
    return points;
  }, [paramA, paramB, paramC]);

  const currentProb = useMemo(() => {
    const exponent = -1.702 * paramA * (theta - paramB);
    return paramC + (1 - paramC) / (1 + Math.exp(exponent));
  }, [theta, paramA, paramB, paramC]);

  const fisherInformation = useMemo(() => {
    const p = currentProb;
    if (p <= paramC || p >= 1.0) return 0.05;
    const num = Math.pow(1.702 * paramA, 2) * Math.pow(p - paramC, 2) * (1 - p);
    const den = Math.pow(1 - paramC, 2) * p;
    return Number((num / den).toFixed(2));
  }, [currentProb, paramA, paramC]);

  const handleSimulateAnswer = (isCorrect) => {
    const expectedMs = 3000;
    const speedRatio = answerLatency / expectedMs;
    const speedWeight = isCorrect
      ? (speedRatio < 0.7 ? 1.25 : speedRatio > 1.5 ? 0.85 : 1.0)
      : (speedRatio < 0.3 ? 1.35 : 1.0);

    const actualScore = isCorrect ? 1.0 : 0.0;
    const delta = 0.55 * paramA * (actualScore - currentProb) * speedWeight;
    const newTheta = Math.max(-3.5, Math.min(3.5, theta + delta));

    setTheta(Number(newTheta.toFixed(2)));
    setAnsweredCount(c => c + 1);
    setLastFeedback({
      isCorrect,
      delta: (delta > 0 ? '+' : '') + delta.toFixed(2),
      speedWeight: speedWeight.toFixed(2),
      time: answerLatency
    });
  };

  // ==========================================
  // SIMULATOR 2: Sandbox & AST Security Runner
  // ==========================================
  const SANDBOX_PRESETS = [
    {
      name: 'Safe: Concurrent Arena Leaderboard',
      code: `public class Solution {
    public static void main(String[] args) {
        java.util.concurrent.ConcurrentHashMap<String, Integer> board = new java.util.concurrent.ConcurrentHashMap<>();
        board.put("Kabilan", 1450);
        board.put("Candidate_9", 1120);
        System.out.println("Leaderboard broadcast computed: " + board);
    }
}`
    },
    {
      name: 'Violation: ProcessBuilder Exploit',
      code: `public class Solution {
    public static void main(String[] args) throws Exception {
        // Forbidden AST Pattern
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "dir");
        pb.start();
    }
}`
    },
    {
      name: 'Violation: System.exit Termination',
      code: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Attempting container kill...");
        System.exit(1); // Blocked by Sandbox Security
    }
}`
    },
    {
      name: 'Violation: Infinite Loop (Timeout Quota)',
      code: `public class Solution {
    public static void main(String[] args) {
        System.out.println("Starting long running loop...");
        while (true) {
            // Infinite loop test
        }
    }
}`
    }
  ];

  const [sandboxCode, setSandboxCode] = useState(SANDBOX_PRESETS[0].code);
  const [sandboxOutput, setSandboxOutput] = useState(null);
  const [isRunningSandbox, setIsRunningSandbox] = useState(false);

  const handleRunSandbox = () => {
    setIsRunningSandbox(true);
    setSandboxOutput(null);

    setTimeout(() => {
      setIsRunningSandbox(false);
      const code = sandboxCode;

      if (/ProcessBuilder/i.test(code)) {
        setSandboxOutput({
          status: 'SECURITY_VIOLATION',
          message: 'Security Audit Failed: ProcessBuilder execution is strictly forbidden.',
          exitCode: 403,
          timeMs: 4,
          logs: '[AST SECURITY] Prohibited identifier found: ProcessBuilder\n[POLICY] Hard security barrier invoked. Process terminated.'
        });
      } else if (/System\.exit/i.test(code)) {
        setSandboxOutput({
          status: 'SECURITY_VIOLATION',
          message: 'Security Audit Failed: System.exit invocation blocked.',
          exitCode: 403,
          timeMs: 3,
          logs: '[AST SECURITY] Malicious JVM shutdown attempt detected.\n[POLICY] Rejected with SecurityManager violation.'
        });
      } else if (/while\s*\(\s*true\s*\)/i.test(code)) {
        setSandboxOutput({
          status: 'TIME_LIMIT_EXCEEDED',
          message: 'Execution killed after reaching hard 4000ms sandbox quota.',
          exitCode: 124,
          timeMs: 4000,
          logs: '[SANDBOX RUNNER] Process spawned PID 29481\n[TIMEOUT] 4000ms limit reached without return.\n[CLEANUP] Thread interrupted forcibly.'
        });
      } else {
        setSandboxOutput({
          status: 'SUCCESS',
          message: 'Compilation and sandboxed run completed successfully.',
          exitCode: 0,
          timeMs: 142,
          logs: '[SANDBOX RUNNER] Compilation: javac Solution.java (0 errors)\n[STDOUT] Leaderboard broadcast computed: {Kabilan=1450, Candidate_9=1120}\n[CONTAINER] Memory peak: 24MB / 128MB limit.'
        });
      }
    }, 700);
  };

  // ==========================================
  // SIMULATOR 3: AI Technical Mock Interviewer
  // ==========================================
  const [interviewTopic, setInterviewTopic] = useState('distributed');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [interviewResult, setInterviewResult] = useState(null);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);

  const INTERVIEW_QUESTIONS = {
    distributed: {
      title: 'Distributed System Concurrency',
      question: 'How would you prevent duplicate score processing in a real-time multiplayer quiz arena with 10,000 requests/sec?',
      defaultAnswer: 'I would use Redis distributed locks with Redlock or atomic INCRBY / ZADD operations with idempotency keys tied to questionId and userId to ensure exactly-once scoring semantics.'
    },
    irt: {
      title: 'Item Response Theory (IRT)',
      question: 'Explain why the 3-Parameter Logistic (3PL) model is superior to classical test percentage scoring.',
      defaultAnswer: 'Classical scoring treats all questions equally, while 3PL models item discrimination (a), difficulty (b), and guessing (c). It accurately estimates latent proficiency Theta with measurable standard error.'
    }
  };

  const handleEvaluateInterview = () => {
    setIsEvaluatingInterview(true);
    setTimeout(() => {
      setIsEvaluatingInterview(false);
      setInterviewResult({
        overallScore: 94,
        accuracy: 96,
        architecture: 92,
        clarity: 95,
        feedback: 'Exceptional architectural clarity. Correctly identified idempotency keys, distributed atomic Redis semantics, and thread safety concerns.'
      });
    }, 800);
  };

  // ==========================================
  // SIMULATOR 4: Railway Multimodal & Voice Triage
  // ==========================================
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [voiceSimStatus, setVoiceSimStatus] = useState(null);

  const handleSimulateVoice = () => {
    setVoiceSimStatus('processing');
    setTimeout(() => {
      setVoiceSimStatus({
        lang: selectedLanguage === 'hi' ? 'Hindi (Northern Railway)' : selectedLanguage === 'ta' ? 'Tamil (Southern Railway)' : 'English (Central)',
        confidence: 0.96,
        sentiment: 'URGENT',
        urgencyScore: 89,
        extractedIssue: 'Overhead Traction / Pantograph Sparking Alert at Level Crossing km 142/6',
        routingQueue: 'EMERGENCY_DISPATCH_LEVEL_1'
      });
    }, 600);
  };

  // ==========================================
  // RESUME XYZ REWRITER STATE
  // ==========================================
  const [resumeX, setResumeX] = useState('Engineered an AI-Adaptive Testing Engine');
  const [resumeY, setResumeY] = useState('reducing candidate test duration by 35% with 94% diagnostic precision');
  const [resumeZ, setResumeZ] = useState('implementing 3-Parameter Logistic (3PL) Item Response Theory (IRT) and speed-weighted recalibration in Java & Spring Boot');

  const generatedBullet = useMemo(() => {
    return `${resumeX.trim()}, as measured by ${resumeY.trim()}, by ${resumeZ.trim()}.`;
  }, [resumeX, resumeY, resumeZ]);

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20 text-white">
                <FiZap className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Automation Studio & Interactive Simulators
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Live Engine
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Test Item Response Theory algorithms, concurrency sandboxes, and deploy pre-built microservices.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('simulators')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'simulators'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FiPlay className="w-4 h-4" />
              Interactive Simulators
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'automation'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FiTerminal className="w-4 h-4" />
              Automate Feature Code
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'resume'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FiAward className="w-4 h-4" />
              Resume XYZ Rewriter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ========================================================= */}
        {/* TAB 1: INTERACTIVE SIMULATORS                             */}
        {/* ========================================================= */}
        {activeTab === 'simulators' && (
          <div className="space-y-8">
            {/* Simulator 1: Adaptive MCQ & 3PL IRT */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Mathematical Engine</span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <FiActivity className="text-cyan-400" />
                    3-Parameter Logistic (3PL) Item Response Theory Simulator
                  </h2>
                  <p className="text-sm text-slate-400">
                    Live curve: <code className="text-cyan-300 font-mono">P(θ) = c + (1-c) / (1 + e^(-1.702·a·(θ-b)))</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-xs text-slate-400">Estimated Ability (θ)</div>
                    <div className="text-lg font-mono font-bold text-cyan-400">{theta > 0 ? `+${theta}` : theta}</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-xs text-slate-400">Fisher Info I(θ)</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{fisherInformation}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Sliders & Controls */}
                <div className="lg:col-span-4 space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Item & Candidate Parameters</h3>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Candidate Ability (θ)</span>
                      <span className="font-mono text-cyan-400">{theta}</span>
                    </div>
                    <input
                      type="range"
                      min="-3.0"
                      max="3.0"
                      step="0.1"
                      value={theta}
                      onChange={(e) => setTheta(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Discrimination (a)</span>
                      <span className="font-mono text-cyan-400">{paramA}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={paramA}
                      onChange={(e) => setParamA(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Difficulty (b)</span>
                      <span className="font-mono text-cyan-400">{paramB}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={paramB}
                      onChange={(e) => setParamB(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Simulated Latency (ms)</span>
                      <span className="font-mono text-yellow-400">{answerLatency}ms</span>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="6000"
                      step="100"
                      value={answerLatency}
                      onChange={(e) => setAnswerLatency(parseInt(e.target.value))}
                      className="w-full accent-yellow-500 cursor-pointer"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleSimulateAnswer(true)}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <FiCheck className="w-4 h-4" /> Correct (+θ)
                    </button>
                    <button
                      onClick={() => handleSimulateAnswer(false)}
                      className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
                    >
                      <FiAlertTriangle className="w-4 h-4" /> Incorrect (-θ)
                    </button>
                  </div>

                  {lastFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-xs border ${
                        lastFeedback.isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div>
                        Answer: <b>{lastFeedback.isCorrect ? 'Correct' : 'Incorrect'}</b> (Latency: {lastFeedback.time}ms)
                      </div>
                      <div>
                        Theta Recalibration: <b>{lastFeedback.delta}</b> (Speed Weight: {lastFeedback.speedWeight}x)
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Recharts Curve */}
                <div className="lg:col-span-8 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300">Item Characteristic Curve (ICC)</span>
                      <span className="text-xs text-cyan-400 font-mono">
                        P(Correct | Current θ): {(currentProb * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={irtChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="theta" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                            formatter={(val) => [`${val}%`, 'Probability']}
                            labelFormatter={(l) => `Ability (θ): ${l}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="probability"
                            stroke="#06b6d4"
                            strokeWidth={2.5}
                            dot={false}
                          />
                          <ReferenceDot x={theta} y={Number((currentProb * 100).toFixed(1))} r={6} fill="#ec4899" stroke="#fff" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div>Pink dot: Candidate Current Ability (θ={theta})</div>
                    <div>Questions Answered: <span className="font-mono text-white font-bold">{answeredCount}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulator 2: Concurrency & Code Sandbox */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Security & Execution</span>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                    <FiShield className="text-emerald-400" />
                    Java Concurrency & AST Sandbox Execution Runner
                  </h2>
                  <p className="text-sm text-slate-400">
                    Static AST security scanning + thread-safe container execution with memory and 4000ms timeout constraints.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {SANDBOX_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSandboxCode(preset.code);
                        setSandboxOutput(null);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {preset.name.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                {/* Code Editor Area */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-b-0 border-slate-800 text-xs text-slate-400">
                    <span className="font-mono">Solution.java</span>
                    <button
                      onClick={handleRunSandbox}
                      disabled={isRunningSandbox}
                      className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-white rounded font-bold text-xs transition disabled:opacity-50"
                    >
                      <FiPlay className="w-3.5 h-3.5" />
                      {isRunningSandbox ? 'Evaluating AST...' : 'Run in Sandbox'}
                    </button>
                  </div>
                  <textarea
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    rows={12}
                    className="w-full p-4 bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 rounded-b-xl focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Sandbox Output Console */}
                <div className="lg:col-span-5 flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-slate-300">
                      <FiTerminal /> Sandbox Output Telemetry
                    </span>
                    {sandboxOutput && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sandboxOutput.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {sandboxOutput.status}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 text-slate-300 min-h-[160px]">
                    {isRunningSandbox ? (
                      <div className="flex items-center gap-2 text-cyan-400 animate-pulse pt-4">
                        <FiRefreshCw className="animate-spin" /> Running static AST audit & isolated JVM process...
                      </div>
                    ) : sandboxOutput ? (
                      <div className="space-y-2">
                        <div className="text-slate-400">Exit Status: <span className="text-white font-bold">{sandboxOutput.message}</span></div>
                        <div className="text-slate-400">Execution Duration: <span className="text-cyan-400 font-bold">{sandboxOutput.timeMs}ms</span></div>
                        <pre className="p-3 bg-slate-900/90 rounded border border-slate-800/80 text-[11px] text-slate-300 whitespace-pre-wrap">
                          {sandboxOutput.logs}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic pt-6 text-center">
                        Click "Run in Sandbox" to trigger the static AST security filter and JVM runner.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulator 3: AI Technical Mock Interviewer & Railway Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Mock Interviewer */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Evaluation</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                  <FiCpu className="text-purple-400" />
                  AI Technical Mock Interviewer
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setInterviewTopic('distributed');
                        setCandidateAnswer(INTERVIEW_QUESTIONS.distributed.defaultAnswer);
                        setInterviewResult(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        interviewTopic === 'distributed' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Distributed Arena
                    </button>
                    <button
                      onClick={() => {
                        setInterviewTopic('irt');
                        setCandidateAnswer(INTERVIEW_QUESTIONS.irt.defaultAnswer);
                        setInterviewResult(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        interviewTopic === 'irt' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      IRT Statistics
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <div className="font-semibold text-purple-300 mb-1">Question:</div>
                    {INTERVIEW_QUESTIONS[interviewTopic].question}
                  </div>

                  <textarea
                    value={candidateAnswer}
                    onChange={(e) => setCandidateAnswer(e.target.value)}
                    rows={4}
                    placeholder="Enter candidate answer..."
                    className="w-full p-3 bg-slate-950 font-sans text-xs text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-purple-500"
                  />

                  <button
                    onClick={handleEvaluateInterview}
                    disabled={isEvaluatingInterview}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                  >
                    {isEvaluatingInterview ? 'Evaluating Rubrics...' : 'Evaluate Answer with AI'}
                  </button>

                  {interviewResult && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-200 space-y-1.5">
                      <div className="flex justify-between font-bold text-purple-300">
                        <span>Overall Score: {interviewResult.overallScore}/100</span>
                        <span>Accuracy: {interviewResult.accuracy}%</span>
                      </div>
                      <div className="text-[11px] text-slate-300">{interviewResult.feedback}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multimodal Railway Vision & Voice */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Multimodal Pipeline</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                  <FiRadio className="text-amber-400" />
                  Railway Vision AI & Regional Voice Triage
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Language:</span>
                    {['hi', 'ta', 'en'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                          selectedLanguage === lang ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5"><FiEye className="text-cyan-400" /> Track Vision AST:</span>
                      <span className="text-emerald-400 font-mono font-bold">CLEAR / 0 DEFECTS</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5"><FiMic className="text-amber-400" /> Audio Stream:</span>
                      <span className="text-amber-400 font-mono">Simulated Station Master Comms</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateVoice}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                  >
                    Simulate Live Voice Triage
                  </button>

                  {voiceSimStatus && voiceSimStatus !== 'processing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 space-y-1 font-mono"
                    >
                      <div>Channel: <span className="text-white font-bold">{voiceSimStatus.lang}</span></div>
                      <div>Urgency Priority: <span className="text-rose-400 font-bold">{voiceSimStatus.urgencyScore}/100</span></div>
                      <div>Extraction: <span className="text-amber-300">{voiceSimStatus.extractedIssue}</span></div>
                      <div>Queue: <span className="text-cyan-400">{voiceSimStatus.routingQueue}</span></div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: AUTOMATE FEATURE IMPLEMENTATION                     */}
        {/* ========================================================= */}
        {activeTab === 'automation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Snippet Selector Sidebar */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Production-Ready Components
              </div>
              {Object.entries(CODE_SNIPPETS).map(([key, item]) => {
                const isSelected = selectedSnippetKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSnippetKey(key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                        <FiFileText className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                        {item.filename}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Code Viewer */}
            <div className="lg:col-span-8 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {(() => {
                const current = CODE_SNIPPETS[selectedSnippetKey];
                return (
                  <>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                      <div>
                        <div className="text-sm font-mono font-bold text-white">{current.filename}</div>
                        <div className="text-xs font-mono text-slate-400">{current.path}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(current.code, current.filename)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          {copiedKey === current.filename ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                          {copiedKey === current.filename ? 'Copied!' : 'Copy Code'}
                        </button>
                        <button
                          onClick={() => handleDownloadFile(current.filename, current.code)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <FiDownload /> Download
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300">
                      {current.description}
                    </div>

                    <div className="flex-1 p-4 bg-slate-950 overflow-x-auto max-h-[550px]">
                      <pre className="font-mono text-xs text-cyan-300 leading-relaxed">
                        {current.code}
                      </pre>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RESUME XYZ REWRITER                                */}
        {/* ========================================================= */}
        {activeTab === 'resume' && (
          <div className="space-y-8">
            {/* Google XYZ Formula Header */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800/40 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiAward className="text-amber-400" />
                Google XYZ Formula Bullet Rewriter
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Google's executive formula for standout engineering resumes: <br />
                <span className="font-semibold text-cyan-400">
                  "Accomplished [X] as measured by [Y], by doing [Z]"
                </span>
              </p>
            </div>

            {/* Live Interactive Rewriter Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-md font-bold text-white mb-4">Interactive Bullet Builder</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                    [X] What you accomplished:
                  </label>
                  <textarea
                    value={resumeX}
                    onChange={(e) => setResumeX(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-950 font-sans text-xs text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                    [Y] Measured by (Metrics / %):
                  </label>
                  <textarea
                    value={resumeY}
                    onChange={(e) => setResumeY(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-950 font-sans text-xs text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                    [Z] By doing (Tech / Method):
                  </label>
                  <textarea
                    value={resumeZ}
                    onChange={(e) => setResumeZ(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-slate-950 font-sans text-xs text-slate-200 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Generated Result */}
              <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Generated Resume Bullet Point
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedBullet, 'custom_bullet')}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition"
                  >
                    {copiedKey === 'custom_bullet' ? <FiCheck /> : <FiCopy />}
                    {copiedKey === 'custom_bullet' ? 'Copied!' : 'Copy Bullet'}
                  </button>
                </div>
                <div className="text-sm font-sans text-white leading-relaxed">
                  • {generatedBullet}
                </div>
              </div>
            </div>

            {/* Pre-Generated Project Bullets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>AI-Adaptive Assessment Engine</span>
                  <span className="text-xs text-cyan-400 font-mono">Quiz Platform</span>
                </h4>
                <div className="space-y-3">
                  {[
                    "Engineered an AI-Adaptive Testing Engine utilizing 3-Parameter Logistic (3PL) Item Response Theory (IRT), reducing evaluation duration by 35% while maximizing Fisher Information diagnostic certainty.",
                    "Architected a real-time multiplayer arena with Spring Boot and STOMP WebSockets, broadcasting thread-safe atomic score updates to 500+ concurrent peers with sub-50ms latency.",
                    "Implemented an isolated code execution sandbox with static AST security filters, eliminating unauthorized process execution and enforcing 4s quotas."
                  ].map((b, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 relative group">
                      <p>• {b}</p>
                      <button
                        onClick={() => handleCopyText(b, `quiz_${i}`)}
                        className="mt-2 text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {copiedKey === `quiz_${i}` ? <FiCheck /> : <FiCopy />} {copiedKey === `quiz_${i}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>AI-Enhanced Career Guidance System</span>
                  <span className="text-xs text-emerald-400 font-mono">Microservices</span>
                </h4>
                <div className="space-y-3">
                  {[
                    "Architected an end-to-end Career Recommendation pipeline using Spring Boot, FastAPI, and HuggingFace NLP transformers, analyzing candidate skill gaps with 92% trajectory alignment.",
                    "Engineered PostgreSQL database schema migrations (V21 & V22) for companies, job postings, and applicant tracking with foreign key cascades and composite indexes.",
                    "Refactored legacy REST microservices to high-speed local AI service clients, reducing inference latency by 60% and deprecating unauthenticated external API calls."
                  ].map((b, i) => (
                    <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 relative group">
                      <p>• {b}</p>
                      <button
                        onClick={() => handleCopyText(b, `career_${i}`)}
                        className="mt-2 text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {copiedKey === `career_${i}` ? <FiCheck /> : <FiCopy />} {copiedKey === `career_${i}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
