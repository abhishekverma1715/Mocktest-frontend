import React from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="loading-screen" role="status" aria-label={message}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid var(--border-base)', borderTopColor:'var(--accent)', animation:'spin 0.75s linear infinite' }} />
        <div style={{ position:'absolute', inset:9, borderRadius:'50%', border:'2px solid var(--border-subtle)', borderTopColor:'#38bdf8', animation:'spin 1.1s linear infinite reverse' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:10, height:10, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 8px rgba(99,102,241,0.6)' }} />
      </div>
      <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', letterSpacing:'0.03em' }}>{message}</p>
    </div>
  );
}
