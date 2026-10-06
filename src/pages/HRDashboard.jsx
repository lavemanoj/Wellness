import { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { useAuth } from '../context/AuthContext';
import {
  collection, getDocs, query, where, orderBy,
  updateDoc, doc, onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Users, BarChart3, Calendar, LogOut,
  Bell, Clock, TrendingUp, Heart,
  CheckCircle, XCircle, AlertCircle,
  UserCheck, Activity, Award, ChevronRight,
  MessageSquare, Zap, User, Target,
  AlertTriangle, Footprints, SmilePlus,
  Moon, FileText, Sparkles
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function getWellnessClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function HRSidebar({ activeTab, setActiveTab, userProfile, logout }) {
  const navItems = [
    { id: 'overview',     icon: <BarChart3 size={18} />, label: 'Overview' },
    { id: 'employees',    icon: <Users size={18} />, label: 'Employees' },
    { id: 'wellness',     icon: <Heart size={18} />, label: 'Wellness Analytics' },
    { id: 'productivity', icon: <Zap size={18} />, label: 'Productivity Tracker' },
    { id: 'leaves',       icon: <Clock size={18} />, label: 'Leave Requests' },
    { id: 'replies',      icon: <MessageSquare size={18} />, label: 'Replies' },
    { id: 'profile',      icon: <User size={18} />, label: 'My Profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Self Wellness</span>
        <span className="sidebar-logo-badge hr">HR</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main Menu</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active hr-active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            id={`hr-nav-${item.id}`}
          >
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials(userProfile?.fullName || 'HR')}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{userProfile?.fullName || 'HR Manager'}</div>
          <div className="sidebar-user-role">HR Manager</div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout} title="Logout" id="hr-logout-btn">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ employees, leaveRequests, wellnessLogs }) {
  const totalEmp    = employees.length;
  const activeEmp   = employees.filter((e) => e.status === 'active').length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending').length;
  const avgWellness = employees.length
    ? Math.round(employees.reduce((s, e) => s + (e.wellnessScore || 0), 0) / employees.length)
    : 0;

  const stats = [
    { icon: <Users size={20} />, label: 'Total Employees', value: totalEmp,        trend: '+2 this month', trendDir: 'up',      color: 'purple' },
    { icon: <CheckCircle size={20} />, label: 'Active Today',    value: activeEmp,       trend: `${Math.round(activeEmp/totalEmp*100)||0}% present`, trendDir: 'up', color: 'green' },
    { icon: <Clock size={20} />, label: 'Pending Leaves',  value: pendingLeaves,   trend: 'Awaiting review', trendDir: 'neutral', color: 'orange' },
    { icon: <Heart size={20} />, label: 'Avg Wellness',    value: `${avgWellness}%`, trend: '+5% vs last week', trendDir: 'up',  color: 'blue' },
  ];

  const recentLogs = [...wellnessLogs].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).slice(0, 5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card animate-in" key={i}>
            <div className="stat-card-top">
              <div className={`stat-card-icon ${s.color}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <span className={`stat-card-trend ${s.trendDir}`}>{s.trend}</span>
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Wellness Logs */}
      <div className="card">
        <div className="section-header">
          <span className="section-title"><Activity size={16} /> Recent Wellness Activity</span>
        </div>
        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No wellness logs yet. Employees will show up here once they start logging.</p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Mood</th>
                  <th>Stress</th>
                  <th>Sleep</th>
                  <th>Steps</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const emp = employees.find((e) => e.uid === log.uid);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="emp-cell">
                          <div className="emp-cell-avatar">{initials(emp?.fullName || '?')}</div>
                          <div>
                            <div className="emp-cell-name">{emp?.fullName || 'Unknown'}</div>
                            <div className="emp-cell-email">{emp?.department || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{log.date || '—'}</td>
                      <td>{log.mood}/5</td>
                      <td><span className={`badge ${log.stress > 7 ? 'badge-rejected' : log.stress > 4 ? 'badge-pending' : 'badge-approved'}`}>{log.stress}/10</span></td>
                      <td>{log.sleepHours || '—'}h</td>
                      <td>{(log.steps || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
function EmployeesTab({ employees, onSelectEmployee }) {
  const [search, setSearch] = useState('');
  const filtered = employees.filter((e) =>
    e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title"><Users size={16} /> Employee Directory</span>
        <input
          type="text"
          placeholder="🔍  Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dash-input"
          style={{ maxWidth:220, padding:'7px 12px' }}
          id="emp-search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">
            {search ? 'No employees match your search.' : 'No employees registered yet.'}
          </p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Employee ID</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Wellness</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.uid} onClick={() => onSelectEmployee(emp)} style={{ cursor: 'pointer' }} title="Click to view detailed calendar overview">
                  <td>
                    <div className="emp-cell">
                      <div className="emp-cell-avatar">
                        {emp.photoURL ? <img src={emp.photoURL} alt={emp.fullName} /> : initials(emp.fullName)}
                      </div>
                      <div>
                        <div className="emp-cell-name">{emp.fullName}</div>
                        <div className="emp-cell-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.department || '—'}</td>
                  <td><code style={{ fontSize:'0.78rem', color:'#475569' }}>{emp.employeeId || '—'}</code></td>
                  <td>{emp.phone || '—'}</td>
                  <td><span className={`badge badge-${emp.status || 'active'}`}>● {emp.status || 'active'}</span></td>
                  <td>
                    <div className="wellness-bar-wrap">
                      <div className="wellness-bar">
                        <div
                          className={`wellness-bar-fill ${getWellnessClass(emp.wellnessScore || 0)}`}
                          style={{ width: `${emp.wellnessScore || 0}%` }}
                        />
                      </div>
                      <span className="wellness-score-num">{emp.wellnessScore || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Wellness Analytics Tab ───────────────────────────────────────────────────
function WellnessTab({ employees, wellnessLogs }) {
  const avgMood    = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.mood||0), 0) / wellnessLogs.length).toFixed(1) : 0;
  const avgStress  = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.stress||0), 0) / wellnessLogs.length).toFixed(1) : 0;
  const avgSleep   = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.sleepHours||0), 0) / wellnessLogs.length).toFixed(1) : 0;
  const avgSteps   = wellnessLogs.length ? Math.round(wellnessLogs.reduce((s, l) => s + (l.steps||0), 0) / wellnessLogs.length) : 0;

  // Last 7 days chart data
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const chartData = days.map((d) => ({
    day: d,
    value: Math.floor(Math.random() * 60) + 40 // Placeholder until real aggregation
  }));

  const empWellness = employees.map((e) => ({
    name: e.fullName,
    score: e.wellnessScore || 0,
    dept: e.department,
  })).sort((a, b) => b.score - a.score);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Summary cards */}
      <div className="analytics-grid">
        {[
          { icon: <SmilePlus size={20} />,   label:'Avg Mood',   value:`${avgMood}/5`,                sub:'Across all logs' },
          { icon: <Activity size={20} />,    label:'Avg Stress', value:`${avgStress}/10`,             sub:'Lower is better' },
          { icon: <Moon size={20} />,        label:'Avg Sleep',  value:`${avgSleep}h`,                sub:'Per night' },
          { icon: <Footprints size={20} />,  label:'Avg Steps',  value:avgSteps.toLocaleString(),     sub:'Per day' },
          { icon: <FileText size={20} />,    label:'Total Logs', value:wellnessLogs.length,           sub:'All time' },
          { icon: <Users size={20} />,       label:'Employees',  value:employees.length,              sub:'Registered' },
        ].map((c, i) => (
          <div className="analytics-card animate-in" key={i}>
            <div className="analytics-card-icon" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.04)', color:'var(--gray-300)', margin:'0 auto 6px' }}>{c.icon}</div>
            <div className="analytics-card-value">{c.value}</div>
            <div className="analytics-card-label">{c.label}</div>
            <div style={{ fontSize:'0.68rem', color:'var(--gray-500)', marginTop:2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Wellness Scores Table */}
      <div className="card">
        <div className="section-header">
          <span className="section-title"><TrendingUp size={16} /> Employee Wellness Scores</span>
        </div>
        {empWellness.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Heart size={28} color="#22c55e" /></div>
            <p className="empty-state-text">Wellness scores will appear once employees log their health data.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {empWellness.map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div className="emp-cell-avatar" style={{ width:32, height:32, flexShrink:0 }}>
                  {initials(e.name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--gray-100)', marginBottom:4 }}>
                    {e.name} <span style={{ color:'var(--gray-400)', fontWeight:400 }}>· {e.dept}</span>
                  </div>
                  <div className="wellness-bar-wrap">
                    <div className="wellness-bar">
                      <div className={`wellness-bar-fill ${getWellnessClass(e.score)}`} style={{ width:`${e.score}%` }} />
                    </div>
                    <span className="wellness-score-num">{e.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Focus Mode Analytics Tab ────────────────────────────────────────────────
function ProductivityTab({ employees, workSessions }) {
  const completedSessions = workSessions.filter(s => s.status === 'completed');
  
  // Calculate aggregate stats
  const totalMs = completedSessions.reduce((acc, curr) => acc + (curr.totalDurationMs || 0), 0);
  const totalHours = (totalMs / 3600000).toFixed(1);
  
  const totalDistractions = completedSessions.reduce((acc, curr) => acc + (curr.distractionsCount || 0), 0);
  
  const scoreSessions = completedSessions.filter(s => s.focusScore !== undefined);
  const averageFocusScore = scoreSessions.length 
    ? Math.round(scoreSessions.reduce((acc, curr) => acc + curr.focusScore, 0) / scoreSessions.length)
    : 0;

  // Group by employee to find individual stats
  const employeeStats = employees.map(emp => {
    const empSessions = workSessions.filter(s => s.uid === emp.uid);
    const completed = empSessions.filter(s => s.status === 'completed');
    
    const empTotalMs = completed.reduce((acc, curr) => acc + (curr.totalDurationMs || 0), 0);
    const empTotalHours = empTotalMs / 3600000;
    
    // Average hours and average focus score
    const avgHours = completed.length ? (empTotalHours / completed.length) : 0;
    const completedWithScore = completed.filter(s => s.focusScore !== undefined);
    const avgScore = completedWithScore.length
      ? Math.round(completedWithScore.reduce((a, b) => a + b.focusScore, 0) / completedWithScore.length)
      : null;

    const totalEmpDistractions = completed.reduce((a, b) => a + (b.distractionsCount || 0), 0);

    // Active session
    const active = empSessions.find(s => s.status === 'active' || s.status === 'paused');

    let focusStatus = 'Not Started';
    let statusClass = 'badge-inactive';
    if (avgScore !== null) {
      if (avgScore >= 80) {
        focusStatus = 'High Focus';
        statusClass = 'badge-approved';
      } else if (avgScore >= 50) {
        focusStatus = 'Medium Focus';
        statusClass = 'badge-pending';
      } else {
        focusStatus = 'Distracted';
        statusClass = 'badge-rejected';
      }
    }

    // Get the most recent goal
    const lastSession = completed[0] || active;
    const recentGoal = lastSession ? lastSession.focusGoal : '—';

    return {
      ...emp,
      totalHours: empTotalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      avgScore,
      focusStatus,
      statusClass,
      totalDistractions: totalEmpDistractions,
      recentGoal,
      isCurrentlyWorking: active ? true : false,
      activeStatus: active ? active.status : null
    };
  });

  const workingNowCount = employeeStats.filter(e => e.isCurrentlyWorking).length;
  
  // Categorize focus classes
  const highFocusCount = employeeStats.filter(e => e.avgScore !== null && e.avgScore >= 80).length;
  const medFocusCount = employeeStats.filter(e => e.avgScore !== null && e.avgScore >= 50 && e.avgScore < 80).length;
  const lowFocusCount = employeeStats.filter(e => e.avgScore !== null && e.avgScore < 50).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Top focus analytics cards */}
      <div className="analytics-grid">
        {[
          { icon: <TrendingUp size={20} />, label: 'Avg Team Focus', value: `${averageFocusScore}%`, sub: 'Concentration score' },
          { icon: <Clock size={20} />, label: 'Total Deep Work', value: `${totalHours} hrs`, sub: 'Focused duration' },
          { icon: <AlertCircle size={20} />, label: 'Total Distractions', value: totalDistractions, sub: 'Tab switching triggers' },
          { icon: <Users size={20} />, label: 'Active Focusers', value: workingNowCount, sub: 'Employees active now' },
          { icon: <Zap size={20} />, label: 'High Focus Team', value: highFocusCount, sub: 'Avg score > 80%' },
          { icon: <Activity size={20} />, label: 'Deep Sessions', value: completedSessions.length, sub: 'Completed deep work' }
        ].map((c, i) => (
          <div className="analytics-card animate-in" key={i}>
            <div className="analytics-card-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
            <div className="analytics-card-value">{c.value}</div>
            <div className="analytics-card-label">{c.label}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--gray-600)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 20 }}>
        {/* Team breakdown list */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Focus Performance Directory</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {employeeStats.map((e, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="emp-cell-avatar" style={{ width: 32, height: 32 }}>
                    {initials(e.fullName)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                      {e.fullName}
                      {e.isCurrentlyWorking && (
                        <span style={{ 
                          marginLeft: 8, 
                          padding: '1px 5px', 
                          background: 'rgba(20,184,166,0.15)', 
                          color: '#2dd4bf', 
                          fontSize: '0.6rem', 
                          borderRadius: 4,
                          fontWeight: 700,
                          letterSpacing: '0.05em'
                        }}>
                          ● {e.activeStatus.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#5b6e85', marginTop: 1 }}>
                      Goal: <span style={{ color: '#334155' }}>{e.recentGoal || '—'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                      {e.avgScore !== null ? `${e.avgScore}% Focus` : '—'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#5b6e85' }}>
                      {e.totalDistractions} distractions
                    </div>
                  </div>
                  <span className={`badge ${e.statusClass}`} style={{ fontSize: '0.65rem', width: 90, textAlign: 'center' }}>
                    {e.focusStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Mode explanation and metrics guidelines */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header">
            <span className="section-title">Deep Concentration Rules</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.8rem', color: 'var(--gray-200)', lineHeight: 1.4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width:20, height:20, flexShrink:0, marginTop:1, color:'var(--emp-primary)', display:'flex' }}><Target size={18} /></span>
              <div>
                <strong style={{ color: 'var(--gray-50)' }}>Deep Focus Score:</strong> Automatically calculated based on distractions. Swerved attention triggers alert warnings and penalizes score.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width:20, height:20, flexShrink:0, marginTop:1, color:'#f59e0b', display:'flex' }}><AlertTriangle size={18} /></span>
              <div>
                <strong style={{ color: 'var(--gray-50)' }}>Distraction Warnings:</strong> Tracks window minimizing or tab switching away from active focus screen.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width:20, height:20, flexShrink:0, marginTop:1, color:'#10b981', display:'flex' }}><Clock size={18} /></span>
              <div>
                <strong style={{ color: 'var(--gray-50)' }}>Break Reminders:</strong> Automated chimes prompt employees to take rest breaks every 25/50 mins to alleviate stress and digital eye strain.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', padding: 12, borderRadius: 8 }}>
            <h5 style={{ color: 'var(--gray-100)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display:'flex', alignItems:'center', gap:6 }}>
              <Sparkles size={14} color="#8b5cf6" /> HR Recommendations
            </h5>
            <p style={{ fontSize: '0.72rem', color: 'var(--gray-300)', lineHeight: 1.3 }}>
              High distraction counts combined with low focus scores may indicate fatigue or lack of goal clarity. Use wellness charts to analyze employee burnouts.
            </p>
          </div>
        </div>
      </div>

      {/* Completed Productivity sessions list */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">All Completed Productivity Sessions</span>
        </div>

        {completedSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-500)', fontSize: '0.8rem' }}>
            No completed deep focus sessions found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Employee</th>
                  <th style={{ padding: 10 }}>Date</th>
                  <th style={{ padding: 10 }}>Start Time</th>
                  <th style={{ padding: 10 }}>End Time</th>
                  <th style={{ padding: 10 }}>Task / Goal</th>
                  <th style={{ padding: 10 }}>Duration</th>
                  <th style={{ padding: 10 }}>Distractions</th>
                  <th style={{ padding: 10 }}>Productivity</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map((session) => {
                  const hrs = session.totalDurationMs ? parseFloat((session.totalDurationMs / 3600000).toFixed(2)) : 0;
                  const score = session.focusScore || 0;
                  
                  let scoreBadge = 'badge-approved';
                  if (score < 50) {
                    scoreBadge = 'badge-rejected';
                  } else if (score < 80) {
                    scoreBadge = 'badge-pending';
                  }

                  const employeeName = employees.find(e => e.uid === session.uid)?.fullName || session.email || 'Employee';
                  const startText = session.startTime
                    ? new Date(session.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const endText = session.endTime
                    ? new Date(session.endTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  
                  return (
                    <tr key={session.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{employeeName}</td>
                      <td style={{ padding: 10, color: '#475569' }}>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td style={{ padding: 10, color: 'var(--emp-primary)', fontWeight: 600 }}>{startText}</td>
                      <td style={{ padding: 10, color: '#f59e0b', fontWeight: 600 }}>{endText}</td>
                      <td style={{ padding: 10 }}>{session.focusGoal || 'General Work Session'}</td>
                      <td style={{ padding: 10 }}>{hrs} hrs</td>
                      <td style={{ padding: 10 }}>{session.distractionsCount || 0} times</td>
                      <td style={{ padding: 10 }}>
                        <span className={`badge ${scoreBadge}`} style={{ fontSize: '0.65rem' }}>
                          {score}% Score
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Leave Requests Tab ───────────────────────────────────────────────────────
function LeavesTab({ leaveRequests, employees, onUpdateLeave }) {
  const [filter, setFilter] = useState('pending');

  const filtered = leaveRequests.filter((l) => filter === 'all' || l.status === filter);

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">
          <Calendar size={16} /> Leave Requests
          {leaveRequests.filter((l) => l.status === 'pending').length > 0 && (
            <span className="nav-badge" style={{ position:'static', marginLeft:6 }}>
              {leaveRequests.filter((l) => l.status === 'pending').length}
            </span>
          )}
        </span>
        <div style={{ display:'flex', gap:8 }}>
          {['pending','approved','rejected','all'].map((f) => (
            <button key={f} className={`section-action-btn ${filter === f ? 'primary' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform:'capitalize', padding:'6px 12px' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌴</div>
          <p className="empty-state-text">No {filter === 'all' ? '' : filter} leave requests.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const emp = employees.find((e) => e.uid === req.employeeUid);
                return (
                  <tr key={req.id}>
                    <td>
                      <div className="emp-cell">
                        <div className="emp-cell-avatar">{initials(req.employeeName || emp?.fullName || '?')}</div>
                        <div>
                          <div className="emp-cell-name">{req.employeeName || emp?.fullName || 'Unknown'}</div>
                          <div className="emp-cell-email">{emp?.department || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-employee">{req.type || 'Annual'}</span></td>
                    <td>{req.startDate || '—'}</td>
                    <td>{req.endDate || '—'}</td>
                    <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {req.reason || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${req.status}`}>
                        {req.status === 'approved' ? '✓' : req.status === 'rejected' ? '✗' : '⏳'} {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="tbl-btn approve" onClick={() => onUpdateLeave(req.id, 'approved')}>✓ Approve</button>
                          <button className="tbl-btn reject"  onClick={() => onUpdateLeave(req.id, 'rejected')}>✗ Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize:'0.72rem', color:'var(--gray-600)' }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



// ─── Replies Tab ──────────────────────────────────────────────────────────────
function RepliesTab({ employees, workSessions, wellnessLogs, leaveRequests, onUpdateLeave }) {
  const [activeSubTab, setActiveSubTab] = useState('leaves');
  const [leaveReplies, setLeaveReplies] = useState({});
  const [wellnessReplies, setWellnessReplies] = useState({});
  const [productivityReplies, setProductivityReplies] = useState({});

  const [savingId, setSavingId] = useState(null);

  // Initialize reply texts for items that already have them
  useEffect(() => {
    const lR = {};
    leaveRequests.forEach(r => {
      lR[r.id] = r.hrReply || '';
    });
    setLeaveReplies(lR);

    const wR = {};
    wellnessLogs.forEach(l => {
      wR[l.id] = l.hrReply || '';
    });
    setWellnessReplies(wR);

    const pR = {};
    workSessions.forEach(s => {
      pR[s.id] = s.hrReply || '';
    });
    setProductivityReplies(pR);
  }, [leaveRequests, wellnessLogs, workSessions]);

  const handleSaveWellnessReply = async (logId, replyText) => {
    setSavingId(logId);
    try {
      await updateDoc(doc(db, 'wellness_logs', logId), {
        hrReply: replyText,
        hrReplyAt: new Date().toISOString()
      });
      alert('Support reply updated successfully!');
    } catch (err) {
      console.error('Error saving wellness reply:', err);
      alert('Failed to save reply.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveProductivityReply = async (sessionId, replyText) => {
    setSavingId(sessionId);
    try {
      await updateDoc(doc(db, 'work_sessions', sessionId), {
        hrReply: replyText,
        hrReplyAt: new Date().toISOString()
      });
      alert('Productivity feedback updated successfully!');
    } catch (err) {
      console.error('Error saving productivity reply:', err);
      alert('Failed to save reply.');
    } finally {
      setSavingId(null);
    }
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '16px 20px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-tab Switcher */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'leaves',       label: 'Leave Replies' },
          { id: 'wellness',     label: 'Wellness Replies' },
          { id: 'productivity', label: 'Productivity Replies' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setActiveSubTab(st.id)}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: activeSubTab === st.id
                ? '1px solid var(--hr-primary)'
                : '1px solid #d1d5db',
              background: activeSubTab === st.id
                ? 'rgba(217,119,6,0.12)'
                : '#f8fafc',
              color: activeSubTab === st.id ? 'var(--hr-primary)' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ── Leave Replies Sub-tab ────────────────── */}
      {activeSubTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-header">
              <span className="section-title">Reply to Employee Leave Requests</span>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🌴</div>
                <p className="empty-state-text">No leave requests found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {leaveRequests.map(req => {
                  const emp = employees.find(e => e.uid === req.employeeUid);
                  const isPending = req.status === 'pending';
                  const badge = req.status === 'approved' ? 'badge-approved' : req.status === 'rejected' ? 'badge-rejected' : 'badge-pending';
                  return (
                    <div key={req.id} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {req.employeeName || emp?.fullName || 'Employee'} ({emp?.department || 'Staff'})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                            <strong>Type:</strong> {req.type || 'Annual'} | <strong>Dates:</strong> {req.startDate} to {req.endDate}
                          </div>
                          <div style={{ fontSize: '0.81rem', color: '#334155', marginTop: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid var(--hr-primary)', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                            <strong>Reason:</strong> {req.reason || 'No reason provided'}
                          </div>
                        </div>
                        <div>
                          <span className={`badge ${badge}`}>{req.status.toUpperCase()}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
                          HR Response / Reply Note
                        </label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Enter notes or reasons for this action (e.g. Approved, cover arranged / Rejected, busy season)"
                            value={leaveReplies[req.id] || ''}
                            onChange={(e) => setLeaveReplies({ ...leaveReplies, [req.id]: e.target.value })}
                            style={{
                              flex: 1,
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              padding: '8px 12px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              outline: 'none',
                            }}
                          />
                          {isPending ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => onUpdateLeave(req.id, 'approved', leaveReplies[req.id] || '')}
                                className="btn btn-primary"
                                style={{ background: '#10b981', borderColor: '#10b981', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => onUpdateLeave(req.id, 'rejected', leaveReplies[req.id] || '')}
                                className="btn btn-danger"
                                style={{ background: '#ef4444', borderColor: '#ef4444', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onUpdateLeave(req.id, req.status, leaveReplies[req.id] || '')}
                              className="btn"
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              Update Reply Note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Wellness Replies Sub-tab ──────────────── */}
      {activeSubTab === 'wellness' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-header">
              <span className="section-title">Respond to Employee Wellness Logs</span>
            </div>

            {wellnessLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💚</div>
                <p className="empty-state-text">No wellness logs logged yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {wellnessLogs.slice(0, 30).map(log => {
                  const emp = employees.find(e => e.uid === log.uid);
                  const isStressHigh = log.stress > 6;
                  const isMoodLow = log.mood <= 2;
                  const borderCol = isStressHigh || isMoodLow ? '#ef4444' : 'rgba(255,255,255,0.08)';

                  return (
                    <div key={log.id} style={{ ...cardStyle, border: `1px solid ${borderCol}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {emp?.fullName || 'Employee'} ({log.date || '—'})
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Mood: {['😔','😕','😐','😊','😁'][log.mood-1] || '—'} ({log.mood}/5)
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                               Stress: <strong style={{ color: isStressHigh ? '#ef4444' : '#0f172a' }}>{log.stress}/10</strong>
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Sleep: {log.sleepHours}h
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Steps: {log.steps?.toLocaleString()}
                            </span>
                          </div>
                          {log.notes && (
                            <div style={{ fontSize: '0.81rem', color: '#334155', marginTop: 8, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 4 }}>
                              <strong>Note:</strong> "{log.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: 6 }}>
                          Send HR Support Reply / Feedback Note
                        </label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder={isStressHigh || isMoodLow ? "Offer support (e.g. Let's schedule a chat to review your workload / reach out if you need assistance)" : "Encourage wellness progress"}
                            value={wellnessReplies[log.id] || ''}
                            onChange={(e) => setWellnessReplies({ ...wellnessReplies, [log.id]: e.target.value })}
                            style={{
                              flex: 1,
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              padding: '8px 12px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            disabled={savingId === log.id}
                            onClick={() => handleSaveWellnessReply(log.id, wellnessReplies[log.id] || '')}
                            className="btn btn-primary"
                            style={{ background: 'var(--hr-primary)', borderColor: 'var(--hr-primary)', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {savingId === log.id ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Productivity Replies Sub-tab ──────────── */}
      {activeSubTab === 'productivity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-header">
              <span className="section-title">Feedback on Employee Productivity Sessions</span>
            </div>

            {workSessions.filter(s => s.status === 'completed').length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <p className="empty-state-text">No completed productivity sessions to review yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {workSessions.filter(s => s.status === 'completed').slice(0, 30).map(session => {
                  const emp = employees.find(e => e.uid === session.uid);
                  const hrs = session.totalDurationMs ? parseFloat((session.totalDurationMs / 3600000).toFixed(2)) : 0;
                  const score = session.focusScore || 0;
                  const scoreBadge = score >= 80 ? 'badge-approved' : score >= 50 ? 'badge-pending' : 'badge-rejected';

                  const start = session.startTime ? new Date(session.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const end   = session.endTime   ? new Date(session.endTime.seconds   * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                  return (
                    <div key={session.id} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {emp?.fullName || session.email || 'Employee'}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Date: {session.date} ({start} - {end})
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Goal: <strong>{session.focusGoal || 'General Work'}</strong>
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Duration: {hrs}h
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                              Distractions: {session.distractionsCount || 0} times
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className={`badge ${scoreBadge}`} style={{ fontSize: '0.7rem' }}>
                            {score}% Score
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14 }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: 6 }}>
                          Send HR Productivity Feedback / Note
                        </label>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Enter feedback (e.g. Great focus on coding! / Try to minimize distraction counts next time)"
                            value={productivityReplies[session.id] || ''}
                            onChange={(e) => setProductivityReplies({ ...productivityReplies, [session.id]: e.target.value })}
                            style={{
                              flex: 1,
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              padding: '8px 12px',
                              borderRadius: 6,
                              fontSize: '0.82rem',
                              outline: 'none',
                            }}
                          />
                          <button
                            disabled={savingId === session.id}
                            onClick={() => handleSaveProductivityReply(session.id, productivityReplies[session.id] || '')}
                            className="btn btn-primary"
                            style={{ background: 'var(--hr-primary)', borderColor: 'var(--hr-primary)', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {savingId === session.id ? 'Sending...' : 'Send Feedback'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function todayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}


// ─── Employee Profile Drawer (HR view of Employee Wellness details + Calendar) ────
function EmployeeProfileDrawer({ employee, onClose, wellnessLogs, leaveRequests }) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [currentYear, setCurrentYear]   = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const padD = String(d).padStart(2, '0');
    const padM = String(currentMonth + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${padM}-${padD}`;
    cells.push({ type: 'day', dayNum: d, dateStr, key: dateStr });
  }

  const selectedLog = wellnessLogs.find((l) => l.date === selectedDate);
  const selectedLeave = leaveRequests.find((r) => {
    if (!r.startDate || !r.endDate || r.status !== 'approved') return false;
    return selectedDate >= r.startDate && selectedDate <= r.endDate;
  });

  // Analytics summary for employee
  const avgMood = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.mood || 0), 0) / wellnessLogs.length).toFixed(1) : '—';
  const avgSleep = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.sleepHours || 0), 0) / wellnessLogs.length).toFixed(1) : '—';
  const avgStress = wellnessLogs.length ? (wellnessLogs.reduce((s, l) => s + (l.stress || 0), 0) / wellnessLogs.length).toFixed(1) : '—';
  const avgSteps = wellnessLogs.length ? Math.round(wellnessLogs.reduce((s, l) => s + (l.steps || 0), 0) / wellnessLogs.length) : '—';

  return (
    <div className="hr-drawer-overlay" onClick={onClose}>
      <div className="hr-drawer-content animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="hr-drawer-header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
              {employee.fullName}'s Profile
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#5b6e85', marginTop: 2 }}>
              {employee.department} · {employee.employeeId || 'No ID'}
            </p>
          </div>
          <button className="notification-close-btn" onClick={onClose} style={{ fontSize: '1.25rem', padding: 8 }}>✕</button>
        </div>

        <div className="hr-drawer-body">
          {/* Top Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              <div className="emp-cell-avatar" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                {employee.photoURL ? <img src={employee.photoURL} alt={employee.fullName} /> : initials(employee.fullName)}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#5b6e85', textTransform: 'uppercase' }}>Wellness Score</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`wellness-score-num ${getWellnessClass(employee.wellnessScore || 0)}`}>
                    {employee.wellnessScore || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#fafbfc', padding: 14 }}>
              <div style={{ fontSize: '0.7rem', color: '#5b6e85', textTransform: 'uppercase' }}>Contact Info</div>
              <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 4 }}>📧 {employee.email}</div>
              {employee.phone && <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 2 }}>📞 {employee.phone}</div>}
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Avg Mood', value: avgMood === '—' ? '—' : `${avgMood}/5`, emoji: '😊' },
              { label: 'Avg Stress', value: avgStress === '—' ? '—' : `${avgStress}/10`, emoji: '🧠' },
              { label: 'Avg Sleep', value: avgSleep === '—' ? '—' : `${avgSleep}h`, emoji: '😴' },
              { label: 'Avg Steps', value: avgSteps === '—' ? '—' : avgSteps.toLocaleString(), emoji: '👟' },
            ].map((stat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 8px', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{stat.emoji}</div>
                <div style={{ fontSize: '0.62rem', color: '#5b6e85', textTransform: 'uppercase' }}>{stat.label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: 2 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Calendar Widget */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="section-title" style={{ fontSize: '0.9rem' }}>Wellness Calendar</span>
              <span style={{ fontSize: '0.72rem', color: '#5b6e85' }}>Select date to view daily logs</span>
            </div>

            <div className="wellness-calendar" style={{ background: '#ffffff' }}>
              <div className="calendar-header" style={{ padding: '10px 14px' }}>
                <span className="calendar-month-title" style={{ fontSize: '0.95rem' }}>
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <div className="calendar-nav-btns">
                  <button className="calendar-nav-btn" onClick={handlePrevMonth} style={{ width: 26, height: 26, fontSize: '0.75rem' }}>◀</button>
                  <button className="calendar-nav-btn" onClick={() => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth()); setSelectedDate(todayKey()); }} style={{ width: 44, height: 26, fontSize: '0.72rem' }}>Today</button>
                  <button className="calendar-nav-btn" onClick={handleNextMonth} style={{ width: 26, height: 26, fontSize: '0.75rem' }}>▶</button>
                </div>
              </div>

              <div className="calendar-grid">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                  <div className="calendar-day-header" key={w} style={{ padding: '8px 0', fontSize: '0.68rem' }}>{w}</div>
                ))}

                {cells.map((cell) => {
                  if (cell.type === 'empty') {
                    return <div className="calendar-day-cell empty" key={cell.key} style={{ minHeight: 46 }} />;
                  }

                  const log = wellnessLogs.find((l) => l.date === cell.dateStr);
                  const leaves = leaveRequests.filter((r) => {
                    if (r.status !== 'approved' && r.status !== 'pending') return false;
                    return cell.dateStr >= r.startDate && cell.dateStr <= r.endDate;
                  });
                  const isToday = cell.dateStr === todayKey();
                  const isSelected = cell.dateStr === selectedDate;

                  return (
                    <div
                      className={`calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      key={cell.key}
                      onClick={() => setSelectedDate(cell.dateStr)}
                      style={{ minHeight: 46, padding: 4 }}
                    >
                      <span className="calendar-day-num" style={{ fontSize: '0.72rem', width: 16, height: 16 }}>{cell.dayNum}</span>

                      <div className="calendar-events-wrap" style={{ gap: 2, marginTop: 2 }}>
                        {log && (
                          <span className={`calendar-score-tag ${getWellnessClass(log.wellnessScore ?? 0)}`} style={{ fontSize: '0.55rem', padding: '0px 2px' }}>
                            💚 {log.wellnessScore ?? 0}%
                          </span>
                        )}
                        {leaves.map((leave, idx) => (
                          <span key={idx} className="calendar-leave-banner" style={{ fontSize: '0.52rem', padding: '0px 2px' }}>
                            🌴 {(leave.type || '').split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Summary */}
          <div className="card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', marginTop: -6 }}>
            <div style={{ fontSize: '0.75rem', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 10, fontWeight: 600 }}>
              Summary: {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {selectedLog ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Mood', value: `${selectedLog.mood}/5` },
                    { label: 'Stress', value: `${selectedLog.stress}/10` },
                    { label: 'Sleep', value: `${selectedLog.sleepHours}h` },
                    { label: 'Steps', value: (selectedLog.steps || 0).toLocaleString() },
                  ].map((item, idx) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#5b6e85', textTransform: 'uppercase' }}>{item.label}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginTop: 1 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {selectedLog.notes && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 10, borderRadius: 6, fontSize: '0.75rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.3 }}>
                    "{selectedLog.notes}"
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>
                No health logs recorded by {employee.firstName} on this date.
              </div>
            )}

            {selectedLeave && (
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>🌴 Leave approved: <strong>{selectedLeave.type}</strong></span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{selectedLeave.startDate} to {selectedLeave.endDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HR Profile Tab ───────────────────────────────────────────────────────────
function HRProfileTab({ userProfile }) {
  const { changePassword, deleteAccount, logout } = useAuth();
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [pwdStatus,    setPwdStatus]    = useState('');
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [deleteConfirm,setDeleteConfirm]= useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [theme,        setTheme]        = useState(() => localStorage.getItem('sw_theme') || 'default');

  useEffect(() => {
    const root = document.querySelector('.dashboard-layout');
    if (!root) return;
    ['theme-onyx','theme-glass','theme-light'].forEach(c => root.classList.remove(c));
    if (theme !== 'default') root.classList.add(`theme-${theme}`);
    localStorage.setItem('sw_theme', theme);
  }, [theme]);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) { setPwdStatus('error:Min 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdStatus('error:Passwords do not match.'); return; }
    setPwdLoading(true);
    try { await changePassword(newPwd); setPwdStatus('success'); setNewPwd(''); setConfirmPwd(''); }
    catch (err) { setPwdStatus(`error:${err.message || 'Failed. Please re-login.'}`); }
    finally { setPwdLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteAccount(); await logout(); }
    catch (err) { alert(err.message || 'Delete failed. Please re-login.'); }
    finally { setDeleting(false); setDeleteConfirm(false); }
  };

  const themes = [
    { key: 'default', label: 'Dark Premium',       desc: 'Deep navy with ambient glow orbs' },
    { key: 'onyx',    label: 'Onyx Black',          desc: 'Pure black, ultra-minimalist' },
    { key: 'glass',   label: 'Glassmorphic Navy',   desc: 'Translucent frosted panes' },
    { key: 'light',   label: 'Light Professional',  desc: 'Clean white cards, soft slate' },
  ];

  const fields = [
    { label:'Full Name',    value: userProfile?.fullName   },
    { label:'Email',        value: userProfile?.email      },
    { label:'Department',   value: userProfile?.department },
    { label:'HR ID',        value: userProfile?.employeeId },
    { label:'Role',         value: 'HR Manager'            },
    { label:'Status',       value: userProfile?.status || 'Active' },
    { label:'Member Since', value: userProfile?.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—' },
  ];

  const cardStyle  = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'20px 24px' };
  const labelStyle = { fontSize:'0.72rem', color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight:600 };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="card">
        <div className="section-header"><span className="section-title">My HR Profile</span></div>
        <div className="profile-fields" style={{ marginTop:16 }}>
          {fields.map((f) => (
            <div className="profile-field" key={f.label}>
              <div className="profile-field-label">{f.label}</div>
              <div className="profile-field-value">{f.value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, background:'linear-gradient(135deg, rgba(217,119,6,0.08) 0%, rgba(180,83,9,0.05) 100%)', border:'1px solid rgba(217,119,6,0.2)' }}>
        <div style={labelStyle}>Subscription Tier</div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#d97706,#b45309)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Award size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--gray-50)' }}>Enterprise HR Premium</div>
            <div style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginTop:2 }}>Full access to workforce analytics, leave management, wellness insights and employee reporting.</div>
          </div>
          <span className="badge badge-approved" style={{ marginLeft:'auto', fontSize:'0.65rem', whiteSpace:'nowrap' }}>Active</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Web Theme</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
          {themes.map((t) => (
            <div key={t.key} onClick={() => setTheme(t.key)}
              style={{
                background: theme === t.key ? 'rgba(217,119,6,0.12)' : 'rgba(255,255,255,0.02)',
                border: theme === t.key ? '1.5px solid rgba(217,119,6,0.5)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all 0.2s'
              }}>
              <div style={{ fontSize:'0.8rem', fontWeight:600, color: theme === t.key ? 'var(--hr-primary)' : 'var(--gray-200)', marginBottom:3 }}>{t.label}</div>
              <div style={{ fontSize:'0.68rem', color:'var(--gray-500)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={labelStyle}>Change Password</div>
        <form onSubmit={handleChangePwd} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:'0.75rem', color:'var(--gray-400)', display:'block', marginBottom:4 }}>New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                placeholder="Min. 8 characters"
                style={{ width:'100%', padding:'8px 12px', fontSize:'0.8rem', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--gray-100)' }} />
            </div>
            <div>
              <label style={{ fontSize:'0.75rem', color:'var(--gray-400)', display:'block', marginBottom:4 }}>Confirm Password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
                style={{ width:'100%', padding:'8px 12px', fontSize:'0.8rem', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--gray-100)' }} />
            </div>
          </div>
          {pwdStatus.startsWith('error:') && <p style={{ fontSize:'0.78rem', color:'#ef4444', margin:0 }}>{pwdStatus.slice(6)}</p>}
          {pwdStatus === 'success' && <p style={{ fontSize:'0.78rem', color:'#22c55e', margin:0 }}>Password updated successfully!</p>}
          <div>
            <button type="submit" disabled={pwdLoading}
              style={{ background:'var(--hr-gradient)', border:'none', color:'#fff', borderRadius:6, padding:'8px 20px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, border:'1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ ...labelStyle, color:'#ef4444' }}>Danger Zone</div>
        {!deleteConfirm ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--gray-100)' }}>Delete Account</div>
              <div style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginTop:2 }}>Permanently removes your HR account. This action cannot be undone.</div>
            </div>
            <button onClick={() => setDeleteConfirm(true)}
              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:6, padding:'8px 16px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
              Delete My Account
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <p style={{ fontSize:'0.82rem', color:'#fca5a5', margin:0 }}>Are you absolutely sure? Your HR account and all associated data will be permanently deleted.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleDelete} disabled={deleting}
                style={{ background:'#ef4444', border:'none', color:'#fff', borderRadius:6, padding:'8px 18px', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>
                {deleting ? 'Deleting…' : 'Yes, Delete Everything'}
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--gray-300)', borderRadius:6, padding:'8px 16px', fontSize:'0.8rem', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HR Dashboard (Main) ──────────────────────────────────────────────────────
export default function HRDashboard() {
  const { userProfile, logout } = useAuth();
  const [activeTab,     setActiveTab]     = useState('overview');
  const [employees,     setEmployees]     = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [wellnessLogs,  setWellnessLogs]  = useState([]);
  const [workSessions,  setWorkSessions]  = useState([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Tab meta
  const tabMeta = {
    overview:     { title: 'Dashboard Overview',        sub: 'Welcome back, ' + (userProfile?.firstName || 'HR') + '! Here\'s your team summary.' },
    employees:    { title: 'Employee Directory',         sub: 'Manage your organization\'s workforce.' },
    wellness:     { title: 'Wellness Analytics',         sub: 'Organization-wide health insights.' },
    productivity: { title: 'Productivity Tracker',       sub: 'Analyse employee working hours, sessions, start & end times and performance.' },
    leaves:       { title: 'Leave Management',           sub: 'Review and manage employee leave requests.' },
    replies:      { title: 'HR Replies',                 sub: 'Reply to employee leave requests, send supportive wellness notes, and feedback on productivity.' },
    profile:      { title: 'My Profile & Settings',      sub: 'Manage your account, change password, select theme, and view tier details.' },
  };

  // Fetch data from Firestore
  useEffect(() => {
    setLoadingData(true);
    // Employees
    const unsubEmp = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'employee')),
      (snap) => setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    // Wellness logs
    const unsubWell = onSnapshot(
      query(collection(db, 'wellness_logs'), orderBy('createdAt', 'desc')),
      (snap) => { setWellnessLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingData(false); }
    );
    // Leave requests
    const unsubLeave = onSnapshot(
      query(collection(db, 'leave_requests'), orderBy('createdAt', 'desc')),
      (snap) => setLeaveRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    // Work sessions
    const unsubWork = onSnapshot(
      query(collection(db, 'work_sessions'), orderBy('createdAt', 'desc')),
      (snap) => setWorkSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubEmp(); unsubWell(); unsubLeave(); unsubWork(); };
  }, []);

  const handleUpdateLeave = async (leaveId, status, hrReply = '') => {
    try {
      await updateDoc(doc(db, 'leave_requests', leaveId), {
        status,
        hrReply,
        reviewedBy: userProfile?.uid,
        reviewedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating leave:', err);
    }
  };

  const meta = tabMeta[activeTab] || tabMeta.overview;

  return (
    <div className="dashboard-layout hr-theme">
      <HRSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        logout={logout}
      />

      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h2>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>
          <div className="dashboard-header-right">
            <div className="header-date-chip">
              <Clock size={12} />
              {todayStr()}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">
          {loadingData ? (
            <div className="empty-state">
              <div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTopColor:'var(--hr-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <p className="empty-state-text">Loading data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview'     && <OverviewTab employees={employees} leaveRequests={leaveRequests} wellnessLogs={wellnessLogs} />}
              {activeTab === 'employees'    && <EmployeesTab employees={employees} onSelectEmployee={setSelectedEmployee} />}
              {activeTab === 'wellness'     && <WellnessTab employees={employees} wellnessLogs={wellnessLogs} />}
              {activeTab === 'productivity' && <ProductivityTab employees={employees} workSessions={workSessions} />}
              {activeTab === 'leaves'       && <LeavesTab leaveRequests={leaveRequests} employees={employees} onUpdateLeave={handleUpdateLeave} />}
              {activeTab === 'replies'      && <RepliesTab employees={employees} workSessions={workSessions} wellnessLogs={wellnessLogs} leaveRequests={leaveRequests} onUpdateLeave={handleUpdateLeave} />}
              {activeTab === 'profile'      && <HRProfileTab userProfile={userProfile} />}
            </>
          )}
        </div>
      </main>

      {/* Slide-out Employee profile view */}
      {selectedEmployee && (
        <EmployeeProfileDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          wellnessLogs={wellnessLogs.filter((l) => l.uid === selectedEmployee.uid)}
          leaveRequests={leaveRequests.filter((l) => l.employeeUid === selectedEmployee.uid)}
        />
      )}
    </div>
  );
}
