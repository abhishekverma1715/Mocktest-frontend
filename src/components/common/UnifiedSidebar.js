/**
 * UnifiedSidebar - A single sidebar component for all roles
 * Replaces Sidebar.js, AdminSidebar.js, and TeacherSidebar.js
 */

import React, { useState, memo, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Sun, Moon, Menu, X, Crown } from 'lucide-react';
import { ROLE_CONFIG } from '../../config/navigation';

// Memoized NavItem to prevent unnecessary re-renders
const NavItem = memo(function NavItem({ path, icon: Icon, label, badge, exact, onClick, config, isPremium }) {
  const useBorderLeft = config.accentBorderLeft;
  
  return (
    <NavLink to={path} end={exact} onClick={onClick}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap: useBorderLeft ? 9 : 10,
        padding: useBorderLeft ? '8px 10px' : '9px 12px',
        borderRadius:'var(--r-md)',
        marginBottom: useBorderLeft ? 1 : 2,
        textDecoration:'none',
        color: isActive ? config.accentColor : 'var(--text-secondary)',
        background: isActive ? config.accentBg : 'transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: useBorderLeft ? '0.845rem' : '0.875rem',
        transition:'all var(--t-fast)',
        border: useBorderLeft ? 'none' : (isActive ? `1px solid ${config.accentBorder}` : '1px solid transparent'),
        borderLeft: useBorderLeft ? `2px solid ${isActive ? config.accentColor : 'transparent'}` : undefined,
      })}>
      {({ isActive }) => (
        <>
          <Icon size={useBorderLeft ? 15 : 17} style={{ flexShrink:0, opacity: isActive ? 1 : 0.65 }} />
          <span style={{ flex:1 }}>{label}</span>
          {badge && !isPremium && (
            <span style={{ fontSize:'0.58rem', fontWeight:800, background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#1a1a2e', padding:'2px 6px', borderRadius:4, letterSpacing:'0.05em' }}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
});

// Section header for admin/teacher navs
const SectionHeader = memo(function SectionHeader({ label }) {
  return (
    <div style={{ fontSize:'0.64rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 10px', marginBottom:4 }}>
      {label}
    </div>
  );
});

function SidebarContent({ onClose, role }) {
  const { user, logout, darkMode, setDarkMode, isPremium } = useAuth();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const { branding, nav, hasSections, userBadge, accentColor } = config;
  const BrandIcon = branding.icon;

  const handleLogout = useCallback(() => { logout(); navigate('/login'); }, [logout, navigate]);

  // Render navigation items (with or without sections)
  const renderNav = () => {
    if (hasSections) {
      return nav.map(section => (
        <div key={section.section} style={{ marginBottom:16 }}>
          <SectionHeader label={section.section} />
          {section.items.map(item => (
            <NavItem key={item.path} {...item} onClick={onClose} config={config} isPremium={isPremium} />
          ))}
        </div>
      ));
    }
    return nav.map(item => (
      <NavItem key={item.path} {...item} onClick={onClose} config={config} isPremium={isPremium} />
    ));
  };

  // User badge/status display
  const renderUserBadge = () => {
    if (userBadge) {
      return <span style={{ color: accentColor, fontWeight:600 }}>{userBadge}</span>;
    }
    // For user role, show premium status
    if (isPremium) {
      return <span style={{ color:'#fbbf24', fontWeight:600, display:'flex', alignItems:'center', gap:3 }}><Crown size={9} fill="#fbbf24" />Premium</span>;
    }
    return <span style={{ color:'var(--text-muted)' }}>Free Plan</span>;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-surface)', borderRight:'1px solid var(--border-base)' }}>
      {/* Brand */}
      <div style={{ padding:'18px 16px 16px', borderBottom:'1px solid var(--border-base)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background: branding.gradient, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: branding.shadow }}>
            <BrandIcon size={18} color={branding.iconColor} fill={branding.iconColor === 'white' ? 'white' : undefined} />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:'1rem', letterSpacing:'-0.025em', lineHeight:1.1 }}>{branding.title}</div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', letterSpacing:'0.1em', marginTop:2, textTransform:'uppercase' }}>{branding.subtitle}</div>
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-base)' }}>
        <div
          style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:'var(--r-md)', background:'var(--bg-elevated)', cursor: role === 'user' ? 'pointer' : 'default', transition:'background var(--t-fast)', border:'1px solid var(--border-subtle)' }}
          onClick={role === 'user' ? () => { navigate('/profile'); onClose?.(); } : undefined}
          onMouseEnter={role === 'user' ? e => e.currentTarget.style.background='var(--bg-card)' : undefined}
          onMouseLeave={role === 'user' ? e => e.currentTarget.style.background='var(--bg-elevated)' : undefined}>
          <div style={{ width:32, height:32, borderRadius:'50%', background: isPremium || role !== 'user' ? branding.gradient : 'linear-gradient(135deg,var(--accent),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.875rem', fontWeight:800, color: branding.iconColor === '#1a1a2e' || isPremium ? '#1a1a2e' : 'white', flexShrink:0 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:'0.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:'0.66rem', marginTop:1 }}>
              {renderUserBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding: hasSections ? '8px' : '10px 8px', overflowY:'auto' }}>
        {renderNav()}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding:'8px', borderTop:'1px solid var(--border-base)', display:'flex', flexDirection:'column', gap:2 }}>
        <button onClick={() => setDarkMode(!darkMode)} className="btn btn-ghost" style={{ justifyContent:'flex-start', gap:10, fontSize:'0.875rem', padding:'9px 12px', width:'100%' }}>
          {darkMode ? <Sun size={15} style={{ opacity:0.7 }} /> : <Moon size={15} style={{ opacity:0.7 }} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent:'flex-start', gap:10, fontSize:'0.875rem', padding:'9px 12px', color:'var(--danger)', width:'100%' }}>
          <LogOut size={15} style={{ opacity:0.8 }} />Logout
        </button>
      </div>
    </div>
  );
}

// Mobile bottom navigation (user role only)
function BottomNav({ items }) {
  const location = useLocation();
  
  return (
    <nav className="show-mobile" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:200, background:'var(--bg-surface)', borderTop:'1px solid var(--border-base)', padding:'6px 0 max(6px, env(safe-area-inset-bottom))', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
      <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
        {items.map(({ path, icon:Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink key={path} to={path} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 10px', textDecoration:'none', color: isActive?'var(--accent)':'var(--text-muted)', transition:'color var(--t-fast)', minWidth:50 }}>
              <Icon size={20} style={{ strokeWidth: isActive?2.5:1.75 }} />
              <span style={{ fontSize:'0.58rem', fontWeight: isActive?700:500, letterSpacing:'0.02em' }}>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function UnifiedSidebar({ role = 'user' }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { darkMode, setDarkMode } = useAuth();
  
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const { branding, bottomNav } = config;
  const BrandIcon = branding.icon;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hide-mobile" style={{ width:'var(--sidebar-w)', flexShrink:0, position:'sticky', top:0, height:'100vh', zIndex:30, overflow:'hidden' }}>
        <SidebarContent role={role} />
      </aside>

      {/* Mobile top bar */}
      <header className="show-mobile" style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:'var(--topbar-h)', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-base)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background: branding.gradient, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: branding.shadow }}>
            <BrandIcon size={15} color={branding.iconColor} fill={branding.iconColor === 'white' ? 'white' : undefined} />
          </div>
          <span style={{ fontWeight:800, fontSize:'0.95rem', letterSpacing:'-0.02em' }}>{branding.title}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileDrawerOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:300 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }} onClick={() => setMobileDrawerOpen(false)} />
          <aside style={{ position:'absolute', top:0, left:0, bottom:0, width:272, animation:'slideIn 0.25s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden' }}>
            <SidebarContent role={role} onClose={() => setMobileDrawerOpen(false)} />
          </aside>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileDrawerOpen(false)} style={{ position:'absolute', top:12, right:12, background:'var(--bg-elevated)', color:'var(--text-primary)' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Mobile bottom navigation (user role only) */}
      {bottomNav && <BottomNav items={bottomNav} />}

      {/* Bottom padding on mobile so content doesn't hide behind bottom nav */}
      {bottomNav && (
        <style>{`
          @media (max-width: 768px) {
            .app-content { padding-bottom: 64px; }
          }
        `}</style>
      )}
    </>
  );
}
