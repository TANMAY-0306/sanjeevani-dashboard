import React, { useState, useMemo,useEffect  } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import SanjeevaniLogo from './sanjeevani_icon.png';


import {
  AlertTriangle, School, Baby, Ghost, TrendingUp, MapPin, Activity,
  LayoutDashboard, FileText, Settings, Bell, Filter, Menu, X, Shield,
  Building2, Phone, Sliders, Globe, Zap, Play,Search
} from 'lucide-react';

const ProjectSanjeevani = () => {

  // 🔥 DATA STATE
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH JSON DATA
  useEffect(() => {
    fetch('/project_sanjeevani.json')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("JSON load error:", err);
        setLoading(false);
      });
  }, []);



  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [vidyaSensitivity, setVidyaSensitivity] = useState(0.5);
  const [bioBarrierThreshold, setBioBarrierThreshold] = useState(0.5);
  const [poshanThreshold, setPoshanThreshold] = useState(0.5);
  const [language, setLanguage] = useState('en');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);

  const translations = {
    en: {
      dashboard: "Dashboard", criticalZones: "Critical Zones", ghostVillages: "Ghost Villages",
      poshanRisk: "Poshan Risk", bioBarrierRate: "Bio-Barrier Rate"
    },
    hi: {
      dashboard: "डैशबोर्ड", criticalZones: "गंभीर क्षेत्र", ghostVillages: "भूत गांव",
      poshanRisk: "पोषण जोखिम", bioBarrierRate: "बायो-बैरियर दर"
    }
  };

  const t = (key) => translations[language][key] || key;

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    const results = data.filter(d =>
      d.pincode.toString().includes(searchTerm) ||
      d.district_normalized.toLowerCase().includes(searchTerm) ||
      d.state_normalized.toLowerCase().includes(searchTerm) ||
      d.Vidya_Drift_Status.toLowerCase().includes(searchTerm) ||
      d.Bio_Barrier_Status.toLowerCase().includes(searchTerm) ||
      d.Ghost_Status.toLowerCase().includes(searchTerm)
    ).slice(0, 10);

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const selectSearchResult = (result) => {
    setSelectedState(result.state_normalized);
    setSelectedDistrict(result.district_normalized);
    setShowSearchResults(false);
    setSearchQuery('');
    setActiveSection('dashboard');
  };

  const states = useMemo(() => ['ALL', ...new Set(data.map(d => d.state_normalized))], [data]);
  const districts = useMemo(() => {
    if (selectedState === 'ALL') return ['ALL'];
    return ['ALL', ...new Set(data.filter(d => d.state_normalized === selectedState).map(d => d.district_normalized))];
  }, [data, selectedState]);
  const months = useMemo(() => ['ALL', ...new Set(data.map(d => d.Month))], [data]);

  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedState !== 'ALL') filtered = filtered.filter(d => d.state_normalized === selectedState);
    if (selectedDistrict !== 'ALL') filtered = filtered.filter(d => d.district_normalized === selectedDistrict);
    if (selectedMonth !== 'ALL') filtered = filtered.filter(d => d.Month === selectedMonth);
    if (showCriticalOnly) {
      filtered = filtered.filter(d => d.Poshan_Panic_Status === 'CRITICAL' || d.Ghost_Status === 'GHOST');
    }
    filtered = filtered.map(d => ({
      ...d,
      Vidya_Drift_Status: d.Vidya_Drift_Score > vidyaSensitivity ? 'CRITICAL' : d.Vidya_Drift_Status,
      Bio_Barrier_Status: d.Bio_Barrier_Score > bioBarrierThreshold ? 'BLOCKED' : d.Bio_Barrier_Status,
      Poshan_Panic_Status: d.Poshan_Panic_Score > poshanThreshold ? 'CRITICAL' : d.Poshan_Panic_Status
    }));
    return filtered;
  }, [data, selectedState, selectedDistrict, selectedMonth, showCriticalOnly, vidyaSensitivity, bioBarrierThreshold, poshanThreshold]);

  const metrics = useMemo(() => {
    const ghostCount = filteredData.filter(d => d.Ghost_Status === 'GHOST').length;
    const poshanRisk = filteredData.filter(d => d.Poshan_Panic_Status === 'CRITICAL').reduce((sum, d) => sum + d.enrollment_0_5, 0);
    const bioBarrierRate = filteredData.length > 0 ? (filteredData.filter(d => d.Bio_Barrier_Status === 'BLOCKED').length / filteredData.length * 100).toFixed(1) : 0;
    const criticalZones = filteredData.filter(d => d.Vidya_Drift_Status === 'CRITICAL').length;
    return { ghostCount, poshanRisk, bioBarrierRate, criticalZones };
  }, [filteredData]);

  const districtData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d => {
      if (!grouped[d.district_normalized]) {
        grouped[d.district_normalized] = { district: d.district_normalized, enrollment: 0, updates: 0 };
      }
      grouped[d.district_normalized].enrollment += d.enrollment_5_17;
      grouped[d.district_normalized].updates += d.bio_updates_18_plus;
    });
    return Object.values(grouped).slice(0, 10);
  }, [filteredData]);

  const survivalData = useMemo(() => {
  return filteredData.map(d => ({
    pincode: d.pincode,
    district: d.district_normalized,

    // X-axis (adult failure)
    bioBarrierScore: d.Bio_Barrier_Score,

    // Y-axis (infant hunger)
    poshanScore: d.Poshan_Panic_Score,

    population: d.Total_Population,
    status: d.Poshan_Panic_Status,

    // 🔥 size controls dot size
    size: Math.sqrt(d.Total_Population || 1) / 40
  }));
}, [filteredData]);


const funnelData = useMemo(() => {
  const total_0_5 = filteredData.reduce(
    (sum, d) => sum + d.enrollment_0_5, 0
  );

  const total_5_17 = filteredData.reduce(
    (sum, d) => sum + d.enrollment_5_17, 0
  );

  // ✅ Active students CANNOT exceed enrolled students
  const active_5_17 = Math.min(
    filteredData.reduce((sum, d) => sum + d.bio_updates_5_17, 0),
    total_5_17
  );

  return [
    { stage: 'Babies Born (0-5)', value: total_0_5, fill: '#3b82f6' },
    { stage: 'Students (5-17)', value: total_5_17, fill: '#f59e0b' },
    { stage: 'Active Students', value: active_5_17, fill: '#10b981' }
  ];
}, [filteredData]);


  const migrationTrend = useMemo(() => {
    const monthlyData = {};
    filteredData.forEach(d => {
      if (!monthlyData[d.Month]) monthlyData[d.Month] = { month: d.Month, score: 0, count: 0 };
      monthlyData[d.Month].score += d.Migration_Score;
      monthlyData[d.Month].count += 1;
    });
    return Object.values(monthlyData).map(m => ({ month: m.month, avgScore: parseFloat((m.score / m.count).toFixed(2)) }));
  }, [filteredData]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'survival', icon: AlertTriangle, label: 'Survival Monitor', badge: metrics.poshanRisk },
    { id: 'vidya', icon: School, label: 'Vidya Drift', badge: metrics.criticalZones },
    { id: 'ghost', icon: Ghost, label: 'Ghost Hunter', badge: metrics.ghostCount },
    { id: 'migrant', icon: MapPin, label: 'Nomad Radar', badge: null },
    { id: 'funnel', icon: TrendingUp, label: 'Future Health', badge: null },
    { id: 'settings', icon: Settings, label: 'Settings', badge: null }
  ];

  const renderSurvivalMonitor = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">⚠️ Survival Monitor - Immediate Crisis</h3>
        <p className="text-gray-600 mb-6">Real-time friction heatmap showing blocked adults vs. starving families</p>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <ReferenceLine
  x={0.6}
  stroke="red"
  strokeDasharray="5 5"
  label="Bio Barrier Threshold"
/>

<ReferenceLine
  y={0.6}
  stroke="red"
  strokeDasharray="5 5"
  label="Poshan Risk Threshold"
/>

            <XAxis type="number" dataKey="bioBarrierScore" name="Bio Barrier Score" tick={{ fill: '#6b7280' }}
              label={{ value: 'Adult Access Friction', position: 'insideBottom', offset: -5 }} />
            <YAxis type="number" dataKey="poshanScore" name="Hunger Risk" tick={{ fill: '#6b7280' }}
              label={{ value: 'Hunger Risk', angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend />
            <Scatter name="Emergency Zones" data={survivalData.filter(d => d.status === 'CRITICAL')} fill="#dc2626" />
            <Scatter name="Managed Zones" data={survivalData.filter(d => d.status === 'SAFE')} fill="#10b981" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-900">🚨 Emergency Action</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{survivalData.filter(d => d.status === 'CRITICAL').length}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-900">⚠️ High Friction</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{survivalData.filter(d => d.bioBarrierScore > 0.6).length}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900">✅ Safe Zones</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{survivalData.filter(d => d.status === 'SAFE').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGhostHunter = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">👻 Ghost PIN Hunter - Dead Zone Scanner</h3>
        <p className="text-gray-600 mb-6">Villages with zero digital activity flagged for audit</p>
        <div className="space-y-3">
          {filteredData.filter(d => d.Ghost_Status === 'GHOST' || d.Total_Activity === 0).slice(0, 15).map((zone, idx) => (
            <div key={idx} className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Ghost className="w-5 h-5 text-red-600" />
                    <span className="font-mono text-lg font-bold text-gray-900">PIN {zone.pincode}</span>
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">👻 GHOST</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-8">{zone.district_normalized}, {zone.state_normalized}</p>
                  <div className="flex gap-4 mt-2 ml-8 text-xs text-gray-700">
                    <span>Population: {zone.Total_Population}</span>
                    <span>•</span>
                    <span className="text-red-600 font-semibold">Activity: {zone.Total_Activity}</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                  🔍 Audit Village
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredData.filter(d => d.Ghost_Status === 'GHOST').length === 0 && (
          <div className="text-center py-12">
            <Ghost className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No ghost villages detected</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNomadRadar = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">📡 Nomad Radar - Migration Seismic Monitor</h3>
        <p className="text-gray-600 mb-6">Tracking population movement volatility over time</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={migrationTrend}>
            <defs>
              <linearGradient id="migrationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
            <YAxis tick={{ fill: '#6b7280' }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="avgScore" stroke="#8b5cf6" fill="url(#migrationGradient)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderFutureHealth = () => {
    const conversionRate = funnelData[1].value > 0 ? ((funnelData[2].value / funnelData[1].value) * 100).toFixed(1) : 0;
    const isHealthy = conversionRate > 70;
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">🔮 Future Health - Pipeline Funnel</h3>
          <p className="text-gray-600 mb-6">Visualizing demographic progression and dropout rates</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {funnelData.map((stage, idx) => {
                const widthPercent = idx === 0 ? 100 : (stage.value / funnelData[0].value) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                      <span className="text-lg font-bold" style={{ color: stage.fill }}>{stage.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div className="h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${widthPercent}%`, backgroundColor: stage.fill, minWidth: '60px' }}>
                        {widthPercent.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">📈 Conversion Rate</h4>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{conversionRate}%</p>
                </div>
              </div>
              <div className={`border-2 rounded-lg p-4 ${isHealthy ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <h4 className="font-semibold mb-2">{isHealthy ? '✅ Healthy Pipeline' : '⚠️ Leaky Funnel'}</h4>
                <p className="text-sm text-gray-700">
                  {isHealthy ? 'Good retention rate. System functioning well.' : 'High dropout detected. Investigate barriers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">⚙️ Calibration Deck - System Settings</h3>
        <p className="text-gray-600 mb-6">Tune risk thresholds and configure alerts</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Risk Sensitivity Tuner</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Vidya Drift: {vidyaSensitivity.toFixed(2)}
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={vidyaSensitivity}
                    onChange={(e) => setVidyaSensitivity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Bio-Barrier: {bioBarrierThreshold.toFixed(2)}
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={bioBarrierThreshold}
                    onChange={(e) => setBioBarrierThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Poshan Risk: {poshanThreshold.toFixed(2)}
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={poshanThreshold}
                    onChange={(e) => setPoshanThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Bharat Mode</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${language === 'en' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  English
                </button>
                <button onClick={() => setLanguage('hi')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${language === 'hi' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  हिंदी
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-gray-900">Alert Dispatch</h4>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={alertsEnabled} onChange={(e) => setAlertsEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded" />
                  <span className="text-sm font-medium text-gray-700">✅ WhatsApp Alerts</span>
                </label>
                <input type="tel" placeholder="+91-XXXXX-XXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Simulation Mode</h4>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={simulationMode} onChange={(e) => setSimulationMode(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded" />
                <span className="text-sm font-medium text-gray-700">🔮 War Game Mode</span>
              </label>
              {simulationMode && (
                <div className="mt-3 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                  <p className="text-xs text-purple-900 font-semibold">Stress Test Active</p>
                  <p className="text-xs text-purple-800">Simulating 20% drop in food supply</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVidyaDrift = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎓 Vidya Drift - Education Access Monitor</h3>
        <p className="text-gray-600 mb-6">Tracking school-age children (5-17) at risk of digital exclusion</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="district" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enrollment" fill="#f59e0b" name="Enrollment" />
              <Bar dataKey="updates" fill="#10b981" name="Updates" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ High Risk Districts</h4>
              {districtData.slice(0, 5).map((d, i) => {
                const driftPercent = Math.round((1 - d.updates/d.enrollment) * 100);
                return (
                  <div key={i} className="flex justify-between py-2 border-b border-red-100 last:border-0">
                    <span className="text-sm text-gray-700">{d.district}</span>
                    <span className={`text-sm font-semibold ${driftPercent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {driftPercent < 0 ? Math.abs(driftPercent) : `+${driftPercent}`}% Drift
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t('criticalZones'), value: metrics.criticalZones, icon: AlertTriangle, color: 'red' },
          { label: t('ghostVillages'), value: metrics.ghostCount, icon: Ghost, color: 'orange' },
          { label: t('poshanRisk'), value: metrics.poshanRisk, icon: Baby, color: 'blue' },
          { label: t('bioBarrierRate'), value: `${metrics.bioBarrierRate}%`, icon: Shield, color: 'purple' }
        ].map((item, idx) => (
          <div key={idx} className={`bg-white rounded-lg shadow-md border-l-4 border-${item.color}-600 p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
              </div>
              <div className={`bg-${item.color}-100 rounded-full p-3`}>
                <item.icon className={`w-6 h-6 text-${item.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Survival Monitor Preview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" dataKey="bioBarrierScore" />
              <YAxis type="number" dataKey="poshanScore" />
              <Tooltip />
              <Scatter data={survivalData.slice(0, 20)} fill="#dc2626" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Health</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'survival': return renderSurvivalMonitor();
      case 'vidya': return renderVidyaDrift();
      case 'ghost': return renderGhostHunter();
      case 'migrant': return renderNomadRadar();
      case 'funnel': return renderFutureHealth();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };
    // 🔥 LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">
            Loading Project Sanjeevani Data…
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  {/* Logo Placeholder */}
                  <div className="flex items-center gap-3">
  <img
    src={SanjeevaniLogo}
    alt="Project Sanjeevani Logo"
    className="w-10 h-10 rounded-lg shadow-lg object-contain"
  />
  
</div>

                  <div>
                    <h1 className="text-lg font-bold">SANJEEVANI</h1>
                    <p className="text-xs text-blue-300">Digital India</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-blue-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button onClick={() => setSidebarOpen(true)} className="mx-auto text-blue-300 hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        <nav className="flex-1 py-6 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                activeSection === item.id ? 'bg-blue-800 border-l-4 border-orange-400 text-white' : 'text-blue-200 hover:bg-blue-800'
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-blue-800">
          {sidebarOpen ? (
            <div className="text-xs text-blue-300">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                <span>Ministry of Electronics</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1800-XXX-XXXX</span>
              </div>
            </div>
          ) : (
            <Building2 className="w-6 h-6 mx-auto text-blue-300" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm">Government of India</span>
                </div>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">System Online</span>
                </div>
                {simulationMode && (
                  <>
                    <div className="h-6 w-px bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600 animate-pulse" />
                      <span className="text-sm font-medium text-purple-600">Simulation Mode</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search PIN codes, districts, states..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  />

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-700">
                          {searchResults.length} results found
                        </p>
                      </div>
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSearchResult(result)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="font-mono text-sm font-semibold text-gray-900">
                                  PIN: {result.pincode}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {result.district_normalized}, {result.state_normalized}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                result.Vidya_Drift_Status === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                result.Vidya_Drift_Status === 'BLOCKED' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {result.Vidya_Drift_Status}
                              </span>
                              {result.Ghost_Status === 'GHOST' && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  👻 GHOST
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <span className="text-xs text-gray-500">
                              Students: {result.enrollment_5_17}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              Infants: {result.enrollment_0_5}
                            </span>
                            {result.Poshan_Panic_Status === 'CRITICAL' && (
                              <>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-red-600 font-semibold">
                                  🍼 Poshan Risk
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                      <div className="p-2 bg-gray-50 text-center">
                        <button
                          onClick={() => setShowSearchResults(false)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Close Results
                        </button>
                      </div>
                    </div>
                  )}

                  {/* No Results Message */}
                  {showSearchResults && searchQuery && searchResults.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No results found for "{searchQuery}"</p>
                      <button
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {alertsEnabled && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Admin Officer</p>
                    <p className="text-xs text-gray-600">Ministry Dashboard</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">AO</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict('ALL'); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showCriticalOnly} onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
              <span className="text-sm font-medium text-gray-700">🚨 Show Critical Only</span>
            </label>
          </div>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>

        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>© 2026 Government of India • National Informatics Centre</span>
            <div className="flex items-center gap-4">
              <span>Last Updated: {new Date().toLocaleString()}</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ProjectSanjeevani;