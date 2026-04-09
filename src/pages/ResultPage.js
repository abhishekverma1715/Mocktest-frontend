import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Trophy,
  ChevronDown, ChevronUp, BookmarkPlus, ArrowLeft
} from 'lucide-react';
import LoadingScreen from '../components/common/LoadingScreen';
import toast from 'react-hot-toast';

const TooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-base)',
  borderRadius: '10px',
  fontFamily: 'var(--font)',
  fontSize: 12,
};

export default function ResultPage() {
  const { resultId } = useParams();
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    API.get(`/results/${resultId}`)
      .then(({ data }) => { setResult(data.result); })
      .catch((err) => {
        console.error('Failed to load result:', err);
        toast.error('Failed to load result');
      })
      .finally(() => setLoading(false));
  }, [resultId]);

  const handleBookmark = async (qId) => {
    try {
      await API.post(`/users/bookmark/${qId}`);
      toast.success('Bookmark updated!');
    } catch (err) {
      console.error('Bookmark error:', err);
      toast.error('Failed to bookmark');
    }
  };

  if (loading) return <LoadingScreen message="Loading result..." />;
  if (!result) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <p>Result not found</p>
      <Link to="/history" className="btn btn-primary" style={{ marginTop:16 }}>Back to History</Link>
    </div>
  );

  const { score, totalMarks, percentage, correctAnswers, incorrectAnswers,
          skippedAnswers, timeTaken, rank, answers = [], test } = result;

  const pieData = [
    { name:'Correct',   value:correctAnswers,  color:'#10b981' },
    { name:'Incorrect', value:incorrectAnswers, color:'#f43f5e' },
    { name:'Skipped',   value:skippedAnswers,   color:'#475569' },
  ];

  const subjectStats = answers.reduce((acc, a) => {
    const sub = a.question?.subject || 'General';
    if (!acc[sub]) acc[sub] = { subject:sub, correct:0, incorrect:0, total:0 };
    acc[sub].total++;
    if (a.isCorrect) acc[sub].correct++;
    else if (a.selectedAnswer) acc[sub].incorrect++;
    return acc;
  }, {});
  const subjectData = Object.values(subjectStats);

  const pct        = Math.round(percentage);
  const grade      = pct>=90?'A+':pct>=80?'A':pct>=70?'B':pct>=60?'C':pct>=50?'D':'F';
  const gradeColor = pct>=70?'var(--success)':pct>=50?'var(--warning)':'var(--danger)';
  const gradeBg    = pct>=70?'var(--success-muted)':pct>=50?'var(--warning-muted)':'var(--danger-muted)';
  const formatTime = s => `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <Layout title="Test Result" subtitle={test?.title}>
      {/* Back button */}
      <Link to="/history" className="btn btn-ghost btn-sm" style={{ marginBottom:20, gap:6 }}>
        <ArrowLeft size={14} /> Back to History
      </Link>

      {/* Score Header */}
      <div className="card" style={{ marginBottom:20, padding:'24px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          {/* Circle score */}
          <div style={{ width:120, height:120, borderRadius:'50%', background:`conic-gradient(${gradeColor} ${pct*3.6}deg, var(--bg-elevated) 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', boxShadow:`0 0 28px ${gradeColor}30`, flexShrink:0 }}>
            <div style={{ width:94, height:94, borderRadius:'50%', background:'var(--bg-card)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:'1.75rem', fontWeight:900, color:gradeColor, lineHeight:1 }}>{pct}%</span>
              <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Score</span>
            </div>
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:'2.2rem', fontWeight:900, color:gradeColor }}>{score}/{totalMarks}</span>
              <span style={{ background:gradeBg, color:gradeColor, padding:'4px 14px', borderRadius:'var(--r-full)', fontWeight:800, fontSize:'1.1rem', border:`1.5px solid ${gradeColor}40` }}>Grade {grade}</span>
              {rank && <span className="badge badge-gold"><Trophy size={11} />Rank #{rank}</span>}
            </div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><CheckCircle2 size={15} color="var(--success)" /><span style={{ fontSize:'0.88rem' }}>{correctAnswers} Correct</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><XCircle size={15} color="var(--danger)" /><span style={{ fontSize:'0.88rem' }}>{incorrectAnswers} Wrong</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><MinusCircle size={15} color="var(--text-muted)" /><span style={{ fontSize:'0.88rem' }}>{skippedAnswers} Skipped</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><Clock size={15} color="var(--info)" /><span style={{ fontSize:'0.88rem' }}>{formatTime(timeTaken)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts — responsive: stacks on mobile */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20, marginBottom:24 }}>
        <div className="card">
          <h4 style={{ marginBottom:16 }}>Answer Distribution</h4>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', justifyContent:'center', gap:16 }}>
            {pieData.map(p => (
              <div key={p.name} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:p.color, flexShrink:0 }} />
                {p.name}: {p.value}
              </div>
            ))}
          </div>
        </div>

        {subjectData.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom:16 }}>Subject-wise Performance</h4>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={subjectData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize:10, fill:'var(--text-muted)', fontFamily:'var(--font)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TooltipStyle} />
                <Bar dataKey="correct"   fill="var(--success)" radius={[4,4,0,0]} name="Correct" />
                <Bar dataKey="incorrect" fill="var(--danger)"  radius={[4,4,0,0]} name="Wrong" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Question Review */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border-base)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <h4>Detailed Review ({answers.length} questions)</h4>
          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Click to expand</span>
        </div>
        {answers.map((a, i) => {
          const q = a.question;
          if (!q) return null;
          const isExpanded = expanded[i];
          const statusColor = a.isCorrect ? 'var(--success)' : a.selectedAnswer ? 'var(--danger)' : 'var(--text-muted)';
          const Icon = a.isCorrect ? CheckCircle2 : a.selectedAnswer ? XCircle : MinusCircle;
          return (
            <div key={i} style={{ borderBottom:'1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                style={{ width:'100%', padding:'14px 24px', display:'flex', alignItems:'center', gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left', color:'var(--text-primary)', fontFamily:'var(--font)' }}>
                <Icon size={17} color={statusColor} style={{ flexShrink:0 }} />
                <span style={{ flex:1, fontSize:'0.875rem', lineHeight:1.55 }}>
                  <strong style={{ color:'var(--text-muted)', marginRight:6 }}>Q{i+1}.</strong>{q.text}
                </span>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><Clock size={10} />{a.timeSpent}s</span>
                  {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                </div>
              </button>

              {isExpanded && (
                <div style={{ padding:'0 24px 20px 54px', animation:'fadeIn 0.2s ease' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                    {['A','B','C','D'].map(opt => {
                      const isCorrect  = opt === q.correctAnswer;
                      const isSelected = opt === a.selectedAnswer;
                      return (
                        <div key={opt} style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:'var(--r-md)', background: isCorrect ? 'var(--success-muted)' : isSelected && !isCorrect ? 'var(--danger-muted)' : 'var(--bg-elevated)', border:`1.5px solid ${isCorrect?'var(--success)':isSelected&&!isCorrect?'var(--danger)':'transparent'}`, fontSize:'0.875rem' }}>
                          <span style={{ fontWeight:800, color: isCorrect?'var(--success)':isSelected&&!isCorrect?'var(--danger)':'var(--text-muted)', flexShrink:0 }}>{opt}.</span>
                          <span style={{ flex:1 }}>{q.options?.[opt]}</span>
                          {isCorrect  && <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink:0 }} />}
                          {isSelected && !isCorrect && <XCircle size={15} color="var(--danger)" style={{ flexShrink:0 }} />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ background:'var(--accent-muted)', border:'1px solid var(--accent-border)', borderRadius:'var(--r-md)', padding:'10px 14px', fontSize:'0.84rem', marginBottom:10 }}>
                      <strong style={{ color:'var(--accent)' }}>Explanation: </strong>
                      <span style={{ color:'var(--text-secondary)' }}>{q.explanation}</span>
                    </div>
                  )}
                  <button onClick={() => handleBookmark(q._id)} className="btn btn-ghost btn-xs" style={{ gap:5 }}>
                    <BookmarkPlus size={13} /> Bookmark
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
