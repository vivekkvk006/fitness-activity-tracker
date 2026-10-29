import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bike, CalendarDays, Check,
  ChevronDown, CircleHelp, Flame, Footprints, Gauge, HeartPulse, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, Target, Timer, TrendingUp, Trophy,
  Waves, Weight, X, Zap
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

const todayKey = () => new Date().toISOString().slice(0, 10);
const initialActivities = [
  { id: 1, type: 'Running', title: 'Morning run', date: todayKey(), duration: 32, distance: 4.2, calories: 285, steps: 5200 },
  { id: 2, type: 'Cycling', title: 'City cycling', date: todayKey(), duration: 25, distance: 7.8, calories: 190, steps: 0 },
  { id: 3, type: 'Walking', title: 'Evening walk', date: todayKey(), duration: 18, distance: 1.4, calories: 85, steps: 2100 },
  { id: 4, type: 'Gym', title: 'Strength training', date: todayKey(), duration: 35, distance: 0, calories: 220, steps: 0 },
  { id: 5, type: 'Walking', title: 'Lunch break walk', date: todayKey(), duration: 20, distance: 1.6, calories: 95, steps: 2400 }
];
const typeOptions = [
  { name: 'Walking', icon: Footprints, color: 'mint' },
  { name: 'Running', icon: Activity, color: 'orange' },
  { name: 'Cycling', icon: Bike, color: 'blue' },
  { name: 'Gym', icon: Weight, color: 'purple' },
  { name: 'Swimming', icon: Waves, color: 'cyan' }
];
const colors = { Walking: 'mint', Running: 'orange', Cycling: 'blue', Gym: 'purple', Swimming: 'cyan' };
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function activityIcon(type) {
  const Icon = typeOptions.find(item => item.name === type)?.icon || Activity;
  return Icon;
}

function App() {
  const [activities, setActivities] = useState(() => readStorage('stride-activities', initialActivities));
  const [goals, setGoals] = useState(() => readStorage('stride-goals', { steps: 10000, calories: 500, minutes: 60 }));
  const [page, setPage] = useState('Overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [goalEdit, setGoalEdit] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Running', date: todayKey(), duration: '30', distance: '3', calories: '200', steps: '0' });

  useEffect(() => localStorage.setItem('stride-activities', JSON.stringify(activities)), [activities]);
  useEffect(() => localStorage.setItem('stride-goals', JSON.stringify(goals)), [goals]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const today = todayKey();
  const todays = activities.filter(a => a.date === today);
  const totals = useMemo(() => ({
    steps: todays.reduce((sum, a) => sum + Number(a.steps || 0), 0),
    calories: todays.reduce((sum, a) => sum + Number(a.calories || 0), 0),
    minutes: todays.reduce((sum, a) => sum + Number(a.duration || 0), 0),
    distance: todays.reduce((sum, a) => sum + Number(a.distance || 0), 0)
  }), [todays]);
  const progress = value => Math.min(100, Math.round((value / Math.max(1, value === totals.steps ? goals.steps : 1)) * 100));
  const weekData = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    return dayNames.map((name, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayItems = activities.filter(a => a.date === key);
      return { day: name, calories: dayItems.reduce((s, a) => s + Number(a.calories || 0), 0), minutes: dayItems.reduce((s, a) => s + Number(a.duration || 0), 0) };
    });
  }, [activities]);
  const filtered = activities
    .filter(a => `${a.title} ${a.type} ${a.date}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My activities', icon: Activity },
    { label: 'Goals & progress', icon: Target }
  ];

  function openAdd() {
    setForm({ title: '', type: 'Running', date: todayKey(), duration: '30', distance: '3', calories: '200', steps: '0' });
    setModalOpen(true);
  }
  function addActivity(event) {
    event.preventDefault();
    const newActivity = {
      id: Date.now(),
      title: form.title.trim() || `${form.type} session`,
      type: form.type,
      date: form.date,
      duration: Math.max(0, Number(form.duration) || 0),
      distance: Math.max(0, Number(form.distance) || 0),
      calories: Math.max(0, Number(form.calories) || 0),
      steps: Math.max(0, Number(form.steps) || 0)
    };
    setActivities(current => [newActivity, ...current]);
    setModalOpen(false);
    setPage('Overview');
    setNotice('Activity added successfully');
  }
  function deleteActivity(id) {
    setActivities(current => current.filter(a => a.id !== id));
    setNotice('Activity deleted');
  }
  function saveGoals(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setGoals({
      steps: Math.max(1, Number(data.get('steps')) || 10000),
      calories: Math.max(1, Number(data.get('calories')) || 500),
      minutes: Math.max(1, Number(data.get('minutes')) || 60)
    });
    setGoalEdit(false);
    setNotice('Goals updated');
  }

  const stepsPct = Math.min(100, Math.round(totals.steps / goals.steps * 100));
  const caloriesPct = Math.min(100, Math.round(totals.calories / goals.calories * 100));
  const minutesPct = Math.min(100, Math.round(totals.minutes / goals.minutes * 100));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Activity size={22} strokeWidth={2.8} /></span><span>stride<span className="brand-dot">.</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setMobileNav(false); }}>
              <Icon size={18} /><span>{label}</span>{label === 'My activities' && <span className="nav-count">{activities.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-icon"><Zap size={18} /></div><strong>Keep your streak alive!</strong><p>Small steps today make a big difference tomorrow.</p><button onClick={() => { setPage('Goals & progress'); setMobileNav(false); }}>View your goals <ArrowUpRight size={14} /></button></div>
          <button className="nav-item" onClick={() => setNotice('Settings will be available in a future version.')}><Settings size={18} /><span>Settings</span></button>
          <div className="profile-mini"><div className="avatar">JD</div><div className="profile-text"><strong>Jordan Davis</strong><span>Free account</span></div><ChevronDown size={16} className="muted-icon" /></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={21} /></button><span className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></span></div>
          <div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><div className="avatar small-avatar">JD</div></div>
        </header>

        <div className="content">
          {page === 'Overview' && <>
            <section className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> YOUR PERSONAL FITNESS SPACE</div><h1>Good morning, Jordan <span className="wave">✳</span></h1><p className="subheading">Every move counts. Let's make today a good one.</p></div><button className="primary-button" onClick={openAdd}><Plus size={18} /> Log activity</button></section>
            <section className="hero-card"><div className="hero-content"><span className="hero-pill"><Zap size={13} /> YOUR DAILY SNAPSHOT</span><h2>You're building<br />something <em>great.</em></h2><p>Consistency beats perfection. Keep showing up for yourself.</p><button className="hero-button" onClick={() => setPage('Goals & progress')}>See your progress <ArrowUpRight size={16} /></button></div><div className="hero-art" aria-hidden="true"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-ring ring-three" /><div className="art-circle"><Activity size={72} strokeWidth={1.4} /></div><div className="floating-stat"><Flame size={17} /><span><b>{totals.calories}</b><small>kcal today</small></span></div><div className="floating-check"><Check size={20} /></div></div><div className="hero-number">01 <span> / MOVE WITH PURPOSE</span></div></section>

            <section className="section-heading"><div><h2>Your daily activity</h2><p>Here's how you're doing today.</p></div><button className="text-button" onClick={() => setPage('Goals & progress')}>View goals <ArrowUpRight size={15} /></button></section>
            <section className="stats-grid">
              <StatCard icon={Footprints} label="Total steps" value={totals.steps.toLocaleString()} unit="steps" goal={goals.steps.toLocaleString()} pct={stepsPct} color="mint" trend={`${stepsPct}% of daily goal`} />
              <StatCard icon={Flame} label="Calories burned" value={totals.calories.toLocaleString()} unit="kcal" goal={`${goals.calories} kcal`} pct={caloriesPct} color="orange" trend={`${caloriesPct}% of daily goal`} />
              <StatCard icon={Timer} label="Active time" value={totals.minutes.toLocaleString()} unit="min" goal={`${goals.minutes} min`} pct={minutesPct} color="blue" trend={`${minutesPct}% of daily goal`} />
              <StatCard icon={Gauge} label="Distance covered" value={totals.distance.toFixed(1)} unit="km" goal="Across activities" pct={null} color="purple" trend={`${todays.length} activities logged`} />
            </section>

            <section className="dashboard-grid">
              <div className="panel chart-panel"><div className="panel-heading"><div><h3>Activity overview</h3><p>Your movement throughout the week</p></div><span className="chart-legend"><i /> Calories</span></div><div className="chart-summary"><strong>{weekData.reduce((s, d) => s + d.calories, 0).toLocaleString()} <small>kcal</small></strong><span className="chart-caption"><TrendingUp size={14} /> This week</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekData} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}><defs><linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8f36a" stopOpacity={0.26}/><stop offset="100%" stopColor="#b8f36a" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#e9eee8" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#879188', fontSize: 12 }} dy={10}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#879188', fontSize: 11 }}/><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5ebe3', fontSize: 12 }} formatter={value => [`${value} kcal`, 'Calories']}/><Area type="monotone" dataKey="calories" stroke="#79b83d" strokeWidth={2.5} fill="url(#calorieFill)" activeDot={{ r: 5, fill: '#79b83d', stroke: '#fff', strokeWidth: 2 }}/></AreaChart></ResponsiveContainer></div></div>
              <div className="panel goals-panel"><div className="panel-heading"><div><h3>Daily goals</h3><p>Little wins add up.</p></div><button className="round-icon" onClick={() => { setPage('Goals & progress'); setGoalEdit(true); }} aria-label="Edit goals"><Settings size={16}/></button></div><GoalRing pct={stepsPct} value={totals.steps.toLocaleString()} label="steps completed" color="#85c84e"/><div className="goal-line"><span><span className="goal-dot orange-dot"/> Calories</span><strong>{totals.calories} / {goals.calories} kcal</strong></div><div className="mini-progress"><span className="orange-fill" style={{ width: `${caloriesPct}%` }}/></div><div className="goal-line"><span><span className="goal-dot blue-dot"/> Active minutes</span><strong>{totals.minutes} / {goals.minutes} min</strong></div><div className="mini-progress"><span className="blue-fill" style={{ width: `${minutesPct}%` }}/></div><button className="goal-manage" onClick={() => setPage('Goals & progress')}>Manage goals <ArrowUpRight size={15}/></button></div>
            </section>

            <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent activities</h3><p>Your latest movement, all in one place.</p></div><button className="text-button" onClick={() => setPage('My activities')}>View all <ArrowUpRight size={15}/></button></div><ActivityTable activities={activities.slice().sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id).slice(0,4)} onDelete={deleteActivity}/></section>
          </>}

          {page === 'My activities' && <><section className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> YOUR MOVEMENT JOURNAL</div><h1>My activities<span className="wave">.</span></h1><p className="subheading">Every workout tells a story. Keep yours going.</p></div><button className="primary-button" onClick={openAdd}><Plus size={18}/> Log activity</button></section><section className="stats-grid compact-stats"><StatCard icon={Activity} label="Total activities" value={activities.length} unit="sessions" goal="All time" pct={null} color="mint"/><StatCard icon={Timer} label="Total active time" value={activities.reduce((s,a)=>s+Number(a.duration||0),0)} unit="min" goal="All time" pct={null} color="blue"/><StatCard icon={Flame} label="Total calories" value={activities.reduce((s,a)=>s+Number(a.calories||0),0).toLocaleString()} unit="kcal" goal="All time" pct={null} color="orange"/><StatCard icon={Trophy} label="Activity types" value={new Set(activities.map(a=>a.type)).size} unit="types" goal="Keep exploring" pct={null} color="purple"/></section><section className="panel full-activity-panel"><div className="panel-heading"><div><h3>All activities</h3><p>Review and manage your workout log.</p></div><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search activities..." aria-label="Search activities"/></div></div><ActivityTable activities={filtered} onDelete={deleteActivity} emptyMessage="No activities match your search."/></section></>}

          {page === 'Goals & progress' && <><section className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> YOUR PERSONAL MILESTONES</div><h1>Goals & progress<span className="wave">.</span></h1><p className="subheading">Progress isn't always loud. Sometimes it's just showing up.</p></div><button className="primary-button" onClick={()=>setGoalEdit(!goalEdit)}><Target size={17}/> {goalEdit?'Close editor':'Edit goals'}</button></section>{goalEdit && <form className="panel goal-form" onSubmit={saveGoals}><div className="panel-heading"><div><h3>Customize daily goals</h3><p>Choose targets that work for you.</p></div></div><div className="form-grid"><label>Daily steps<input name="steps" type="number" min="1" defaultValue={goals.steps} required/></label><label>Daily calories (kcal)<input name="calories" type="number" min="1" defaultValue={goals.calories} required/></label><label>Active minutes<input name="minutes" type="number" min="1" defaultValue={goals.minutes} required/></label></div><button className="primary-button" type="submit"><Check size={16}/> Save goals</button></form>}<section className="stats-grid"><StatCard icon={Footprints} label="Steps goal" value={`${stepsPct}%`} unit="completed" goal={`${goals.steps.toLocaleString()} steps`} pct={stepsPct} color="mint"/><StatCard icon={Flame} label="Calorie goal" value={`${caloriesPct}%`} unit="completed" goal={`${goals.calories} kcal`} pct={caloriesPct} color="orange"/><StatCard icon={Timer} label="Active time goal" value={`${minutesPct}%`} unit="completed" goal={`${goals.minutes} min`} pct={minutesPct} color="blue"/><StatCard icon={Trophy} label="Activities today" value={todays.length} unit="sessions" goal="Keep it up" pct={null} color="purple"/></section><section className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Weekly calorie progress</h3><p>Daily calories recorded this week</p></div><span className="chart-legend"><i/> Calories</span></div><div className="chart-summary"><strong>{weekData.reduce((s,d)=>s+d.calories,0).toLocaleString()} <small>kcal</small></strong><span className="chart-caption">Across 7 days</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekData} margin={{top:10,right:6,left:-22,bottom:0}}><defs><linearGradient id="goalFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8f36a" stopOpacity={0.26}/><stop offset="100%" stopColor="#b8f36a" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#e9eee8" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#879188',fontSize:12}} dy={10}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#879188',fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="calories" stroke="#79b83d" strokeWidth={2.5} fill="url(#goalFill)"/></AreaChart></ResponsiveContainer></div></div><div className="panel goals-panel"><div className="panel-heading"><div><h3>Today's milestones</h3><p>One step at a time.</p></div><Trophy size={19} color="#82bd49"/></div>{[{label:'Steps',value:totals.steps,goal:goals.steps,color:'mint',unit:'steps'},{label:'Calories',value:totals.calories,goal:goals.calories,color:'orange',unit:'kcal'},{label:'Active minutes',value:totals.minutes,goal:goals.minutes,color:'blue',unit:'min'}].map(item=><div className="milestone" key={item.label}><div className="milestone-top"><strong>{item.label}</strong><span>{Math.min(100,Math.round(item.value/item.goal*100))}%</span></div><div className="mini-progress large-progress"><span className={`${item.color}-fill`} style={{width:`${Math.min(100,item.value/item.goal*100)}%`}}/></div><small>{item.value.toLocaleString()} of {item.goal.toLocaleString()} {item.unit}</small></div>)}<p className="encouragement"><HeartPulse size={17}/> Listen to your body, celebrate your progress, and rest when you need to.</p></div></section></>}
          <footer className="footer"><span>© {new Date().getFullYear()} Stride Fitness</span><span>Built for progress, not perfection <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false);}}><form className="modal" onSubmit={addActivity}><div className="modal-header"><div><div className="eyebrow">YOUR MOVEMENT JOURNAL</div><h2>Log an activity</h2><p>Every little bit of movement counts.</p></div><button type="button" className="round-icon" onClick={()=>setModalOpen(false)} aria-label="Close dialog"><X size={19}/></button></div><label className="field-label">Activity name<input className="field-input" placeholder="e.g. Morning park run" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><span className="field-label">Activity type</span><div className="type-grid">{typeOptions.map(({name,icon:Icon,color})=><button type="button" key={name} className={`type-option ${form.type===name?'selected':''}`} onClick={()=>setForm({...form,type:name})}><span className={`activity-icon ${color}`}><Icon size={18}/></span><span>{name}</span>{form.type===name&&<Check size={14} className="type-check"/>}</button>)}</div><div className="form-grid"><label>Date<input type="date" value={form.date} max={todayKey()} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label>Duration (min)<input type="number" min="0" max="1440" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} required/></label><label>Distance (km)<input type="number" min="0" step="0.1" value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})} required/></label><label>Calories (kcal)<input type="number" min="0" value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})} required/></label><label className="full-field">Steps<input type="number" min="0" value={form.steps} onChange={e=>setForm({...form,steps:e.target.value})} required/><small>Enter the steps associated with this activity, if known.</small></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={17}/> Save activity</button></div></form></div>}
      {notice && <div className="toast"><span className="toast-check"><Check size={15}/></span>{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
    </div>
  );
}

function StatCard({icon:Icon,label,value,unit,goal,pct,color,trend}) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${color}`}><Icon size={19}/></span>{pct!==null&&<span className="stat-percent">{pct>=100?<Check size={13}/>:<ArrowUpRight size={13}/>} {pct}%</span>}</div><div className="stat-label">{label}</div><div className="stat-value">{value}<span>{unit}</span></div><div className="stat-bottom">{pct!==null?<div className="mini-progress"><span className={`${color}-fill`} style={{width:`${pct}%`}}/></div>:<div className="stat-divider"/>}<div className="stat-foot"><span>{trend||goal}</span>{pct!==null&&<span>{goal}</span>}</div></div></article>;
}
function GoalRing({pct,value,label,color}) {
  return <div className="goal-ring-wrap"><div className="goal-ring" style={{'--ring-pct':`${pct}%`,'--ring-color':color}}><div className="ring-inner"><strong>{pct}%</strong><span>of goal</span></div></div><div className="ring-text"><strong>{value}</strong><span>{label}</span><small>{pct>=100?'Goal completed — amazing!':'Keep moving, you’ve got this.'}</small></div></div>;
}
function ActivityTable({activities,onDelete,emptyMessage='No activities yet. Add your first workout to get started.'}) {
  if (!activities.length) return <div className="empty-state"><span className="empty-icon"><Activity size={25}/></span><strong>Nothing here yet</strong><p>{emptyMessage}</p></div>;
  return <div className="table-scroll"><table className="activity-table"><thead><tr><th>ACTIVITY</th><th>DATE</th><th>DURATION</th><th>DISTANCE</th><th>CALORIES</th><th></th></tr></thead><tbody>{activities.map(a=>{const Icon=activityIcon(a.type);return <tr key={a.id}><td><div className="activity-name"><span className={`activity-icon ${colors[a.type]||'mint'}`}><Icon size={17}/></span><span><strong>{a.title}</strong><small>{a.type}</small></span></div></td><td className="table-muted">{formatDate(a.date)}</td><td>{a.duration} min</td><td>{Number(a.distance).toFixed(1)} km</td><td><span className="calorie-cell"><Flame size={14}/>{a.calories} kcal</span></td><td><button className="delete-button" title="Delete activity" aria-label={`Delete ${a.title}`} onClick={()=>onDelete(a.id)}><X size={16}/></button></td></tr>;})}</tbody></table></div>;
}

export default App;