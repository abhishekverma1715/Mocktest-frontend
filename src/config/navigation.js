/**
 * Unified sidebar configuration for all roles
 * Each role has its own nav items, accent color, and branding
 */

import {
  LayoutDashboard, BookOpen, Clock, Trophy, Bookmark,
  User, Play, Crown, MessageSquare, FolderOpen, Zap,
  BarChart2, Home, HelpCircle, FileText, Users, Shield,
  CreditCard, Flag, Tag, GraduationCap, UserCircle
} from 'lucide-react';

// User (student) navigation
const USER_NAV = [
  { path:'/dashboard',      icon:LayoutDashboard, label:'Dashboard' },
  { path:'/tests',          icon:BookOpen,        label:'Mock Tests' },
  { path:'/videos',         icon:Play,            label:'Video Library' },
  { path:'/study-material', icon:FolderOpen,      label:'Study Material' },
  { path:'/history',        icon:Clock,           label:'My History' },
  { path:'/leaderboard',    icon:Trophy,          label:'Leaderboard' },
  { path:'/feedback',       icon:MessageSquare,   label:'Feedback' },
  { path:'/bookmarks',      icon:Bookmark,        label:'Bookmarks' },
  { path:'/membership',     icon:Crown,           label:'Membership', badge:'PRO' },
  { path:'/profile',        icon:User,            label:'Profile' },
];

const USER_BOTTOM_NAV = [
  { path:'/dashboard', icon:Home,         label:'Home' },
  { path:'/tests',     icon:BookOpen,     label:'Tests' },
  { path:'/history',   icon:BarChart2,    label:'Results' },
  { path:'/leaderboard',icon:Trophy,      label:'Rank' },
  { path:'/profile',   icon:User,         label:'Profile' },
];

// Teacher navigation
const TEACHER_NAV = [
  { section:'Overview', items:[
    { path:'/teacher',           icon:LayoutDashboard, label:'Dashboard', exact:true },
  ]},
  { section:'Content', items:[
    { path:'/teacher/questions', icon:HelpCircle,      label:'Questions' },
    { path:'/teacher/tests',     icon:FileText,        label:'Tests' },
    { path:'/teacher/videos',    icon:Play,            label:'Videos' },
  ]},
];

// Admin navigation (sectioned)
const ADMIN_NAV = [
  { section:'Overview', items:[
    { path:'/admin', icon:LayoutDashboard, label:'Dashboard', exact:true },
  ]},
  { section:'Content', items:[
    { path:'/admin/questions', icon:HelpCircle,  label:'Questions' },
    { path:'/admin/tests',     icon:FileText,    label:'Tests' },
    { path:'/admin/videos',    icon:Play,        label:'Videos' },
    { path:'/admin/material',  icon:FolderOpen,  label:'Study Material' },
    { path:'/admin/categories',icon:Tag,         label:'Categories' },
  ]},
  { section:'People', items:[
    { path:'/admin/teachers', icon:GraduationCap, label:'Teachers' },
    { path:'/admin/users',    icon:Users,         label:'Students' },
  ]},
  { section:'Reports', items:[
    { path:'/admin/results',  icon:BarChart2,     label:'Results' },
    { path:'/admin/feedback', icon:MessageSquare, label:'Feedback' },
    { path:'/admin/reports',  icon:Flag,          label:'Reports' },
    { path:'/admin/payments', icon:CreditCard,    label:'Payments' },
  ]},
  { section:'Account', items:[
    { path:'/admin/profile', icon:UserCircle, label:'My Profile' },
  ]},
];

// Role configurations
const ROLE_CONFIG = {
  user: {
    nav: USER_NAV,
    bottomNav: USER_BOTTOM_NAV,
    hasSections: false,
    branding: {
      title: 'Janta Exam',
      subtitle: 'Exam Prep',
      icon: Zap,
      gradient: 'linear-gradient(135deg,var(--accent),#38bdf8)',
      iconColor: 'white',
      shadow: '0 4px 12px rgba(99,102,241,0.38)',
    },
    userBadge: null, // Shows premium status instead
    accentColor: 'var(--indigo-400)',
    accentBg: 'var(--accent-muted)',
    accentBorder: 'var(--accent-border)',
  },
  teacher: {
    nav: TEACHER_NAV,
    bottomNav: null,
    hasSections: true,
    branding: {
      title: 'Teacher Panel',
      subtitle: 'Janta Exam',
      icon: GraduationCap,
      gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
      iconColor: 'white',
      shadow: '0 4px 12px rgba(139,92,246,0.38)',
    },
    userBadge: 'Teacher',
    accentColor: 'var(--violet-400)',
    accentBg: 'rgba(139,92,246,0.10)',
    accentBorder: 'rgba(139,92,246,0.22)',
  },
  admin: {
    nav: ADMIN_NAV,
    bottomNav: null,
    hasSections: true,
    branding: {
      title: 'Admin Panel',
      subtitle: 'Janta Exam',
      icon: Shield,
      gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      iconColor: '#1a1a2e',
      shadow: '0 4px 12px rgba(251,191,36,0.38)',
    },
    userBadge: 'Administrator',
    accentColor: '#fbbf24',
    accentBg: 'rgba(251,191,36,0.09)',
    accentBorder: 'transparent',
    accentBorderLeft: true,
  },
};

export { ROLE_CONFIG, USER_NAV, USER_BOTTOM_NAV, TEACHER_NAV, ADMIN_NAV };
