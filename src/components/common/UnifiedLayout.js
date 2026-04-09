/**
 * UnifiedLayout - A single layout component for all roles
 * Replaces Layout.js, AdminLayout.js, and TeacherLayout.js
 */

import React from 'react';
import UnifiedSidebar from './UnifiedSidebar';

export default function UnifiedLayout({ children, title, subtitle, actions, role = 'user' }) {
  return (
    <div className="app-layout">
      <UnifiedSidebar role={role} />
      <main className="app-content">
        <div className="mobile-offset" />
        <div className="page-wrapper animate-fade">
          {(title || subtitle || actions) && (
            <div className="page-header" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div>
                {title    && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-subtitle" style={{ marginTop:4 }}>{subtitle}</p>}
              </div>
              {actions && <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

// Convenience exports for backward compatibility
export function Layout(props) {
  return <UnifiedLayout {...props} role="user" />;
}

export function AdminLayout(props) {
  return <UnifiedLayout {...props} role="admin" />;
}

export function TeacherLayout(props) {
  return <UnifiedLayout {...props} role="teacher" />;
}
