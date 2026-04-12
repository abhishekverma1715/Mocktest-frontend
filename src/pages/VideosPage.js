import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, Lock, Eye, Clock, Crown, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'SSC', 'Railway', 'Banking', 'UPSC', 'Defence', 'State PSC', 'Teaching', 'Other'];
const CAT_COLORS = { SSC: '#6c63ff', Railway: '#43e97b', Banking: '#38f9d7', UPSC: '#f6d365', Defence: '#f7971e', 'State PSC': '#ff6584', Teaching: '#a78bfa', Other: '#9898b8' };

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function VideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [total, setTotal] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const isPremium = user?.membership?.status === 'premium' && new Date(user?.membership?.endDate) > new Date();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 20 });
      if (search) params.append('search', search);
      if (category !== 'All') params.append('category', category);
      const { data } = await API.get(`/videos?${params}`);
      setVideos(data.videos || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load videos'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, category]);

  const handlePlay = async (video) => {
    if (video.isPremium && !isPremium && user?.role !== 'admin') {
      toast.error('This video requires a Premium membership!');
      navigate('/membership');
      return;
    }
    try {
      const { data } = await API.get(`/videos/${video._id}`);
      setSelectedVideo(data.video);
    } catch (err) {
      if (err.response?.data?.requiresPremium) {
        navigate('/membership');
      } else {
        toast.error('Failed to load video');
      }
    }
  };

  return (
    <Layout title="Video Library" subtitle={`${total} lectures across all subjects`}>
      {/* Premium Banner */}
      {!isPremium && user?.role !== 'admin' && (
        <div style={{ background: 'linear-gradient(135deg, #f6d365, #fda085)', borderRadius: 'var(--r-lg)', padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#1a1a2e' }}>
            <Crown size={24} />
            <div>
              <div style={{ fontWeight: 700 }}>Unlock Premium Videos</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Get full access to all lectures with a premium plan</div>
            </div>
          </div>
          <button onClick={() => navigate('/membership')} style={{ background: '#1a1a2e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 'var(--r-md)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Upgrade Now →
          </button>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)' }} onClick={() => setSelectedVideo(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 900, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                <iframe
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{selectedVideo.title}</h3>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>{selectedVideo.description}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <span className="badge badge-primary">{selectedVideo.category}</span>
                    {selectedVideo.subject && <span className="badge badge-info">{selectedVideo.subject}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Eye size={12} />{selectedVideo.views} views
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedVideo(null)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}>
                  Close ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ padding: '6px 16px', borderRadius: 'var(--r-full)', border: '1.5px solid', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, fontSize: '0.85rem', flexShrink: 0, transition: 'var(--transition)', background: category === c ? 'var(--accent)' : 'transparent', color: category === c ? 'white' : 'var(--text-secondary)', borderColor: category === c ? 'var(--accent)' : 'var(--border-base)' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ height: 220 }}>
              <div style={{ animation: 'pulse 1.5s infinite', background: 'var(--bg-elevated)', borderRadius: 8, height: '100%' }} />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Play size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No videos found</h3>
          <p>Try a different category or search term</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {videos.map(video => {
            const locked = video.isPremium && !isPremium && user?.role !== 'admin';
            return (
              <div key={video._id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => handlePlay(video)}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: 'var(--bg-elevated)' }}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${CAT_COLORS[video.category] || '#6c63ff'}15` }}>
                      <Play size={40} color={CAT_COLORS[video.category] || '#6c63ff'} />
                    </div>
                  )}
                  {/* Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: locked ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}>
                    {locked ? (
                      <div style={{ textAlign: 'center', color: 'white' }}>
                        <Lock size={28} />
                        <div style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 600 }}>Premium</div>
                      </div>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="#1a1a2e" fill="#1a1a2e" />
                      </div>
                    )}
                  </div>
                  {/* Duration */}
                  {video.duration > 0 && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {formatDuration(video.duration)}
                    </div>
                  )}
                  {/* Premium badge */}
                  {video.isPremium && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#f6d365', color: '#1a1a2e', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Crown size={10} /> PREMIUM
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span className="badge" style={{ background: `${CAT_COLORS[video.category] || '#6c63ff'}15`, color: CAT_COLORS[video.category] || '#6c63ff', fontSize: '0.7rem' }}>{video.category}</span>
                    {video.subject && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{video.subject}</span>}
                  </div>
                  <h4 style={{ fontSize: '0.92rem', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} />{video.views}</span>
                    {video.duration > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{formatDuration(video.duration)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}