import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { Trophy, Medal, Star, Clock } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/leaderboard/global/top').then(({ data }) => {
      setLeaderboard(data.leaderboard || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const rankColors = ['#f6d365', '#c0c0c0', '#cd7f32'];
  const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy size={20} color="#f6d365" />;
    if (rank === 2) return <Medal size={20} color="#c0c0c0" />;
    if (rank === 3) return <Medal size={20} color="#cd7f32" />;
    return <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{rank}</span>;
  };

  return (
    <Layout title="Leaderboard" subtitle="Top performers across all mock tests">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : leaderboard.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Trophy size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No data yet</h3>
          <p>Be the first to complete a test!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px 100px', gap: 16, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Rank</span><span>User</span><span style={{ textAlign: 'right' }}>Avg Score</span><span style={{ textAlign: 'right' }}>Attempts</span><span style={{ textAlign: 'right' }}>Total Pts</span>
          </div>
          {leaderboard.map((entry, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            return (
              <div key={entry._id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px 100px', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', background: isTop3 ? `rgba(${rank === 1 ? '246,211,101' : rank === 2 ? '192,192,192' : '205,127,50'},0.04)` : 'transparent', transition: 'var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = isTop3 ? `rgba(${rank === 1 ? '246,211,101' : rank === 2 ? '192,192,192' : '205,127,50'},0.04)` : 'transparent'}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <RankIcon rank={rank} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${isTop3 ? rankColors[rank - 1] : 'var(--accent)'}, var(--accent-secondary))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
                    {entry.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.user?.name}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{Math.round(entry.avgScore)}%</div>
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{entry.totalAttempts}</div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <Star size={12} fill="currentColor" />{Math.round(entry.totalScore)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
