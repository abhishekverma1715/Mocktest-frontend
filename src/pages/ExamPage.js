import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import {
  Clock, Flag, ChevronLeft, ChevronRight, Send,
  Menu, X, BookmarkPlus, AlertTriangle, CheckCircle2
} from 'lucide-react';
import LoadingScreen from '../components/common/LoadingScreen';
import { useExamTimer, formatTime } from '../hooks/useExamTimer';
import { QUESTION_STATUS } from '../utils/constants';

const STATUS = QUESTION_STATUS;

export default function ExamPage() {
  const { testId }  = useParams();
  const navigate    = useNavigate();
  const [test, setTest]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [started, setStarted]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showNav, setShowNav]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [initialDuration, setInitialDuration] = useState(60 * 60);
  const startTimeRef      = useRef(null);
  const questionTimeRef   = useRef(Date.now());

  useEffect(() => {
    API.get(`/tests/${testId}`)
      .then(({ data }) => {
        if (!data.test) { setError('Test not found'); return; }
        const qs = data.test.questions || [];
        if (!qs.length) { setError('This test has no questions yet.'); return; }
        setTest(data.test);
        setQuestions(qs);
        setInitialDuration((data.test.duration || 60) * 60);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load test'))
      .finally(() => setLoading(false));
  }, [testId]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    timer.stopTimer();
    const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
    const answersArray = questions.map(q => {
      const qId = q._id || q.id;
      const a = answers[qId] || {};
      return { questionId:qId, selectedAnswer:a.selectedAnswer||null, isMarkedForReview:a.isMarkedForReview||false, timeSpent:a.timeSpent||0 };
    });
    try {
      const { data } = await API.post('/results/submit', {
        testId, answers:answersArray, timeTaken,
        startTime: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : new Date().toISOString(),
        status: auto ? 'auto-submitted' : 'completed',
      });
      if (auto) toast.success('⏱ Time up! Auto-submitted.');
      navigate(`/result/${data.result._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
      setSubmitting(false);
    }
  }, [submitting, questions, answers, testId, navigate]);

  // Use custom timer hook for optimized re-renders
  const timer = useExamTimer(initialDuration, () => handleSubmit(true));
  const timeLeft = timer.displayTime;
  const isTimeLow = timer.isLow;

  // Memoize answer statistics to avoid recalculating on every render
  const answerStats = useMemo(() => {
    const answerValues = Object.values(answers);
    const answered = answerValues.filter(a => a?.selectedAnswer).length;
    const reviewed = answerValues.filter(a => a?.isMarkedForReview).length;
    const unattempted = questions.length - answered;
    return { answered, reviewed, unattempted };
  }, [answers, questions.length]);

  const { answered, reviewed, unattempted } = answerStats;

  const startExam = useCallback(() => {
    startTimeRef.current = Date.now();
    questionTimeRef.current = Date.now();
    setStarted(true);
    timer.startTimer();
  }, [timer]);

  const recordTime = useCallback((qId) => {
    const spent = Math.floor((Date.now() - questionTimeRef.current) / 1000);
    if (qId && spent > 0)
      setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], timeSpent:(prev[qId]?.timeSpent||0)+spent } }));
    questionTimeRef.current = Date.now();
  }, []);

  const selectAnswer  = (qId, opt) => setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], selectedAnswer:opt } }));
  const toggleReview  = (qId) => setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], isMarkedForReview:!prev[qId]?.isMarkedForReview } }));
  const clearAnswer   = (qId) => setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], selectedAnswer:null } }));

  const goTo = useCallback((idx) => {
    const qId = questions[current]?._id || questions[current]?.id;
    recordTime(qId);
    setCurrent(idx);
    setShowNav(false);
  }, [questions, current, recordTime]);

  const getStatus = useCallback((qId) => {
    const a = answers[qId];
    if (!a?.selectedAnswer && !a?.isMarkedForReview) return 'unattempted';
    if (a?.isMarkedForReview && !a?.selectedAnswer)  return 'review';
    if (a?.isMarkedForReview && a?.selectedAnswer)   return 'answered-review';
    return 'answered';
  }, [answers]);

  if (loading) return <LoadingScreen message="Loading test..." />;

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg-base)' }}>
      <div className="card" style={{ maxWidth:440, width:'100%', textAlign:'center', padding:40 }}>
        <AlertTriangle size={44} style={{ color:'var(--warning)', marginBottom:16 }} />
        <h3 style={{ marginBottom:8 }}>Cannot Load Test</h3>
        <p style={{ marginBottom:24 }}>{error}</p>
        <button onClick={() => navigate('/tests')} className="btn btn-primary">← Back to Tests</button>
      </div>
    </div>
  );

  /* ── Instructions ─────────────────────────────────────────────────── */
  if (!started) return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ maxWidth:620, width:'100%', animation:'fadeIn 0.4s ease' }}>
        <div className="card" style={{ padding:32 }}>
          <h2 style={{ marginBottom:6 }}>{test?.title}</h2>
          {test?.description && <p style={{ marginBottom:20 }}>{test.description}</p>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:10, marginBottom:24 }}>
            {[
              ['📋 Questions', questions.length],
              ['⏱ Duration', `${test?.duration} min`],
              ['🏆 Total Marks', test?.totalMarks],
              ['➖ Neg. Marking', test?.negativeMarking ? `-${test?.negativeMarks} per wrong` : 'None'],
              ['📊 Marks/Q', test?.marksPerQuestion],
              ['🎯 Category', test?.category],
            ].map(([k,v]) => (
              <div key={k} style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-md)', padding:'11px 14px', border:'1px solid var(--border-base)' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:3 }}>{k}</div>
                <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {test?.instructions?.length > 0 && (
            <div style={{ background:'var(--accent-muted)', border:'1px solid var(--accent-border)', borderRadius:'var(--r-md)', padding:'14px 16px', marginBottom:20 }}>
              <div style={{ fontWeight:700, marginBottom:10, fontSize:'0.875rem', color:'var(--accent)' }}>📋 Instructions</div>
              {test.instructions.map((inst, i) => (
                <div key={i} style={{ fontSize:'0.84rem', color:'var(--text-secondary)', marginBottom:6, paddingLeft:14, borderLeft:'2px solid var(--accent)' }}>{inst}</div>
              ))}
            </div>
          )}
          <div className="alert alert-warning" style={{ marginBottom:20 }}>
            ⚠️ <strong>Important:</strong> Do not refresh or close the browser during the exam. The test auto-submits when the timer ends.
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={() => navigate('/tests')} className="btn btn-secondary">← Back</button>
            <button onClick={startExam} className="btn btn-primary btn-full">Start Exam →</button>
          </div>
        </div>
      </div>
    </div>
  );

  const q   = questions[current];
  const qId = q?._id || q?.id;

  /* ── Question Nav Panel content ───────────────────────────────────── */
  const NavPanel = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-surface)', borderLeft:'1px solid var(--border-base)', overflowY:'auto' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-base)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:4 }}>
          {[
            { label:'Answered', count:answered,    color:'var(--success)' },
            { label:'Skipped',  count:unattempted, color:'var(--text-muted)' },
            { label:'Marked',   count:reviewed,    color:'var(--warning)' },
            { label:'Total',    count:questions.length, color:'var(--accent)' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ background:'var(--bg-elevated)', borderRadius:'var(--r-sm)', padding:'7px 10px', textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:'1.05rem', color }}>{count}</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px 14px', flex:1 }}>
        <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Questions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:5, marginBottom:14 }}>
          {questions.map((qs, idx) => {
            const id     = qs._id || qs.id;
            const st     = getStatus(id);
            const styl   = STATUS[st];
            const isCurr = idx === current;
            return (
              <button key={id||idx} onClick={() => goTo(idx)}
                style={{ aspectRatio:'1', borderRadius:'var(--r-sm)', border:`2px solid ${isCurr?'white':styl.border}`, background:styl.bg, color:styl.color, fontWeight:700, fontSize:'0.72rem', cursor:'pointer', transition:'all var(--t-fast)', outline:'none', boxShadow:isCurr?'0 0 0 3px rgba(255,255,255,0.25)':undefined, transform:isCurr?'scale(1.08)':undefined }}>
                {idx+1}
              </button>
            );
          })}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:16 }}>
          {[
            { color:'var(--success)', label:'Answered' },
            { color:'var(--warning)', label:'Marked for Review' },
            { color:'var(--accent)',  label:'Answered + Marked' },
            { color:'var(--bg-elevated)', label:'Not Answered', border:'1px solid var(--border-base)' },
          ].map(({ color, label, border }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:'0.72rem', color:'var(--text-muted)' }}>
              <div style={{ width:12, height:12, borderRadius:3, background:color, flexShrink:0, border }} />
              {label}
            </div>
          ))}
        </div>
        <button onClick={() => { setShowNav(false); setShowConfirm(true); }} className="btn btn-primary btn-full" disabled={submitting} style={{ gap:6 }}>
          <Send size={14} /> Submit Test
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border-base)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNav(!showNav)} aria-label="Toggle navigation">
            <Menu size={18} />
          </button>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{test?.title}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Q {current+1} of {questions.length}</div>
          </div>
        </div>

        {/* Timer */}
        <div style={{ display:'flex', alignItems:'center', gap:7, background: isTimeLow ? 'var(--danger-muted)' : 'var(--success-muted)', padding:'6px 14px', borderRadius:'var(--r-full)', border:`1.5px solid ${isTimeLow?'var(--danger)':'var(--success)'}`, animation: isTimeLow && timeLeft<=30 ? 'timerPulse 1s infinite' : 'none', flexShrink:0 }}>
          <Clock size={14} color={isTimeLow?'var(--danger)':'var(--success)'} />
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'0.95rem', color: isTimeLow?'var(--danger)':'var(--success)' }}>{formatTime(timeLeft)}</span>
        </div>

        <button onClick={() => setShowConfirm(true)} className="btn btn-primary btn-sm" disabled={submitting} style={{ flexShrink:0, gap:5 }}>
          <Send size={13} /> Submit
        </button>
      </div>

      {/* Body */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        {/* Question area */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 16px' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            {/* Badges */}
            <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
              <span className="badge badge-primary">Q{current+1}</span>
              {q?.subject    && <span className="badge badge-info">{q.subject}</span>}
              {q?.difficulty && (
                <span className="badge" style={{ background: q.difficulty==='Easy'?'var(--success-muted)':q.difficulty==='Hard'?'var(--danger-muted)':'var(--warning-muted)', color: q.difficulty==='Easy'?'var(--success)':q.difficulty==='Hard'?'var(--danger)':'var(--warning)' }}>
                  {q.difficulty}
                </span>
              )}
              {answers[qId]?.isMarkedForReview && <span className="badge badge-warning"><Flag size={9} />Marked</span>}
            </div>

            {/* Question text */}
            <div style={{ background:'var(--bg-card)', borderRadius:'var(--r-lg)', padding:'18px 20px', marginBottom:16, border:'1px solid var(--border-base)', fontSize:'1rem', lineHeight:1.75, fontWeight:500 }}>
              {q?.text}
            </div>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {q && ['A','B','C','D'].map(opt => {
                const selected = answers[qId]?.selectedAnswer === opt;
                return (
                  <button key={opt} onClick={() => selectAnswer(qId, opt)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:'var(--r-lg)', border:`2px solid ${selected?'var(--accent)':'var(--border-base)'}`, background: selected?'var(--accent-muted)':'var(--bg-card)', cursor:'pointer', textAlign:'left', fontFamily:'var(--font)', color:'var(--text-primary)', width:'100%', transition:'all var(--t-base)', boxShadow: selected?'0 0 0 3px var(--accent-muted)':undefined }}>
                    <div style={{ width:32, height:32, borderRadius:'var(--r-sm)', background: selected?'var(--accent)':'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.84rem', flexShrink:0, color: selected?'white':'var(--text-secondary)', transition:'all var(--t-base)' }}>{opt}</div>
                    <span style={{ lineHeight:1.55, fontSize:'0.9rem', flex:1 }}>{q.options?.[opt]}</span>
                    {selected && <CheckCircle2 size={16} color="var(--accent)" style={{ flexShrink:0 }} />}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              <button onClick={() => toggleReview(qId)} className="btn btn-secondary btn-sm" style={{ gap:5, color: answers[qId]?.isMarkedForReview?'var(--warning)':undefined, borderColor: answers[qId]?.isMarkedForReview?'var(--warning)':undefined }}>
                <Flag size={12} />{answers[qId]?.isMarkedForReview ? 'Unmark Review' : 'Mark for Review'}
              </button>
              <button onClick={() => clearAnswer(qId)} className="btn btn-ghost btn-sm" disabled={!answers[qId]?.selectedAnswer}>
                Clear Response
              </button>
            </div>

            {/* Prev / Next */}
            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              <button onClick={() => goTo(current-1)} disabled={current===0} className="btn btn-secondary" style={{ gap:5 }}>
                <ChevronLeft size={15} /> Previous
              </button>
              <button onClick={() => goTo(current+1)} disabled={current===questions.length-1} className="btn btn-primary" style={{ gap:5 }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop side nav */}
        {showNav && (
          <aside className="hide-mobile" style={{ width:260, flexShrink:0, overflow:'hidden' }}>
            <NavPanel />
          </aside>
        )}
      </div>

      {/* Mobile nav drawer */}
      {showNav && (
        <div className="show-mobile" style={{ position:'fixed', inset:0, zIndex:300, flexDirection:'column' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }} onClick={() => setShowNav(false)} />
          <aside style={{ position:'absolute', top:0, right:0, bottom:0, width:'min(300px, 90vw)', animation:'slideIn 0.25s ease', boxShadow:'var(--shadow-xl)' }}>
            <NavPanel />
          </aside>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNav(false)} style={{ position:'absolute', top:12, left:12, background:'var(--bg-elevated)' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.80)', backdropFilter:'blur(4px)' }} onClick={() => setShowConfirm(false)} />
          <div className="card" style={{ position:'relative', maxWidth:420, width:'100%', padding:28, animation:'scaleIn 0.2s ease' }}>
            <h3 style={{ marginBottom:10 }}>Submit Test?</h3>
            <p style={{ marginBottom:16 }}>
              You have answered <strong style={{ color:'var(--success)' }}>{answered}</strong> of <strong>{questions.length}</strong> questions.
              {unattempted > 0 && <span style={{ color:'var(--danger)' }}> {unattempted} unattempted.</span>}
            </p>
            {test?.negativeMarking && (
              <div className="alert alert-danger" style={{ marginBottom:16 }}>
                ⚠ Negative marking active (-{test.negativeMarks} per wrong answer)
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary" style={{ flex:1 }} disabled={submitting}>Cancel</button>
              <button onClick={() => { setShowConfirm(false); handleSubmit(false); }} className="btn btn-primary" style={{ flex:1 }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
