import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/dashboard.css';
import { useAuth } from '../context/AuthContext';
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  LogOut, Clock, Heart, Activity,
  Moon, Footprints, SmilePlus, Send,
  CheckCircle, Calendar, User, TrendingUp,
  Camera, Play, Pause, Square, Zap, Target, BarChart2, AlertTriangle,
  MessageSquare, Award, Sparkles, LayoutDashboard
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function todayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function calcWellnessScore({ mood, stress, sleepHours, steps }) {
  const moodScore    = (mood / 5) * 25;
  const stressScore  = ((10 - stress) / 10) * 25;
  const sleepScore   = Math.min(sleepHours / 8, 1) * 25;
  const stepsScore   = Math.min(steps / 10000, 1) * 25;
  return Math.round(moodScore + stressScore + sleepScore + stepsScore);
}

function getWellnessClass(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}


// ─── Sidebar ─────────────────────────────────────────────────────────────────
function EmpSidebar({ activeTab, setActiveTab, userProfile, logout }) {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'today',    icon: <Heart size={18} />, label: 'Wellness Today' },
    { id: 'work',     icon: <Zap size={18} />, label: 'Productivity Tracker' },
    { id: 'calendar', icon: <Calendar size={18} />, label: 'Wellness Calendar' },
    { id: 'history',  icon: <TrendingUp size={18} />, label: 'My Trends' },
    { id: 'leave',    icon: <Clock size={18} />, label: 'Leave Request' },
    { id: 'replies',  icon: <MessageSquare size={18} />, label: 'HR Replies' },
    { id: 'profile',  icon: <User size={18} />, label: 'My Profile' },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <span className="sidebar-logo-text">Self Wellness</span>
        <span className="sidebar-logo-badge emp">ME</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">My Workspace</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active emp-active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            id={`emp-nav-${item.id}`}
          >
            <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials(userProfile?.fullName || 'U')}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{userProfile?.fullName || 'Employee'}</div>
          <div className="sidebar-user-role">{userProfile?.department || 'Employee'}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout} title="Logout" id="emp-logout-btn">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}


// ─── AICoach Component ────────────────────────────────────────────────────────
function AICoach({ wellnessLogs, workSessions, userProfile }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${userProfile?.firstName || 'there'}! I am your AI Wellness Assistant. I analyze your logs to help you balance wellness and productivity. How can I assist you today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const prompts = [
    "Check my wellness status",
    "Reduce workday screen strain",
    "How can I manage high stress?",
    "Tips for better sleep"
  ];

  const generateDynamicSuggestion = (queryText) => {
    const lastLog = wellnessLogs?.[0];
    const completedSessions = workSessions?.filter(s => s.status === 'completed') || [];
    const totalDistractions = completedSessions.reduce((acc, curr) => acc + (curr.distractionsCount || 0), 0);

    const q = queryText.toLowerCase();

    if (q.includes('status') || q.includes('check') || q.includes('analysis')) {
      if (!lastLog) {
        return "I don't see any wellness logs for you yet. Please head over to 'Wellness Today' and log your mood, stress levels, sleep, and steps so I can provide a personalized health assessment!";
      }
      let feedback = `Based on your last log on ${lastLog.date}:\n`;
      feedback += `• Wellness Score: ${lastLog.wellnessScore}%\n`;
      feedback += `• Mood: ${lastLog.mood}/5 · Stress: ${lastLog.stress}/10 · Sleep: ${lastLog.sleepHours}h · Steps: ${lastLog.steps.toLocaleString()}\n\n`;

      if (lastLog.stress > 6) {
        feedback += "⚠️ Your stress levels are quite high. I highly suggest trying box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s) or scheduling a 15-minute screen-free coffee break.\n";
      }
      if (lastLog.sleepHours < 7) {
        feedback += "⚠️ You logged under 7 hours of sleep. Try to limit screen exposure 1 hour before bed and maintain a consistent dark, cool sleeping space.\n";
      }
      if (lastLog.steps < 6000) {
        feedback += "⚠️ Steps logged are low. A quick 10-minute stretch or walk after lunch will boost circulation and release endorphins.\n";
      }
      if (lastLog.stress <= 6 && lastLog.sleepHours >= 7 && lastLog.steps >= 6000) {
        feedback += "🎉 Outstanding! Your health metrics are well-balanced. Keep up the consistent hydration and daily mobility.";
      }
      return feedback;
    }

    if (q.includes('strain') || q.includes('eye') || q.includes('screen') || q.includes('fatigue')) {
      return "To reduce digital eye strain, practice the 20-20-20 rule: every 20 minutes, look at an object 20 feet away for at least 20 seconds. Also, ensure your monitor is at eye level and use a warm lighting setting (night light mode) during evening hours.";
    }

    if (q.includes('stress') || q.includes('relax') || q.includes('anxiety') || q.includes('breathing')) {
      return "When experiencing peak stress, try this quick 3-minute somatic reset:\n1. Sit comfortably with your spine upright.\n2. Inhale deeply through your nose for 4 seconds.\n3. Hold your breath for 4 seconds.\n4. Exhale slowly through your mouth for 6 seconds.\n5. Repeat 4 times. This immediately triggers the parasympathetic nervous system to reduce heart rate.";
    }

    if (q.includes('sleep') || q.includes('night') || q.includes('insomnia') || q.includes('rest')) {
      return "For deep, restorative sleep, try these guidelines:\n• Sleep Hygiene: Dim room lights 1 hour before bed and avoid scrolling on your phone.\n• Temperature: Keep your bedroom cool (around 18-20°C/65-68°F).\n• Nutrition: Avoid heavy meals or caffeine within 4-6 hours of sleep.\n• Consistency: Sleep and wake at the same times, even on weekends.";
    }

    return "That's an interesting wellness question! To support your workday health: ensure you drink water hourly, stand up and stretch every 90 minutes, and write down 3 things you are grateful for today. Let me know if you would like specific suggestions on sleep, steps, stress, or productivity!";
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateDynamicSuggestion(text);
      setMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, marginBottom: 4 }}>
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--emp-primary)' }} /> AI Wellness Coach
        </span>
        <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>Active Assistant</span>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8,
        height: 250,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: m.sender === 'user' ? 'var(--emp-gradient)' : 'rgba(255,255,255,0.04)',
            border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: m.sender === 'user' ? '#ffffff' : 'var(--gray-200)',
            lineHeight: 1.4,
            whiteSpace: 'pre-line',
            textAlign: 'left'
          }}>
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '8px 12px',
            fontSize: '0.78rem',
            color: 'var(--gray-400)',
            fontStyle: 'italic'
          }}>
            AI Coach is typing...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSend(p)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'var(--gray-300)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: '0.68rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask your wellness coach a question..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.78rem',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--gray-100)'
          }}
        />
        <button
          type="button"
          onClick={() => handleSend(inputValue)}
          style={{
            background: 'var(--emp-gradient)',
            border: 'none',
            color: '#ffffff',
            borderRadius: 6,
            padding: '0 16px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Tab (Workspace Hub) ──────────────────────────────────────────
function DashboardTab({ userProfile, wellnessLogs, workSessions, leaveRequests, setActiveTab }) {
  const today = todayKey();
  const todayLog = wellnessLogs.find((l) => l.date === today);
  const completedToday = workSessions.filter(s => s.status === 'completed' && s.date === today);
  const totalMsToday = completedToday.reduce((acc, curr) => acc + (curr.totalDurationMs || 0), 0);
  const hoursToday = (totalMsToday / 3600000).toFixed(1);
  const distractionsToday = completedToday.reduce((acc, curr) => acc + (curr.distractionsCount || 0), 0);
  
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;

  const quickLinks = [
    { id: 'today',    label: 'Wellness Logger',   desc: 'Log daily health metrics', icon: <Heart size={20} style={{ color: 'var(--emp-primary)' }} /> },
    { id: 'work',     label: 'Productivity Tracker', desc: 'Manage your focus hours', icon: <Zap size={20} style={{ color: '#f59e0b' }} /> },
    { id: 'calendar', label: 'Wellness Calendar',   desc: 'View logs & leave schedule', icon: <Calendar size={20} style={{ color: '#10b981' }} /> },
    { id: 'history',  label: 'My Trends',          desc: 'Visualize metrics graphs', icon: <TrendingUp size={20} style={{ color: '#8b5cf6' }} /> },
    { id: 'leave',    label: 'Leave Requests',     desc: 'Request time off & track', icon: <Clock size={20} style={{ color: '#ec4899' }} /> },
    { id: 'replies',  label: 'HR Feedback',        desc: 'Read direct HR messages', icon: <MessageSquare size={20} style={{ color: '#06b6d4' }} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card border-glow" style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(29,78,216,0.04) 100%)',
        padding: '24px 30px',
        borderRadius: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        textAlign: 'left'
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-50)', marginBottom: 6 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {userProfile?.firstName || 'Employee'}!
          </h2>
          <p style={{ color: 'var(--gray-300)', fontSize: '0.875rem' }}>
            Welcome to your Self Wellness workspace. Keep track of your daily routine and health goals in one place.
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '12px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Status</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emp-primary)', marginTop: 2 }}>
            {todayLog ? 'Logged Today' : 'Awaiting Log'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Wellness Score', val: todayLog ? `${todayLog.wellnessScore}%` : '—', sub: 'Today\'s level' },
              { label: 'Focus Hours', val: `${hoursToday}h`, sub: `${distractionsToday} distractions` },
              { label: 'Pending Leaves', val: pendingLeaves, sub: 'Awaiting HR review' }
            ].map((m, idx) => (
              <div key={idx} className="stat-card" style={{ padding: 14, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-100)', marginBottom: 4 }}>{m.val}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--gray-500)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-header" style={{ marginBottom: 16, textAlign: 'left' }}><span className="section-title">My Workspaces</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {quickLinks.map((link) => (
                <div
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                  className="quick-workspace-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {link.icon}
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-100)' }}>{link.label}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', textAlign: 'left' }}>{link.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AICoach wellnessLogs={wellnessLogs} workSessions={workSessions} userProfile={userProfile} />
      </div>
    </div>
  );
}

// ─── Today's Wellness Logger ──────────────────────────────────────────────────
function TodayTab({ userProfile, wellnessLogs, workSessions }) {
  const [mood,       setMood]       = useState(3);
  const [stress,     setStress]     = useState(5);
  const [sleep,      setSleep]      = useState(7);
  const [steps,      setSteps]      = useState(5000);
  const [notes,      setNotes]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const { currentUser } = useAuth();
  const today = todayKey();

  // Check if already logged today
  const todayLog = wellnessLogs.find((l) => l.date === today);

  const moodOptions = [
    { value:1, label:'Bad' },
    { value:2, label:'Poor' },
    { value:3, label:'Okay' },
    { value:4, label:'Good' },
    { value:5, label:'Great' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const score = calcWellnessScore({ mood, stress, sleepHours: sleep, steps });
      await addDoc(collection(db, 'wellness_logs'), {
        uid: currentUser.uid,
        date: today,
        mood,
        stress,
        sleepHours: sleep,
        steps,
        notes,
        wellnessScore: score,
        createdAt: serverTimestamp(),
      });
      // Update user's overall wellness score
      await updateDoc(doc(db, 'users', currentUser.uid), {
        wellnessScore: score,
      });
      setSubmitted(true);
    } catch (err) {
      setErrorMsg('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const todayScore = todayLog ? todayLog.wellnessScore : null;

  const healthTips = [
    { title:'Stay Hydrated',     text:'Drink at least 8 glasses of water today to stay energized and focused.' },
    { title:'Take Short Breaks', text:'Every 90 minutes, take a 5-10 min break to reduce stress and boost productivity.' },
    { title:'Walk More',          text:'A short 10-minute walk after lunch can improve mood and blood sugar levels.' },
    { title:'Eat Balanced Meals', text:'Include proteins, healthy fats, and complex carbs in every meal for sustained energy.' },
  ];

  if (submitted || todayLog) {
    const log = todayLog || { mood, stress, sleepHours: sleep, steps, wellnessScore: calcWellnessScore({ mood, stress, sleepHours: sleep, steps }) };
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {/* Already logged */}
        <div className="card" style={{ textAlign:'center', padding:'36px 24px' }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'var(--gray-100)', marginBottom:8 }}>
            Today's Wellness Logged!
          </h3>
          <p style={{ color:'var(--gray-400)', fontSize:'0.875rem', marginBottom:24 }}>
            Great job taking care of yourself today. Check back tomorrow!
          </p>

          {/* Score ring */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
            <div style={{
              width:120, height:120, borderRadius:'50%',
              background:`conic-gradient(#10b981 ${(log.wellnessScore||0)*3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 32px rgba(16,185,129,0.3)'
            }}>
              <div style={{
                width:96, height:96, borderRadius:'50%',
                background:'var(--gray-900)', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center'
              }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:800, color:'var(--gray-100)' }}>{log.wellnessScore}%</span>
                <span style={{ fontSize:'0.65rem', color:'var(--gray-500)' }}>Wellness</span>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
            {[
              { label:'Mood',   val:`${log.mood}/5` },
              { label:'Stress', val:`${log.stress}/10` },
              { label:'Sleep',  val:`${log.sleepHours}h` },
              { label:'Steps',  val:(log.steps||0).toLocaleString() },
            ].map((m) => (
              <div key={m.label} style={{ textAlign:'center', minWidth:70 }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--gray-200)', fontSize:'0.9rem' }}>{m.val}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--gray-600)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic AI Wellness Coach */}
        <AICoach wellnessLogs={wellnessLogs} workSessions={workSessions} userProfile={userProfile} />
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Greeting */}
      <div className="card" style={{ background:'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(16,185,129,0.08))', borderColor:'rgba(14,165,233,0.2)' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontWeight:700, color:'var(--gray-100)', marginBottom:6 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {userProfile?.firstName}!
        </h3>
        <p style={{ color:'var(--gray-400)', fontSize:'0.85rem' }}>
          How are you feeling today? Log your daily wellness metrics below.
        </p>
      </div>

      {/* Loggers */}
      <div className="wellness-logger">
        {/* Mood */}
        <div className="logger-metric-card">
          <div className="logger-metric-header">
            <div className="logger-metric-icon" style={{ background:'rgba(245,158,11,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><SmilePlus size={20} style={{ color: '#f59e0b' }} /></div>
            <div>
              <div className="logger-metric-title">Mood</div>
              <div className="logger-metric-sub">How are you feeling?</div>
            </div>
          </div>
          <div className="mood-selector">
            {moodOptions.map((m) => (
              <button key={m.value} className={`mood-btn ${mood === m.value ? 'selected' : ''}`}
                onClick={() => setMood(m.value)} id={`mood-btn-${m.value}`}>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stress */}
        <div className="logger-metric-card">
          <div className="logger-metric-header">
            <div className="logger-metric-icon" style={{ background:'rgba(239,68,68,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={20} style={{ color: '#ef4444' }} /></div>
            <div>
              <div className="logger-metric-title">Stress Level</div>
              <div className="logger-metric-sub">1 = Relaxed · 10 = Very Stressed</div>
            </div>
          </div>
          <div className="metric-slider-wrap">
            <input type="range" min={1} max={10} value={stress} id="stress-slider"
              onChange={(e) => setStress(Number(e.target.value))} className="metric-slider" />
            <div className="metric-slider-labels">
              <span>Relaxed</span>
              <span className={`metric-value-display ${stress >= 7 ? 'text-gradient-hr' : stress >= 4 ? '' : 'text-gradient-emp'}`}
                style={{ fontSize:'1.4rem', margin:'0 auto' }}>
                {stress}
              </span>
              <span>Stressed</span>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className="logger-metric-card">
          <div className="logger-metric-header">
            <div className="logger-metric-icon" style={{ background:'rgba(99,102,241,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Moon size={20} style={{ color: '#6366f1' }} /></div>
            <div>
              <div className="logger-metric-title">Sleep Hours</div>
              <div className="logger-metric-sub">Last night's sleep</div>
            </div>
          </div>
          <div className="metric-number-input">
            <button className="metric-num-btn" onClick={() => setSleep(Math.max(0, sleep - 0.5))} id="sleep-dec">−</button>
            <div>
              <div className="metric-num-value" style={{ fontSize:'2rem' }}>{sleep}</div>
              <div className="metric-num-unit" style={{ textAlign:'center' }}>hours</div>
            </div>
            <button className="metric-num-btn" onClick={() => setSleep(Math.min(12, sleep + 0.5))} id="sleep-inc">+</button>
          </div>
        </div>

        {/* Steps */}
        <div className="logger-metric-card">
          <div className="logger-metric-header">
            <div className="logger-metric-icon" style={{ background:'rgba(16,185,129,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Footprints size={20} style={{ color: '#10b981' }} /></div>
            <div>
              <div className="logger-metric-title">Steps Today</div>
              <div className="logger-metric-sub">Goal: 10,000 steps</div>
            </div>
          </div>
          <div className="metric-slider-wrap">
            <input type="range" min={0} max={20000} step={500} value={steps} id="steps-slider"
              onChange={(e) => setSteps(Number(e.target.value))} className="metric-slider" />
            <div className="metric-slider-labels">
              <span>0</span>
              <span className="metric-value-display text-gradient-emp" style={{ fontSize:'1.4rem', margin:'0 auto' }}>
                {steps.toLocaleString()}
              </span>
              <span>20K</span>
            </div>
          </div>
          {/* Progress toward goal */}
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'var(--gray-600)', marginBottom:4 }}>
              <span>Progress</span>
              <span>{Math.min(100, Math.round(steps/100))}% of goal</span>
            </div>
            <div className="wellness-bar">
              <div className="wellness-bar-fill high" style={{ width:`${Math.min(100, steps/100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <label className="dash-label" htmlFor="wellness-notes">Notes for today</label>
        <textarea id="wellness-notes" className="dash-textarea" rows={3}
          placeholder="How was your day? Any particular challenges or achievements?"
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* Preview Score */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:'0.85rem', color:'var(--gray-400)' }}>Predicted wellness score:</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800 }}
            className="text-gradient-emp">
            {calcWellnessScore({ mood, stress, sleepHours: sleep, steps })}%
          </div>
        </div>
        {errorMsg && <p className="form-error">⚠ {errorMsg}</p>}
        <button className="log-submit-btn" onClick={handleSubmit} disabled={submitting} id="log-submit-btn">
          {submitting
            ? <><span className="btn-spinner" style={{ width:16,height:16 }} />Saving...</>
            : <><Send size={16} />Save Today's Log</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── My Trends Tab ────────────────────────────────────────────────────────────
function HistoryTab({ wellnessLogs }) {
  const last7 = wellnessLogs.slice(0, 7).reverse();

  const avgScore  = last7.length ? Math.round(last7.reduce((s, l) => s + (l.wellnessScore||0), 0) / last7.length) : 0;
  const avgMood   = last7.length ? (last7.reduce((s, l) => s + (l.mood||0), 0) / last7.length).toFixed(1) : 0;
  const avgSleep  = last7.length ? (last7.reduce((s, l) => s + (l.sleepHours||0), 0) / last7.length).toFixed(1) : 0;
  const avgSteps  = last7.length ? Math.round(last7.reduce((s, l) => s + (l.steps||0), 0) / last7.length) : 0;
  const avgStress = last7.length ? (last7.reduce((s, l) => s + (l.stress||0), 0) / last7.length).toFixed(1) : 0;

  // Streak calculation
  const sortedDates = wellnessLogs.map((l) => l.date).sort().reverse();
  let streak = 0;
  const today = todayKey();
  let check = today;
  for (const date of sortedDates) {
    if (date === check) { streak++; const d = new Date(check); d.setDate(d.getDate()-1); check = d.toISOString().split('T')[0]; }
    else if (date < check) break;
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Summary */}
      <div className="analytics-grid">
        {[
          { label:'Wellness Score', value:`${avgScore}%`, sub:'7-day avg' },
          { label:'Avg Mood',       value:`${avgMood}/5`, sub:'7-day avg' },
          { label:'Avg Sleep',      value:`${avgSleep}h`, sub:'7-day avg' },
          { label:'Avg Steps',      value:avgSteps.toLocaleString(), sub:'7-day avg' },
          { label:'Avg Stress',     value:`${avgStress}/10`, sub:'Lower is better' },
          { label:'Current Streak', value:`${streak}d`, sub:'Days logged' },
        ].map((c, i) => (
          <div className="analytics-card animate-in" key={i}>
            <div className="analytics-card-value">{c.value}</div>
            <div className="analytics-card-label">{c.label}</div>
            <div style={{ fontSize:'0.68rem', color:'var(--gray-600)', marginTop:2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {last7.length > 0 && (
        <div className="card">
          <div className="section-header"><span className="section-title">7-Day Wellness Score</span></div>
          <div className="chart-bars">
            {last7.map((log, i) => {
              const h = Math.max(6, (log.wellnessScore / 100) * 100);
              const color = log.wellnessScore >= 70 ? '#10b981' : log.wellnessScore >= 40 ? '#f59e0b' : '#ef4444';
              return (
                <div className="chart-bar-group" key={i}>
                  <div className="chart-bar" style={{ height:`${h}%`, background:color, opacity:0.8, borderRadius:'4px 4px 0 0' }} />
                  <span className="chart-bar-label">{log.date?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Log Table */}
      <div className="card">
        <div className="section-header"><span className="section-title">Log History</span></div>
        {wellnessLogs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No logs yet. Start by logging today's wellness!</p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mood</th>
                  <th>Stress</th>
                  <th>Sleep</th>
                  <th>Steps</th>
                  <th>Score</th>
                  <th>HR Reply</th>
                </tr>
              </thead>
              <tbody>
                {wellnessLogs.slice(0, 14).map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.mood}/5</td>
                    <td><span className={`badge ${log.stress>7?'badge-rejected':log.stress>4?'badge-pending':'badge-approved'}`}>{log.stress}/10</span></td>
                    <td>{log.sleepHours}h</td>
                    <td>{(log.steps||0).toLocaleString()}</td>
                    <td>
                      <div className="wellness-bar-wrap">
                        <div className="wellness-bar">
                          <div className={`wellness-bar-fill ${log.wellnessScore>=70?'high':log.wellnessScore>=40?'medium':'low'}`}
                            style={{ width:`${log.wellnessScore}%` }} />
                        </div>
                        <span className="wellness-score-num">{log.wellnessScore}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-300)', fontStyle: log.hrReply ? 'normal' : 'italic' }}>
                      {log.hrReply || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="card">
        <div className="section-header"><span className="section-title">Achievements</span></div>
        <div className="streak-row">
          {[
            { icon: <Heart size={18} style={{ color: '#ec4899' }} />, label:'Streak',     count:`${streak} days`,         unlocked: streak > 0 },
            { icon: <Footprints size={18} style={{ color: '#10b981' }} />, label:'Step Master', count:'10K steps',               unlocked: wellnessLogs.some((l) => l.steps >= 10000) },
            { icon: <Moon size={18} style={{ color: '#6366f1' }} />, label:'Sleep Pro',  count:'8h sleep',                unlocked: wellnessLogs.some((l) => l.sleepHours >= 8) },
            { icon: <Activity size={18} style={{ color: '#ef4444' }} />, label:'Zen Mode',   count:'Low stress',              unlocked: wellnessLogs.some((l) => l.stress <= 3) },
            { icon: <Award size={18} style={{ color: '#f59e0b' }} />, label:'Wellness Star','count':'Score 90+',           unlocked: wellnessLogs.some((l) => l.wellnessScore >= 90) },
          ].map((b, i) => (
            <div className="streak-badge-item" key={i} style={{ opacity: b.unlocked ? 1 : 0.35 }}>
              <span className="badge-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{b.icon}</span>
              <div>
                <div style={{ fontSize:'0.78rem', fontWeight:600 }}>{b.label}</div>
                <div style={{ fontSize:'0.65rem', color:'var(--gray-500)' }}>{b.count}</div>
              </div>
              {b.unlocked && <span className="badge badge-approved" style={{ marginLeft:4 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── HR Replies Tab ──────────────────────────────────────────────────────────
function RepliesTab({ leaveRequests, wellnessLogs, workSessions }) {
  const leaveReplies = useMemo(() => leaveRequests.filter(r => r.hrReply), [leaveRequests]);
  const wellnessReplies = useMemo(() => wellnessLogs.filter(w => w.hrReply), [wellnessLogs]);
  const productivityReplies = useMemo(() => workSessions.filter(s => s.hrReply && s.status === 'completed'), [workSessions]);

  const hasReplies = leaveReplies.length > 0 || wellnessReplies.length > 0 || productivityReplies.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <div className="section-header">
          <span className="section-title">HR Messages and Feedback</span>
        </div>
        {!hasReplies ? (
          <div className="empty-state">
            <p className="empty-state-text">No replies from HR yet. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {leaveReplies.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--hr-primary)', marginBottom: 10, fontWeight: 600 }}>Leave Request Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leaveReplies.map((r) => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 14, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-200)' }}>{r.type} ({r.startDate} to {r.endDate})</span>
                        <span className={`badge badge-${r.status}`}>{r.status}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 6 }}>Reason: {r.reason}</div>
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', padding: 10, borderRadius: 6, fontSize: '0.8rem', color: 'var(--gray-200)' }}>
                        <strong>HR Reply:</strong> {r.hrReply}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wellnessReplies.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--hr-primary)', marginBottom: 10, fontWeight: 600 }}>Wellness Log Feedback</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wellnessReplies.map((w) => (
                    <div key={w.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 14, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-200)' }}>Log Date: {w.date}</span>
                        <span className="badge badge-approved">Score: {w.wellnessScore}%</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 6 }}>Notes: {w.notes || 'No log notes'}</div>
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', padding: 10, borderRadius: 6, fontSize: '0.8rem', color: 'var(--gray-200)' }}>
                        <strong>HR Support Note:</strong> {w.hrReply}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productivityReplies.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--hr-primary)', marginBottom: 10, fontWeight: 600 }}>Productivity Feedback</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {productivityReplies.map((s) => (
                    <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 14, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-200)' }}>Goal: {s.focusGoal || 'General Focus Session'} ({s.date})</span>
                        <span className="badge badge-approved">Score: {s.focusScore}%</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 6 }}>Duration: {(s.totalDurationMs / 60000).toFixed(0)} mins</div>
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', padding: 10, borderRadius: 6, fontSize: '0.8rem', color: 'var(--gray-200)' }}>
                        <strong>HR Feedback:</strong> {s.hrReply}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Leave Request Tab ────────────────────────────────────────────────────────
function LeaveTab({ userProfile, leaveRequests }) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ type:'Annual Leave', startDate:'', endDate:'', reason:'' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.endDate < form.startDate) {
      setError('End date cannot be before start date.'); return;
    }
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'leave_requests'), {
        employeeUid: currentUser.uid,
        employeeName: userProfile?.fullName || '',
        department: userProfile?.department || '',
        ...form,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setForm({ type:'Annual Leave', startDate:'', endDate:'', reason:'' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const myRequests = leaveRequests.filter((l) => l.employeeUid === currentUser?.uid);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Form */}
      <div className="card">
        <div className="section-header"><span className="section-title">Apply for Leave</span></div>

        {success && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(16,185,129,0.1)', borderRadius:8, border:'1px solid rgba(16,185,129,0.25)', marginBottom:16, fontSize:'0.875rem', color:'#34d399' }}>
            <CheckCircle size={16} /> Leave request submitted successfully! Your HR will review it soon.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="leave-form">
            <div>
              <label className="dash-label">Leave Type *</label>
              <select className="dash-select" value={form.type} onChange={(e) => up('type', e.target.value)} id="leave-type">
                {['Annual Leave','Sick Leave','Casual Leave','Maternity/Paternity Leave','Emergency Leave','Work From Home'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="dash-label" htmlFor="leave-start">Start Date *</label>
                <input type="date" id="leave-start" className="dash-input"
                  value={form.startDate} onChange={(e) => up('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="dash-label" htmlFor="leave-end">End Date *</label>
                <input type="date" id="leave-end" className="dash-input"
                  value={form.endDate} onChange={(e) => up('endDate', e.target.value)}
                  min={form.startDate || new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="leave-form-full">
              <label className="dash-label" htmlFor="leave-reason">Reason *</label>
              <textarea id="leave-reason" className="dash-textarea" rows={3}
                placeholder="Please provide a brief reason for your leave request..."
                value={form.reason} onChange={(e) => up('reason', e.target.value)} />
            </div>
          </div>

          {error && <p className="form-error" style={{ marginTop:12 }}>⚠ {error}</p>}

          <button type="submit" className="log-submit-btn" style={{ marginTop:16 }}
            disabled={submitting} id="leave-submit-btn">
            {submitting
              ? <><span className="btn-spinner" style={{ width:16,height:16 }} />Submitting...</>
              : <><Send size={16} />Submit Leave Request</>
            }
          </button>
        </form>
      </div>

      {/* My Leave History */}
      <div className="card">
        <div className="section-header"><span className="section-title">My Leave History</span></div>
        {myRequests.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No leave requests yet.</p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
               <thead>
                 <tr>
                   <th>Type</th>
                   <th>From</th>
                   <th>To</th>
                   <th>Reason</th>
                   <th>Status</th>
                   <th>HR Reply</th>
                 </tr>
               </thead>
               <tbody>
                 {myRequests.map((req) => (
                   <tr key={req.id}>
                     <td><span className="badge badge-employee">{req.type}</span></td>
                     <td>{req.startDate}</td>
                     <td>{req.endDate}</td>
                     <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.reason}</td>
                     <td>
                       <span className={`badge badge-${req.status}`}>
                         {req.status === 'approved' ? '✓ Approved' : req.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                       </span>
                     </td>
                     <td style={{ color: 'var(--gray-300)', fontStyle: req.hrReply ? 'normal' : 'italic' }}>
                       {req.hrReply || '—'}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ userProfile }) {
  const { uploadPhoto, changePassword, deleteAccount, logout } = useAuth();
  const fileRef = useRef();
  const [uploading,    setUploading]    = useState(false);
  const [photoURL,     setPhotoURL]     = useState(userProfile?.photoURL || '');
  const [newPwd,       setNewPwd]       = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [pwdStatus,    setPwdStatus]    = useState('');   // 'success'|'error'|''
  const [pwdLoading,   setPwdLoading]   = useState(false);
  const [deleteConfirm,setDeleteConfirm]= useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [theme,        setTheme]        = useState(() => localStorage.getItem('sw_theme') || 'default');

  // Apply theme class to dashboard root on mount + change
  useEffect(() => {
    const root = document.querySelector('.dashboard-layout');
    if (!root) return;
    ['theme-onyx','theme-glass','theme-light'].forEach(c => root.classList.remove(c));
    if (theme !== 'default') root.classList.add(`theme-${theme}`);
    localStorage.setItem('sw_theme', theme);
  }, [theme]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const url = await uploadPhoto(file); setPhotoURL(url); }
    catch (err) { console.error('Photo upload failed:', err); }
    finally { setUploading(false); }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) { setPwdStatus('error:Min 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdStatus('error:Passwords do not match.'); return; }
    setPwdLoading(true);
    try {
      await changePassword(newPwd);
      setPwdStatus('success');
      setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdStatus(`error:${err.message || 'Failed. You may need to re-login.'}`);
    } finally { setPwdLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteAccount(); await logout(); }
    catch (err) { alert(err.message || 'Delete failed. Please re-login and try again.'); }
    finally { setDeleting(false); setDeleteConfirm(false); }
  };

  const themes = [
    { key: 'default', label: 'Dark Premium',       desc: 'Deep navy with ambient glow orbs' },
    { key: 'onyx',    label: 'Onyx Black',          desc: 'Pure black, ultra-minimalist flat cards' },
    { key: 'glass',   label: 'Glassmorphic Navy',   desc: 'Translucent frosted panes on deep navy' },
    { key: 'light',   label: 'Light Professional',  desc: 'Clean white cards on soft slate background' },
  ];

  const fields = [
    { label:'Full Name',    value: userProfile?.fullName   },
    { label:'Email',        value: userProfile?.email      },
    { label:'Phone',        value: userProfile?.phone      },
    { label:'Department',   value: userProfile?.department },
    { label:'Employee ID',  value: userProfile?.employeeId },
    { label:'Role',         value: 'Employee'              },
    { label:'Status',       value: userProfile?.status || 'Active' },
    { label:'Member Since', value: userProfile?.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—' },
  ];

  const sectionStyle = { display:'flex', flexDirection:'column', gap:20 };
  const labelStyle   = { fontSize:'0.72rem', color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight:600 };
  const cardStyle    = { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'20px 24px' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Profile Info Card */}
      <div className="card">
        <div className="section-header"><span className="section-title">My Profile</span></div>
        <div className="profile-section">
          <div className="profile-avatar-area">
            <div className="profile-avatar-large">
              {photoURL ? <img src={photoURL} alt="Profile" /> : initials(userProfile?.fullName || 'U')}
            </div>
            <button className="profile-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading} id="photo-upload-btn">
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }} />
          </div>
          <div className="profile-fields">
            {fields.map((f) => (
              <div className="profile-field" key={f.label}>
                <div className="profile-field-label">{f.label}</div>
                <div className="profile-field-value">{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier Details */}
      <div style={{ ...cardStyle, background:'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)', border:'1px solid rgba(59,130,246,0.18)' }}>
        <div style={labelStyle}>Subscription Tier</div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Award size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--gray-50)' }}>Professional Premium</div>
            <div style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginTop:2 }}>Full access to wellness tracking, AI coaching, productivity analytics and leave management.</div>
          </div>
          <span className="badge badge-approved" style={{ marginLeft:'auto', fontSize:'0.65rem', whiteSpace:'nowrap' }}>Active</span>
        </div>
      </div>

      {/* Theme Switcher */}
      <div style={cardStyle}>
        <div style={labelStyle}>Web Theme</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
          {themes.map((t) => (
            <div
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                background: theme === t.key ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                border: theme === t.key ? '1.5px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all 0.2s'
              }}
            >
              <div style={{ fontSize:'0.8rem', fontWeight:600, color: theme === t.key ? 'var(--emp-primary)' : 'var(--gray-200)', marginBottom:3 }}>{t.label}</div>
              <div style={{ fontSize:'0.68rem', color:'var(--gray-500)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div style={cardStyle}>
        <div style={labelStyle}>Change Password</div>
        <form onSubmit={handleChangePwd} style={sectionStyle}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:'0.75rem', color:'var(--gray-400)', display:'block', marginBottom:4 }}>New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                placeholder="Min. 8 characters" className="dash-input"
                style={{ width:'100%', padding:'8px 12px', fontSize:'0.8rem', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--gray-100)' }} />
            </div>
            <div>
              <label style={{ fontSize:'0.75rem', color:'var(--gray-400)', display:'block', marginBottom:4 }}>Confirm Password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password" className="dash-input"
                style={{ width:'100%', padding:'8px 12px', fontSize:'0.8rem', borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--gray-100)' }} />
            </div>
          </div>
          {pwdStatus.startsWith('error:') && <p style={{ fontSize:'0.78rem', color:'#ef4444', margin:0 }}>{pwdStatus.slice(6)}</p>}
          {pwdStatus === 'success' && <p style={{ fontSize:'0.78rem', color:'#22c55e', margin:0 }}>Password updated successfully!</p>}
          <div>
            <button type="submit" disabled={pwdLoading}
              style={{ background:'var(--emp-gradient)', border:'none', color:'#fff', borderRadius:6, padding:'8px 20px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
              {pwdLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div style={{ ...cardStyle, border:'1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ ...labelStyle, color:'#ef4444' }}>Danger Zone</div>
        {!deleteConfirm ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--gray-100)' }}>Delete Account</div>
              <div style={{ fontSize:'0.75rem', color:'var(--gray-400)', marginTop:2 }}>Permanently removes your account and all health data. This action cannot be undone.</div>
            </div>
            <button onClick={() => setDeleteConfirm(true)}
              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:6, padding:'8px 16px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
              Delete My Account
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <p style={{ fontSize:'0.82rem', color:'#fca5a5', margin:0 }}>Are you absolutely sure? Your wellness logs, focus sessions, and profile will be permanently erased.</p>
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

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({ wellnessLogs, leaveRequests, workSessions }) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [currentYear, setCurrentYear]   = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }, [currentMonth]);

  const handleToday = useCallback(() => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
    setSelectedDate(todayKey());
  }, []);

  // Memoize calendar cells so they don't rebuild every render
  const cells = useMemo(() => {
    const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const result = [];
    for (let i = 0; i < startDayOfWeek; i++) result.push({ type: 'empty', key: `empty-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const padD   = String(d).padStart(2, '0');
      const padM   = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${padM}-${padD}`;
      result.push({ type: 'day', dayNum: d, dateStr, key: dateStr });
    }
    return result;
  }, [currentYear, currentMonth]);

  // Memoize log and leave lookups for selected date
  const selectedLog = useMemo(
    () => wellnessLogs.find((l) => l.date === selectedDate) || null,
    [wellnessLogs, selectedDate]
  );
  const selectedLeave = useMemo(
    () => leaveRequests.find((r) => r.startDate && r.endDate && r.status === 'approved' && selectedDate >= r.startDate && selectedDate <= r.endDate) || null,
    [leaveRequests, selectedDate]
  );
  const selectedWorkSessions = useMemo(
    () => workSessions.filter((s) => s.date === selectedDate && s.status === 'completed'),
    [workSessions, selectedDate]
  );

  // Build a quick date->log map for O(1) lookup in the grid
  const logByDate = useMemo(() => {
    const map = {};
    wellnessLogs.forEach((l) => { if (l.date) map[l.date] = l; });
    return map;
  }, [wellnessLogs]);

  // Build a quick date->workSessions map for O(1) lookup in the grid
  const workSessionsByDate = useMemo(() => {
    const map = {};
    workSessions.forEach((s) => {
      if (s.date && s.status === 'completed') {
        if (!map[s.date]) map[s.date] = [];
        map[s.date].push(s);
      }
    });
    return map;
  }, [workSessions]);

  const todayDateKey = todayKey();

  return (
    <div className="calendar-split-layout">
      {/* Calendar Grid Card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="calendar-header">
          <div className="calendar-title-wrap">
            <h3 className="calendar-month-title">{monthNames[currentMonth]} {currentYear}</h3>
          </div>
          <div className="calendar-nav-btns">
            <button className="calendar-nav-btn" onClick={handlePrevMonth} title="Previous Month">◀</button>
            <button className="calendar-nav-btn" onClick={handleToday} title="Today">Today</button>
            <button className="calendar-nav-btn" onClick={handleNextMonth} title="Next Month">▶</button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
            <div className="calendar-day-header" key={w}>{w}</div>
          ))}

          {cells.map((cell) => {
            if (cell.type === 'empty') return <div className="calendar-day-cell empty" key={cell.key} />;

            const log    = logByDate[cell.dateStr] || null;
            const leaves = leaveRequests.filter((r) =>
              (r.status === 'approved' || r.status === 'pending') &&
              r.startDate && r.endDate &&
              cell.dateStr >= r.startDate && cell.dateStr <= r.endDate
            );

            // Fetch day work sessions
            const daySessions = workSessionsByDate[cell.dateStr] || [];
            const dayWorkHours = daySessions.reduce((a, s) => a + ((s.totalDurationMs || 0) / 3600000), 0);
            const dayAvgScore = daySessions.length
              ? Math.round(daySessions.reduce((a, s) => a + (s.focusScore || 0), 0) / daySessions.length)
              : 0;

            const isToday    = cell.dateStr === todayDateKey;
            const isSelected = cell.dateStr === selectedDate;
            const score      = log?.wellnessScore ?? null;

            return (
              <div
                className={`calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                key={cell.key}
                onClick={() => setSelectedDate(cell.dateStr)}
              >
                <span className="calendar-day-num">{cell.dayNum}</span>
                <div className="calendar-events-wrap">
                  {score !== null && (
                    <span className={`calendar-score-tag ${getWellnessClass(score)}`}>
                      Score: {score}%
                    </span>
                  )}
                  {dayWorkHours > 0 && (
                    <span className="calendar-leave-banner" style={{
                      background: 'rgba(59,130,246,0.12)',
                      color: '#60a5fa',
                      borderColor: 'rgba(59,130,246,0.2)',
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      Focus: {dayWorkHours.toFixed(1)}h ({dayAvgScore}%)
                    </span>
                  )}
                  {leaves.map((leave, idx) => (
                    <span key={idx} className="calendar-leave-banner" style={{
                      background:   leave.status === 'approved' ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)',
                      color:        leave.status === 'approved' ? '#818cf8' : '#fbbf24',
                      borderColor:  leave.status === 'approved' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)'
                    }}>
                      Leave: {(leave.type || '').split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details Panel */}
      <div className="selected-day-details-panel">
        <div className="card" style={{ height: '100%' }}>
          <div className="section-header" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:12, marginBottom:16 }}>
            <span className="section-title" style={{ fontSize:'0.9rem' }}>
              Summary for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </span>
          </div>

          {selectedLog ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className={`selected-day-score-circle ${getWellnessClass(selectedLog.wellnessScore ?? 0)}`}>
                <span style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--gray-100)' }}>{selectedLog.wellnessScore ?? 0}%</span>
                <span style={{ fontSize:'0.55rem', color:'var(--gray-400)', textTransform:'uppercase' }}>Score</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { title:'Mood',  value:`${selectedLog.mood ?? '—'}/5` },
                  { title:'Stress', value:`${selectedLog.stress ?? '—'}/10` },
                  { title:'Sleep',  value:`${selectedLog.sleepHours ?? '—'}h` },
                  { title:'Steps',  value:(selectedLog.steps ?? 0).toLocaleString() },
                ].map((item) => (
                  <div key={item.title} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', padding:10, borderRadius:8, textAlign:'center' }}>
                    <div style={{ fontSize:'0.7rem', color:'var(--gray-500)', textTransform:'uppercase' }}>{item.title}</div>
                    <div style={{ fontSize:'0.9rem', fontWeight:700, color:'var(--gray-200)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {selectedLog.notes && (
                <div style={{ background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.05)', padding:12, borderRadius:8 }}>
                  <div style={{ fontSize:'0.7rem', color:'var(--gray-500)', textTransform:'uppercase', marginBottom:4 }}>Notes</div>
                  <p style={{ fontSize:'0.8rem', color:'var(--gray-300)', fontStyle:'italic', lineHeight:1.4 }}>"{selectedLog.notes}"</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--gray-500)' }}>
              <p style={{ fontSize:'0.8rem' }}>No wellness log for this date.</p>
            </div>
          )}

          {selectedLeave && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:16, paddingTop:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span className="badge badge-employee" style={{ fontSize:'0.7rem' }}>Leave: {selectedLeave.type || 'Leave'}</span>
                <span className={`badge badge-${selectedLeave.status}`} style={{ fontSize:'0.65rem' }}>{selectedLeave.status}</span>
              </div>
              <div style={{ fontSize:'0.7rem', color:'var(--gray-500)', textTransform:'uppercase', marginBottom:2 }}>Duration</div>
              <div style={{ fontSize:'0.8rem', color:'var(--gray-200)', marginBottom:8 }}>{selectedLeave.startDate} to {selectedLeave.endDate}</div>
              {selectedLeave.reason && (
                <>
                  <div style={{ fontSize:'0.7rem', color:'var(--gray-500)', textTransform:'uppercase', marginBottom:2 }}>Reason</div>
                  <p style={{ fontSize:'0.8rem', color:'var(--gray-400)', lineHeight:1.4 }}>{selectedLeave.reason}</p>
                </>
              )}
            </div>
          )}

          {selectedWorkSessions.length > 0 && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:16, paddingTop:16 }}>
              <div style={{ fontSize:'0.7rem', color:'var(--gray-500)', textTransform:'uppercase', marginBottom:8 }}>Productivity Tracker Sessions</div>
              {selectedWorkSessions.map((session, idx) => {
                const hours = (session.totalDurationMs / 3600000).toFixed(1);
                return (
                  <div key={idx} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', padding:10, borderRadius:8, marginBottom:8 }}>
                    <div style={{ fontWeight: 600, fontSize:'0.82rem', color:'var(--gray-200)' }}>{session.focusGoal || 'General Work Session'}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--gray-400)', marginTop:4 }}>
                      <span>Focus: {hours} hours</span>
                      <span>Score: {session.focusScore}%</span>
                    </div>
                    {session.hrReply && (
                      <div style={{ fontSize:'0.72rem', color:'var(--hr-primary)', marginTop:6, fontStyle:'italic' }}>
                        <strong>HR Feedback:</strong> "{session.hrReply}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Productivity Work Tracker Tab ────────────────────────────────────────────────────────
function WorkTab({ userProfile, workSessions }) {
  const { currentUser } = useAuth();
  const today = todayKey();

  const [elapsedMs, setElapsedMs] = useState(0);
  const [todayCumulativeMs, setTodayCumulativeMs] = useState(0);
  
  // Focus Mode State
  const [focusGoal, setFocusGoal] = useState('');
  const [breakInterval, setBreakInterval] = useState(25); // in minutes — employee-configurable
  const [distractionCount, setDistractionCount] = useState(0);
  const [totalAwaySeconds, setTotalAwaySeconds] = useState(0);
  const [showDistractionAlert, setShowDistractionAlert] = useState(false);
  const [lastDistractionDuration, setLastDistractionDuration] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [isResting, setIsResting] = useState(false); // break active state
  const [breakCountdown, setBreakCountdown] = useState(300); // 5 min break in seconds
  const [lastBreakTimeMs, setLastBreakTimeMs] = useState(0); // tracks when the last break/skip happened in elapsedMs
  
  const activeSession = useMemo(() => {
    return workSessions.find(s => s.status === 'active' || s.status === 'paused');
  }, [workSessions]);

  const todaySessions = useMemo(() => {
    return workSessions.filter(s => s.date === today);
  }, [workSessions, today]);

  // Audio utility using Web Audio API
  const playChime = useCallback((frequency = 440, type = 'sine', duration = 0.5) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.error('Audio chime failed:', err);
    }
  }, []);

  const playBreakChime = useCallback(() => {
    try {
      playChime(523.25, 'sine', 0.4); // C5
      setTimeout(() => playChime(659.25, 'sine', 0.4), 180); // E5
      setTimeout(() => playChime(783.99, 'sine', 0.4), 360); // G5
      setTimeout(() => playChime(1046.50, 'sine', 0.6), 540); // C6
    } catch {}
  }, [playChime]);

  // Sync state if session loads with existing values
  useEffect(() => {
    if (activeSession) {
      setDistractionCount(activeSession.distractionsCount || 0);
      setTotalAwaySeconds(activeSession.totalAwaySeconds || 0);
      if (activeSession.focusGoal) {
        setFocusGoal(activeSession.focusGoal);
      }
    } else {
      setDistractionCount(0);
      setTotalAwaySeconds(0);
      setFocusGoal('');
      setLastBreakTimeMs(0);
    }
    setShowDistractionAlert(false);
    setShowBreakReminder(false);
  }, [activeSession]);

  // Live ticking elapsedMs for active/paused session
  useEffect(() => {
    if (!activeSession) {
      setElapsedMs(0);
      return;
    }

    if (activeSession.status === 'paused') {
      setElapsedMs(activeSession.totalDurationMs || 0);
      return;
    }

    const updateTimer = () => {
      const lastStart = activeSession.clientStartedAt || (activeSession.lastStartedAt?.seconds 
        ? activeSession.lastStartedAt.seconds * 1000 
        : activeSession.lastStartedAt?.toDate?.()?.getTime() || Date.now());
      const currentElapsed = Date.now() - lastStart + (activeSession.totalDurationMs || 0);
      const safeElapsed = Math.max(0, currentElapsed);
      setElapsedMs(safeElapsed);

      // Automated Break Reminder Check
      const currentElapsedMins = safeElapsed / 60000;
      const intervalLimit = Number(breakInterval);
      const minsSinceLastBreak = currentElapsedMins - (lastBreakTimeMs / 60000);
      
      // If we cross the selected threshold, trigger alert
      if (minsSinceLastBreak >= intervalLimit && !showBreakReminder && !isResting) {
        setShowBreakReminder(true);
        playBreakChime();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, breakInterval, showBreakReminder, isResting, playBreakChime, lastBreakTimeMs]);

  // Break countdown timer
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      setBreakCountdown(prev => {
        if (prev <= 1) {
          setIsResting(false);
          playBreakChime();
          handleResumeWork(); // automatically resume work after break is over
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  // Live ticking cumulative Ms for all of today's sessions
  useEffect(() => {
    const updateCumulative = () => {
      let ms = 0;
      todaySessions.forEach(s => {
        if (s.status === 'completed') {
          ms += (s.totalDurationMs || 0);
        } else if (s.status === 'active') {
          const lastStart = s.lastStartedAt?.seconds 
            ? s.lastStartedAt.seconds * 1000 
            : s.lastStartedAt?.toDate?.()?.getTime() || Date.now();
          ms += (Date.now() - lastStart + (s.totalDurationMs || 0));
        } else if (s.status === 'paused') {
          ms += (s.totalDurationMs || 0);
        }
      });
      setTodayCumulativeMs(ms);
    };

    updateCumulative();
    const interval = setInterval(updateCumulative, 1000);
    return () => clearInterval(interval);
  }, [workSessions, todaySessions]);

  // Listen to visibilitychange for deep concentration distraction alerts
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active' || isResting) return;

    let wentAwayAt = null;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wentAwayAt = Date.now();
        playChime(320, 'sawtooth', 0.2); // Play alert warning beep
      } else if (document.visibilityState === 'visible') {
        if (wentAwayAt) {
          const awayMs = Date.now() - wentAwayAt;
          wentAwayAt = null;
          
          const awaySecs = Math.floor(awayMs / 1000) || 1;
          
          setLastDistractionDuration(awaySecs);
          setShowDistractionAlert(true);
          
          // Increment locally
          const newCount = distractionCount + 1;
          const newAway = totalAwaySeconds + awaySecs;
          
          setDistractionCount(newCount);
          setTotalAwaySeconds(newAway);

          // Update active session in Firestore
          updateDoc(doc(db, 'work_sessions', activeSession.id), {
            distractionsCount: newCount,
            totalAwaySeconds: newAway
          }).catch(err => console.error(err));

          playChime(440, 'triangle', 0.4); // Return to page tone
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeSession, distractionCount, totalAwaySeconds, isResting, playChime]);

  const handleStartWork = async () => {
    try {
      playChime(587.33, 'sine', 0.3); // pleasant start sound (D5)
      await addDoc(collection(db, 'work_sessions'), {
        uid: currentUser.uid,
        email: currentUser.email || '',
        date: today,
        startTime: serverTimestamp(),
        endTime: null,
        status: 'active',
        totalDurationMs: 0,
        lastStartedAt: serverTimestamp(),
        clientStartedAt: Date.now(),
        createdAt: serverTimestamp(),
        distractionsCount: 0,
        totalAwaySeconds: 0,
        focusGoal: focusGoal || 'General Work'
      });
    } catch (err) {
      console.error('Error starting work session:', err);
    }
  };

  const handlePauseWork = async () => {
    if (!activeSession || activeSession.status !== 'active') return;
    try {
      playChime(392.00, 'sine', 0.25); // pause sound
      const lastStart = activeSession.clientStartedAt || (activeSession.lastStartedAt?.seconds 
        ? activeSession.lastStartedAt.seconds * 1000 
        : activeSession.lastStartedAt?.toDate?.()?.getTime() || Date.now());
      const addedMs = Date.now() - lastStart;
      const newTotal = (activeSession.totalDurationMs || 0) + addedMs;

      await updateDoc(doc(db, 'work_sessions', activeSession.id), {
        status: 'paused',
        totalDurationMs: newTotal,
        lastStartedAt: null,
        clientStartedAt: null,
        distractionsCount: distractionCount,
        totalAwaySeconds: totalAwaySeconds,
        focusGoal: focusGoal || 'General Work'
      });
    } catch (err) {
      console.error('Error pausing work session:', err);
    }
  };

  const handleResumeWork = async () => {
    if (!activeSession || activeSession.status !== 'paused') return;
    try {
      playChime(587.33, 'sine', 0.25);
      await updateDoc(doc(db, 'work_sessions', activeSession.id), {
        status: 'active',
        lastStartedAt: serverTimestamp(),
        clientStartedAt: Date.now()
      });
    } catch (err) {
      console.error('Error resuming work session:', err);
    }
  };

  const handleStopWork = async () => {
    if (!activeSession) return;
    try {
      playChime(329.63, 'sine', 0.4); // complete sound
      let finalTotal = activeSession.totalDurationMs || 0;
      if (activeSession.status === 'active') {
        const lastStart = activeSession.clientStartedAt || (activeSession.lastStartedAt?.seconds 
          ? activeSession.lastStartedAt.seconds * 1000 
          : activeSession.lastStartedAt?.toDate?.()?.getTime() || Date.now());
        finalTotal += (Date.now() - lastStart);
      }
      
      const score = Math.round(Math.max(0, 100 - (distractionCount * 8) - Math.floor(totalAwaySeconds / 15)));

      await updateDoc(doc(db, 'work_sessions', activeSession.id), {
        status: 'completed',
        endTime: serverTimestamp(),
        totalDurationMs: finalTotal,
        distractionsCount: distractionCount,
        totalAwaySeconds: totalAwaySeconds,
        focusScore: score,
        focusGoal: focusGoal || 'General Focus Session',
        lastStartedAt: null,
        clientStartedAt: null
      });
    } catch (err) {
      console.error('Error completing work session:', err);
    }
  };

  // Simulated distraction alert trigger
  const triggerSimulation = () => {
    playChime(320, 'sawtooth', 0.2);
    setTimeout(() => {
      setLastDistractionDuration(3);
      setShowDistractionAlert(true);
      const newCount = distractionCount + 1;
      const newAway = totalAwaySeconds + 3;
      setDistractionCount(newCount);
      setTotalAwaySeconds(newAway);

      if (activeSession) {
        updateDoc(doc(db, 'work_sessions', activeSession.id), {
          distractionsCount: newCount,
          totalAwaySeconds: newAway
        }).catch(err => console.error(err));
      }
      playChime(440, 'triangle', 0.3);
    }, 800);
  };

  // Format milliseconds to HH:MM:SS
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Format seconds to MM:SS
  const formatCountdown = (secs) => {
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const scs = String(secs % 60).padStart(2, '0');
    return `${mins}:${scs}`;
  };

  const targetHours = 8.0;
  const todayHoursVal = todayCumulativeMs / 3600000;
  const todayHoursStr = todayHoursVal.toFixed(2);
  const todayPercent = Math.min(Math.round((todayHoursVal / targetHours) * 100), 100);

  // Compute live focus score
  const liveFocusScore = Math.max(0, 100 - (distractionCount * 8) - Math.floor(totalAwaySeconds / 15));

  // Calculate past 7 days chart data
  const getLast7DaysData = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const daySess = workSessions.filter(s => s.date === dateStr);
      let ms = 0;
      let scores = [];
      daySess.forEach(s => {
        if (s.status === 'completed') {
          ms += (s.totalDurationMs || 0);
          if (s.focusScore !== undefined) scores.push(s.focusScore);
        }
      });
      const hrs = parseFloat((ms / 3600000).toFixed(2));
      const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;
      list.push({ dateStr, label, hours: hrs, score: avgScore });
    }
    return list;
  };

  const chartData = useMemo(() => getLast7DaysData(), [workSessions]);
  const averageWeeklyHours = useMemo(() => {
    const total = chartData.reduce((acc, curr) => acc + curr.hours, 0);
    return (total / (chartData.filter(d => d.hours > 0).length || 1)).toFixed(2);
  }, [chartData]);

  const startBreakMode = () => {
    setShowBreakReminder(false);
    setIsResting(true);
    setBreakCountdown(300); // 5 min break
    handlePauseWork(); // pause work tracking during break
    setLastBreakTimeMs(elapsedMs);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Distraction Alert Toast Banner */}
      {showDistractionAlert && (
        <div 
          className="notification-banner rejected animate-in"
          style={{ 
            display:'flex', 
            alignItems:'center', 
            justifyContent:'space-between', 
            background:'rgba(239,68,68,0.15)',
            border:'1px solid rgba(239,68,68,0.3)',
            borderRadius:10, 
            padding:'16px 20px',
            boxShadow:'0 8px 32px rgba(239,68,68,0.2)'
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <AlertTriangle size={22} style={{ color: '#f87171' }} />
            <div>
              <div style={{ fontWeight:700, color:'#f87171' }}>Distraction Detected!</div>
              <div style={{ fontSize:'0.78rem', color:'var(--gray-300)', marginTop:2 }}>
                You were away from your focus tab for {lastDistractionDuration} seconds. Let's redirect our attention back to our goal!
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm" 
            style={{ padding:'4px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--gray-200)' }}
            onClick={() => setShowDistractionAlert(false)}
          >
            I'm Refocused
          </button>
        </div>
      )}

      {/* Break Time Dialog Overlay */}
      {showBreakReminder && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(8,13,23,0.85)', backdropFilter:'blur(12px)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:999,
          padding:20
        }}>
          <div className="card border-glow animate-in" style={{ maxWidth:460, padding:32, textAlign:'center', position:'relative' }}>
            <Clock size={40} style={{ color: '#0ea5e9', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:800, color:'var(--gray-100)', marginBottom:10 }}>
              Time for a Rest Break!
            </h3>
            <p style={{ color:'var(--gray-400)', fontSize:'0.88rem', lineHeight:1.5, marginBottom:24 }}>
              Excellent job concentrating! You have been focusing continuously for {breakInterval} minutes. Rest your eyes, take a stretch, or drink some water.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button 
                onClick={startBreakMode} 
                className="btn btn-primary"
                style={{ background:'linear-gradient(135deg, #0d9488, #14b8a6)', borderColor:'#14b8a6', padding:'10px 24px' }}
              >
                Start 5-Min Break
              </button>
              <button 
                onClick={() => {
                  setShowBreakReminder(false);
                  setLastBreakTimeMs(elapsedMs);
                }} 
                className="btn"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--gray-300)', padding:'10px 24px' }}
              >
                Skip Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Work Focus Mode Header Card */}
      {isResting && (
        <div 
          className="card border-glow animate-in" 
          style={{ 
            padding:28, 
            textAlign:'center', 
            background:'linear-gradient(135deg, rgba(20,184,166,0.04), rgba(124,58,237,0.04))',
            borderColor:'rgba(20,184,166,0.2)',
            display:'flex',
            flexDirection:'column',
            alignItems:'center'
          }}
        >
          <div style={{ textTransform:'uppercase', letterSpacing:'0.15em', fontSize:'0.75rem', color:'var(--teal-400)', fontWeight:700, marginBottom:8 }}>
            ACTIVE REST BREAK
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'3.4rem', fontWeight:800, color:'var(--gray-100)', marginBottom:8 }}>
            {formatCountdown(breakCountdown)}
          </div>
          <p style={{ fontSize:'0.82rem', color:'var(--gray-400)', maxWidth:420, lineHeight:1.4 }}>
            Tip: Stand up, stretch, look at something 20 feet away to relax your eye muscles, and breathe deeply. Focus Mode will auto-resume afterwards.
          </p>
          <button 
            onClick={() => setIsResting(false)} 
            className="btn btn-sm"
            style={{ marginTop:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--gray-300)' }}
          >
            End Break Early
          </button>
        </div>
      )}

      {/* Top focus statistics summary */}
      <div className="stats-grid">
        <div className="stat-card border-glow" style={{ position:'relative', overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <span className="stat-label">Hours Tracked Today</span>
              <h3 className="stat-value">{todayHoursStr} hrs</h3>
            </div>
            <div className="stat-icon-wrap" style={{ background:'rgba(20,184,166,0.1)', color:'var(--teal-400)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--gray-400)', marginBottom:4 }}>
              <span>Progress to target ({targetHours}h)</span>
              <span>{todayPercent}%</span>
            </div>
            <div className="progress-bar-bg" style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
              <div 
                style={{ 
                  height:'100%', 
                  borderRadius:3, 
                  background:'linear-gradient(90deg, #0d9488, #14b8a6)', 
                  width:`${todayPercent}%`,
                  transition:'width 0.4s ease-out'
                }} 
              />
            </div>
          </div>
        </div>

        <div className="stat-card border-glow">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <span className="stat-label">Session Focus Quality</span>
              <h3 className="stat-value" style={{ color: activeSession ? undefined : 'var(--gray-500)' }}>
                {activeSession ? `${liveFocusScore}%` : '—'}
              </h3>
            </div>
            <div className="stat-icon-wrap" style={{ background:'rgba(124,58,237,0.1)', color:'var(--violet-400)' }}>
              <Target size={20} />
            </div>
          </div>
          <div style={{ marginTop:14, fontSize:'0.75rem', color:'var(--gray-400)', display:'flex', alignItems:'center', gap:4 }}>
            <Zap size={14} style={{ color:'var(--violet-400)' }} />
            Distractions: {distractionCount} times
          </div>
        </div>

        <div className="stat-card border-glow">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex: 1 }}>
              <span className="stat-label">Break Reminder Time</span>
              <p style={{ fontSize:'0.7rem', color:'var(--gray-500)', marginTop:3, marginBottom:10 }}>
                Set how many minutes before a break reminder pops up.
              </p>
              {/* Custom time input */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={breakInterval}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v > 0) setBreakInterval(v);
                  }}
                  style={{
                    width: 72,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--gray-100)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 7,
                    padding: '5px 10px',
                    fontFamily: 'var(--font-display)',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize:'0.78rem', color:'var(--gray-400)', fontWeight:500 }}>minutes</span>
              </div>
              {/* Quick presets */}
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => setBreakInterval(m)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 5,
                      border: breakInterval === m
                        ? '1px solid var(--emp-primary)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: breakInterval === m
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(255,255,255,0.03)',
                      color: breakInterval === m ? 'var(--emp-primary)' : 'var(--gray-500)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background:'rgba(59,130,246,0.1)', color:'var(--emp-primary)', marginLeft:12 }}>
              <SmilePlus size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus Control Container */}
      <div style={{ display:'grid', gridTemplateColumns:'1.25fr 0.75fr', gap:24 }}>
        
        {/* Deep Focus Mode Core Module */}
        <div className="card border-glow" style={{ padding:28, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, position:'relative' }}>
          
          {/* Target goal text inputs */}
          <div style={{ width:'100%', maxWidth:360, marginBottom:16 }}>
            <input 
              type="text" 
              placeholder="What is your focus goal for this session? (e.g. Coding UI)"
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              disabled={activeSession ? true : false}
              style={{
                width:'100%',
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.06)',
                color:'var(--gray-200)',
                padding:'10px 14px',
                borderRadius:8,
                fontSize:'0.82rem',
                textAlign:'center',
                outline:'none',
                transition:'all 0.2s'
              }}
            />
          </div>

          <div style={{ textTransform:'uppercase', letterSpacing:'0.15em', fontSize:'0.78rem', color:'var(--gray-400)', fontWeight:700 }}>
            {activeSession
              ? (activeSession.status === 'active' ? '● ACTIVE SESSION' : '|| PAUSED SESSION')
              : '00:00:00 · READY TO START'}
          </div>

          {/* Large dynamic clock timer — always starts from 00:00:00 on new session */}
          <div 
            style={{ 
              fontFamily:'var(--font-display)', 
              fontSize:'3.8rem', 
              fontWeight:800, 
              color: activeSession?.status === 'active' && !isResting
                ? 'var(--emp-primary)'
                : activeSession?.status === 'paused'
                  ? '#f59e0b'
                  : 'var(--gray-100)', 
              letterSpacing:'-0.02em', 
              margin:'10px 0 20px 0',
              textShadow: activeSession?.status === 'active' && !isResting
                ? '0 0 32px rgba(59,130,246,0.4)'
                : 'none',
              animation: activeSession?.status === 'active' && !isResting
                ? 'pulse-glow 2s infinite ease-in-out'
                : 'none',
              transition: 'color 0.3s'
            }}
          >
            {activeSession ? formatTime(elapsedMs) : '00:00:00'}
          </div>

          {/* Controls button actions */}
          <div style={{ display:'flex', gap:16, width:'100%', maxWidth:360, justifyContent:'center' }}>
            {!activeSession ? (
              <button 
                onClick={handleStartWork} 
                className="btn btn-primary" 
                style={{ 
                  flex:1, 
                  background:'linear-gradient(135deg, #1d4ed8, #3b82f6)', 
                  borderColor:'#3b82f6',
                  boxShadow:'0 0 20px rgba(59,130,246,0.35)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:8
                }}
              >
                <Play size={16} /> Start Session
              </button>
            ) : (
              <>
                {activeSession.status === 'active' ? (
                  <button 
                    onClick={handlePauseWork} 
                    className="btn" 
                    style={{ 
                      flex:1, 
                      background:'rgba(255,255,255,0.04)', 
                      border:'1px solid rgba(255,255,255,0.1)', 
                      color:'var(--gray-200)',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:8
                    }}
                  >
                    <Pause size={16} /> Pause Focus
                  </button>
                ) : (
                  <button 
                    onClick={handleResumeWork} 
                    className="btn btn-primary" 
                    style={{ 
                      flex:1, 
                      background:'linear-gradient(135deg, #1d4ed8, #3b82f6)', 
                      borderColor:'#3b82f6',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:8
                    }}
                  >
                    <Play size={16} /> Resume Session
                  </button>
                )}
                
                <button 
                  onClick={handleStopWork} 
                  className="btn btn-danger" 
                  style={{ 
                    flex:1, 
                    background:'linear-gradient(135deg, #991b1b, #ef4444)', 
                    borderColor:'#ef4444',
                    boxShadow:'0 0 20px rgba(239,68,68,0.2)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:8
                  }}
                >
                  <Square size={14} /> Finish Goal
                </button>
              </>
            )}
          </div>

          {activeSession && (
            <div style={{ marginTop:24, display:'flex', gap:18, fontSize:'0.72rem', color:'var(--gray-500)', alignItems:'center' }}>
              <span>Started: {activeSession.startTime ? new Date(activeSession.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              <span>•</span>
              <button 
                onClick={triggerSimulation}
                style={{ 
                  background:'none', 
                  border:'none', 
                  color:'var(--emp-primary)', 
                  cursor:'pointer', 
                  textDecoration:'underline',
                  fontSize:'0.72rem',
                  padding:0
                }}
              >
                Simulate Distraction Alert
              </button>
            </div>
          )}
        </div>

        {/* Focus Score Graph & Information */}
        <div className="card border-glow" style={{ padding:20, display:'flex', flexDirection:'column' }}>
          <div className="section-header" style={{ marginBottom:14 }}>
            <span className="section-title" style={{ fontSize:'0.88rem' }}>Weekly Focus Chart</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12, flex:1, justifyContent:'center' }}>
            {chartData.map((day) => {
              const score = day.score !== null ? day.score : 0;
              const hasData = day.hours > 0;
              
              let barColor = 'linear-gradient(180deg, #14b8a6, #0d9488)';
              if (score < 50 && score > 0) {
                barColor = 'linear-gradient(180deg, #ef4444, #991b1b)';
              } else if (score < 80 && score > 0) {
                barColor = 'linear-gradient(180deg, #f59e0b, #d97706)';
              }

              return (
                <div key={day.dateStr} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:'0.72rem', color:'var(--gray-400)', width:32, fontWeight:500 }}>{day.label}</span>
                  <div style={{ flex:1, height:14, background:'rgba(255,255,255,0.03)', borderRadius:4, overflow:'hidden', position:'relative' }}>
                    {hasData && (
                      <div 
                        style={{ 
                          height:'100%', 
                          width:`${score}%`, 
                          background:barColor, 
                          borderRadius:4, 
                          transition:'width 0.5s ease-out' 
                        }} 
                      />
                    )}
                  </div>
                  <span style={{ fontSize:'0.72rem', color:hasData ? 'var(--gray-200)' : 'var(--gray-600)', width:48, textAlign:'right', fontWeight:600 }}>
                    {hasData ? `${score}%` : 'No focus'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:10, marginTop:16, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12, fontSize:'0.65rem', color:'var(--gray-500)', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:'var(--emerald-500)' }} /> High Focus (&gt;80%)
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:'var(--amber-500)' }} /> Medium (50%-80%)
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:'var(--red-500)' }} /> Distracted (&lt;50%)
            </div>
          </div>
        </div>

      </div>

      {/* Completed Deep Focus sessions list */}
      <div className="card border-glow" style={{ padding:20 }}>
        <div className="section-header" style={{ marginBottom:14 }}>
          <span className="section-title" style={{ fontSize:'0.88rem' }}>Previous Focus Sessions</span>
        </div>

        {workSessions.filter(s => s.status === 'completed').length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--gray-500)', fontSize:'0.82rem' }}>
            No focus sessions completed yet. Initiate focus sessions to monitor concentration history!
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', color:'var(--gray-400)', textAlign:'left' }}>
                  <th style={{ padding:10 }}>Date</th>
                  <th style={{ padding:10 }}>Start Time</th>
                  <th style={{ padding:10 }}>End Time</th>
                  <th style={{ padding:10 }}>Task / Goal</th>
                  <th style={{ padding:10 }}>Duration</th>
                  <th style={{ padding:10 }}>Distractions</th>
                  <th style={{ padding:10 }}>Productivity</th>
                  <th style={{ padding:10 }}>HR Feedback</th>
                </tr>
              </thead>
              <tbody>
                {workSessions.filter(s => s.status === 'completed').map((session) => {
                  const hrs = parseFloat((session.totalDurationMs / 3600000).toFixed(2));
                  const score = session.focusScore || 0;
                  
                  let scoreBadge = 'badge-approved';
                  if (score < 50) {
                    scoreBadge = 'badge-rejected';
                  } else if (score < 80) {
                    scoreBadge = 'badge-pending';
                  }

                  const startText = session.startTime
                    ? new Date(session.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const endText = session.endTime
                    ? new Date(session.endTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  
                  return (
                    <tr key={session.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)', color:'var(--gray-200)' }}>
                      <td style={{ padding:10, color:'var(--gray-300)' }}>{new Date(session.date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</td>
                      <td style={{ padding:10, color:'var(--emp-primary)', fontWeight:600 }}>{startText}</td>
                      <td style={{ padding:10, color:'#f59e0b', fontWeight:600 }}>{endText}</td>
                      <td style={{ padding:10, fontWeight:600 }}>{session.focusGoal || 'General Work Session'}</td>
                      <td style={{ padding:10 }}>{hrs} hrs</td>
                      <td style={{ padding:10 }}>{session.distractionsCount || 0} times</td>
                      <td style={{ padding:10 }}>
                        <span className={`badge ${scoreBadge}`} style={{ fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          {score}% Score
                        </span>
                      </td>
                      <td style={{ padding:10, color:'var(--gray-300)', fontStyle: session.hrReply ? 'normal' : 'italic' }}>
                        {session.hrReply || '—'}
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

// ─── Employee Dashboard (Main) ────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { userProfile, logout, currentUser } = useAuth();
  const [activeTab,       setActiveTab]     = useState('dashboard');
  const [wellnessLogs,    setWellnessLogs]  = useState([]);
  const [leaveRequests,   setLeaveRequests] = useState([]);
  const [workSessions,    setWorkSessions]  = useState([]);
  const [loadingData,     setLoadingData]   = useState(true);
  const [dismissedLeaves, setDismissedLeaves] = useState([]);

  const tabMeta = useMemo(() => ({
    dashboard:{ title:'My Dashboard',             sub:`Welcome back, ${userProfile?.firstName || 'Employee'}! Here's your daily overview.` },
    today:    { title:'Wellness Today',           sub:`Log your daily health metrics — ${todayStr()}` },
    work:     { title:'Productivity Tracker',     sub:'Track your working hours, productivity sessions and performance results.' },
    calendar: { title:'Wellness Calendar',        sub:'Interactive calendar overview of your wellness logs and leaves.' },
    history:  { title:'My Health Trends',         sub:'View your wellness journey over time.' },
    leave:    { title:'Leave Request',            sub:'Apply for leave and track your requests.' },
    replies:  { title:'HR Replies',               sub:'Direct replies and feedback from your HR Manager.' },
    profile:  { title:'My Profile',              sub:'View and manage your personal information and account settings.' },
  }), [userProfile]);

  // Load dismissed leaves from localStorage on mount/user load
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        const stored = localStorage.getItem(`dismissed_leaves_${currentUser.uid}`);
        if (stored) {
          setDismissedLeaves(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Error loading dismissed leaves:', err);
      }
    }
  }, [currentUser]);

  // Stable dismiss handler
  const handleDismiss = useCallback((id) => {
    setDismissedLeaves((prev) => {
      const next = [...prev, id];
      if (currentUser?.uid) {
        try {
          localStorage.setItem(`dismissed_leaves_${currentUser.uid}`, JSON.stringify(next));
        } catch (err) {
          console.error('Error saving dismissed leaves:', err);
        }
      }
      return next;
    });
  }, [currentUser]);

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!currentUser) return;
    setLoadingData(true);

    const unsubWell = onSnapshot(
      query(collection(db, 'wellness_logs'), where('uid', '==', currentUser.uid)),
      (snap) => {
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort in memory by createdAt descending
        logs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          if (tA !== tB) return tB - tA;
          return (b.date || '').localeCompare(a.date || '');
        });
        setWellnessLogs(logs);
        setLoadingData(false);
      },
      (err) => {
        console.error("Error loading wellness logs:", err);
        setLoadingData(false);
      }
    );

    const unsubLeave = onSnapshot(
      query(collection(db, 'leave_requests'), where('employeeUid', '==', currentUser.uid)),
      (snap) => {
        const reqs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort in memory by createdAt descending
        reqs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setLeaveRequests(reqs);
      },
      (err) => {
        console.error("Error loading leave requests:", err);
      }
    );

    const unsubWork = onSnapshot(
      query(collection(db, 'work_sessions'), where('uid', '==', currentUser.uid)),
      (snap) => {
        const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setWorkSessions(sessions);
      },
      (err) => console.error('Error loading work sessions:', err)
    );

    return () => { unsubWell(); unsubLeave(); unsubWork(); };
  }, [currentUser]);

  const meta = tabMeta[activeTab] || tabMeta.today;

  // Filter recently reviewed leave requests that are not dismissed
  const leaveNotifications = leaveRequests.filter(
    (req) => (req.status === 'approved' || req.status === 'rejected') && !dismissedLeaves.includes(req.id)
  );

  return (
    <div className="dashboard-layout emp-theme">
      <EmpSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        logout={logout}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h2>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>
          <div className="dashboard-header-right">
            <div className="header-date-chip">
              <Clock size={12} />
              {new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Real-time Leave Notifications */}
          {leaveNotifications.map((notif) => (
            <div key={notif.id} className={`notification-banner ${notif.status}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 'bold' }}>{notif.status === 'approved' ? '[Approved]' : '[Rejected]'}</span>
                <span>
                  Your request for <strong>{notif.type}</strong> from {notif.startDate} to {notif.endDate} has been <strong>{notif.status}</strong> by HR.
                </span>
              </div>
              <button className="notification-close-btn" onClick={() => handleDismiss(notif.id)}>
                ✕
              </button>
            </div>
          ))}

          {loadingData ? (
            <div className="empty-state">
              <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'var(--emp-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <p className="empty-state-text">Loading your data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab userProfile={userProfile} wellnessLogs={wellnessLogs} workSessions={workSessions} leaveRequests={leaveRequests} setActiveTab={setActiveTab} />}
              {activeTab === 'today'    && <TodayTab  userProfile={userProfile} wellnessLogs={wellnessLogs} workSessions={workSessions} />}
              {activeTab === 'work'     && <WorkTab    userProfile={userProfile} workSessions={workSessions} />}
              {activeTab === 'calendar' && <CalendarTab wellnessLogs={wellnessLogs} leaveRequests={leaveRequests} workSessions={workSessions} />}
              {activeTab === 'history'  && <HistoryTab wellnessLogs={wellnessLogs} />}
              {activeTab === 'leave'    && <LeaveTab   userProfile={userProfile} leaveRequests={leaveRequests} />}
              {activeTab === 'replies'  && <RepliesTab leaveRequests={leaveRequests} wellnessLogs={wellnessLogs} workSessions={workSessions} />}
              {activeTab === 'profile'  && <ProfileTab userProfile={userProfile} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
