import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import {
  AlertTriangle, Users, School, Baby, Ghost, TrendingUp,
  MapPin, Activity, LayoutDashboard, FileText, Settings,
  Bell, Download, Search, Filter, Menu, X, Shield,
  Building2, Phone
} from 'lucide-react';

// ============================================
// IMPORT REAL DATA
// ============================================
import projectData from './project_data.json';

// ============================================
// MAIN COMPONENT STARTS HERE
// ============================================




const ProjectSanjeevani = () => {
  const [data] = useState(projectData);
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Get unique values for filters
  const states = useMemo(() => ['ALL', ...new Set(data.map(d => d.state_normalized))], [data]);
  const districts = useMemo(() => {
    if (selectedState === 'ALL') return ['ALL'];
    return ['ALL', ...new Set(data.filter(d => d.state_normalized === selectedState).map(d => d.district_normalized))];
  }, [data, selectedState]);
  const months = useMemo(() => ['ALL', ...new Set(data.map(d => d.Month))], [data]);

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
    ).slice(0, 10); // Limit to 10 results

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

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data;

    if (selectedState !== 'ALL') {
      filtered = filtered.filter(d => d.state_normalized === selectedState);
    }
    if (selectedDistrict !== 'ALL') {
      filtered = filtered.filter(d => d.district_normalized === selectedDistrict);
    }
    if (selectedMonth !== 'ALL') {
      filtered = filtered.filter(d => d.Month === selectedMonth);
    }
    if (showCriticalOnly) {
      filtered = filtered.filter(d =>
        d.Vidya_Drift_Status === 'CRITICAL' ||
        d.Bio_Barrier_Status === 'BLOCKED' ||
        d.Poshan_Panic_Status === 'CRITICAL' ||
        d.Ghost_Status === 'GHOST'
      );
    }

    return filtered;
  }, [data, selectedState, selectedDistrict, selectedMonth, showCriticalOnly]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const ghostCount = filteredData.filter(d => d.Ghost_Status === 'GHOST').length;
    const poshanRisk = filteredData.filter(d => d.Poshan_Panic_Status === 'CRITICAL')
      .reduce((sum, d) => sum + d.enrollment_0_5, 0);
    const bioBarrierRate = (filteredData.filter(d => d.Bio_Barrier_Status === 'BLOCKED').length / filteredData.length * 100).toFixed(1);
    const criticalZones = filteredData.filter(d => d.Vidya_Drift_Status === 'CRITICAL').length;

    return { ghostCount, poshanRisk, bioBarrierRate, criticalZones };
  }, [filteredData]);

  // Prepare chart data
  const districtData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(d => {
      if (!grouped[d.district_normalized]) {
        grouped[d.district_normalized] = {
          district: d.district_normalized,
          enrollment: 0,
          updates: 0
        };
      }
      grouped[d.district_normalized].enrollment += d.enrollment_5_17;
      grouped[d.district_normalized].updates += d.bio_updates_18_plus;
    });
    return Object.values(grouped).slice(0, 10);
  }, [filteredData]);

  const migrantData = useMemo(() => {
    return filteredData.slice(0, 30).map(d => ({
      enrollment: d.enrollment_5_17,
      demoUpdates: d.demo_updates,
      status: d.Migrant_Status,
      district: d.district_normalized
    }));
  }, [filteredData]);

  const funnelData = useMemo(() => {
    const total_0_5 = filteredData.reduce((sum, d) => sum + d.enrollment_0_5, 0);
    const total_5_17 = filteredData.reduce((sum, d) => sum + d.enrollment_5_17, 0);
    const total_adults = filteredData.reduce((sum, d) => sum + Math.floor(d.bio_updates_18_plus / 10), 0);

    return [
      { stage: 'Infants (0-5)', value: total_0_5 },
      { stage: 'Students (5-17)', value: total_5_17 },
      { stage: 'Adults (18+)', value: total_adults }
    ];
  }, [filteredData]);

  const radarData = useMemo(() => {
    const critical = filteredData.filter(d => d.Vidya_Drift_Status === 'CRITICAL').length;
    const blocked = filteredData.filter(d => d.Bio_Barrier_Status === 'BLOCKED').length;
    const ghost = filteredData.filter(d => d.Ghost_Status === 'GHOST').length;
    const poshan = filteredData.filter(d => d.Poshan_Panic_Status === 'CRITICAL').length;
    const migrant = filteredData.filter(d => d.Migrant_Status === 'NOMAD').length;

    return [
      { category: 'Vidya Drift', value: critical, fullMark: filteredData.length },
      { category: 'Bio Barrier', value: blocked, fullMark: filteredData.length },
      { category: 'Ghost PINs', value: ghost, fullMark: filteredData.length },
      { category: 'Poshan Risk', value: poshan, fullMark: filteredData.length },
      { category: 'Migration', value: migrant, fullMark: filteredData.length }
    ];
  }, [filteredData]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
    { id: 'vidya', icon: School, label: 'Vidya Drift Monitor', badge: metrics.criticalZones },
    { id: 'barrier', icon: AlertTriangle, label: 'Bio-Barrier Analysis', badge: null },
    { id: 'poshan', icon: Baby, label: 'Poshan Panic Alert', badge: metrics.poshanRisk > 0 ? metrics.poshanRisk : null },
    { id: 'ghost', icon: Ghost, label: 'Ghost PIN Hunter', badge: metrics.ghostCount },
    { id: 'migrant', icon: MapPin, label: 'Migrant Tracker', badge: null },
    { id: 'reports', icon: FileText, label: 'Generate Reports', badge: null },
    { id: 'settings', icon: Settings, label: 'System Settings', badge: null }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Zones</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.criticalZones}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2 font-medium">Immediate Action Required</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ghost Villages</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.ghostCount}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Ghost className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-2 font-medium">Zero Digital Activity</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Poshan Risk</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.poshanRisk}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Baby className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 font-medium">Infants at Risk</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bio-Barrier Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.bioBarrierRate}%</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2 font-medium">Auth Failure Rate</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Assessment Radar</h3>
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#6b7280' }} />
              <Radar name="Risk Level" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Demographic Funnel Analysis</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fill: '#6b7280' }} />
              <YAxis type="category" dataKey="stage" tick={{ fill: '#6b7280' }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">District-wise Vidya Drift Analysis</h3>
            <School className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={districtData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="district" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="enrollment" fill="#f59e0b" name="Total Enrollment (5-17)" />
              <Bar dataKey="updates" fill="#10b981" name="Biometric Updates" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderVidyaDrift = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🎓 Vidya Drift - Education Access Monitor</h3>
        <p className="text-gray-600 mb-6">Tracking school-age children (5-17) at risk of digital exclusion from education systems.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="district" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="enrollment" fill="#f59e0b" name="Enrollment" />
                <Bar dataKey="updates" fill="#10b981" name="Active Updates" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ High Risk Districts</h4>
              {districtData.slice(0, 5).map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                  <span className="text-sm text-gray-700">{d.district}</span>
                  <span className="text-sm font-semibold text-red-600">{Math.round((1 - d.updates/d.enrollment) * 100)}% Drift</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Key Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Total Students Monitored</span>
                  <span className="font-semibold text-blue-600">{filteredData.reduce((s, d) => s + d.enrollment_5_17, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Active Biometric Updates</span>
                  <span className="font-semibold text-blue-600">{filteredData.reduce((s, d) => s + d.bio_updates_18_plus, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700">Coverage Rate</span>
                  <span className="font-semibold text-green-600">
                    {((filteredData.filter(d => d.Vidya_Drift_Status === 'SAFE').length / filteredData.length) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMigrantTracker = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🧳 Migrant Boomerang Tracker</h3>
        <p className="text-gray-600 mb-6">Identifying high-churn zones where mobile enrollment camps are needed instead of static centers.</p>

        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey="enrollment" name="Enrollment" tick={{ fill: '#6b7280' }} label={{ value: 'Total Enrollment', position: 'insideBottom', offset: -5 }} />
            <YAxis type="number" dataKey="demoUpdates" name="Demographic Updates" tick={{ fill: '#6b7280' }} label={{ value: 'Address Changes', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Scatter name="Stable Zones" data={migrantData.filter(d => d.status === 'STABLE')} fill="#10b981" />
            <Scatter name="Nomad Zones (High Churn)" data={migrantData.filter(d => d.status === 'NOMAD')} fill="#dc2626" />
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Stable Zones</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{migrantData.filter(d => d.status === 'STABLE').length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900">Nomad Zones</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{migrantData.filter(d => d.status === 'NOMAD').length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Mobile Camps Needed</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{migrantData.filter(d => d.status === 'NOMAD').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataTable = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🎯 PIN Code Intelligence Table</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick filter..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700">PIN Code</th>
              <th className="px-4 py-3 font-semibold text-gray-700">District</th>
              <th className="px-4 py-3 font-semibold text-gray-700">State</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Vidya Status</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Bio Status</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Poshan</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Ghost</th>
            </tr>
          </thead>
          <tbody>
            {(searchQuery && searchResults.length > 0 ? searchResults : filteredData.slice(0, 20)).map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-900">{row.pincode}</td>
                <td className="px-4 py-3 text-gray-700">{row.district_normalized}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{row.state_normalized}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.Vidya_Drift_Status === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    row.Vidya_Drift_Status === 'BLOCKED' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {row.Vidya_Drift_Status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.Bio_Barrier_Status === 'BLOCKED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {row.Bio_Barrier_Status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.Poshan_Panic_Status === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {row.Poshan_Panic_Status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.Ghost_Status === 'GHOST' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {row.Ghost_Status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {Math.min(20, searchQuery && searchResults.length > 0 ? searchResults.length : filteredData.length)} of {searchQuery && searchResults.length > 0 ? searchResults.length : filteredData.length} zones
          {searchQuery && <span className="ml-2 text-blue-600 font-medium">(Filtered by: "{searchQuery}")</span>}
        </span>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Previous</button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'vidya': return renderVidyaDrift();
      case 'migrant': return renderMigrantTracker();
      case 'barrier':
      case 'poshan':
      case 'ghost':
        return renderDataTable();
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Generation</h3>
            <p className="text-gray-600 mb-6">Generate comprehensive reports for policy makers and administrators</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate Monthly Report
            </button>
          </div>
        );
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-orange-400" />
                  <div>
                    <h1 className="text-lg font-bold">SANJEEVANI</h1>
                    <p className="text-xs text-blue-300">Digital India Initiative</p>
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

        {/* Navigation Menu */}
        <nav className="flex-1 py-6 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-800 border-l-4 border-orange-400 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-blue-800">
          {sidebarOpen ? (
            <div className="text-xs text-blue-300">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" />
                <span>Ministry of Electronics & IT</span>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
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
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Admin Officer</p>
                    <p className="text-xs text-gray-600">Ministry Dashboard</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    AO
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('ALL');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Critical Zones Only</span>
            </label>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>© 2026 Government of India</span>
              <span>•</span>
              <span>National Informatics Centre</span>
            </div>
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
