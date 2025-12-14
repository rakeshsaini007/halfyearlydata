import React, { useState, useCallback, useEffect } from 'react';
import { fetchSchoolDetails, submitSchoolData } from './services/googleSheetService';
import { SchoolDetails, FormDataMap } from './types';
import { CLASS_CONFIG, GOOGLE_SCRIPT_URL } from './constants';

// --- Icons ---
const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>,
  School: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
};

// --- Theme Configuration ---
const CLASS_THEMES: Record<number, {
  bg: string;
  border: string;
  text: string;
  subtext: string;
  badgeBg: string;
  badgeText: string;
  focusRing: string;
  accent: string;
  inputBorder: string;
}> = {
  1: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', subtext: 'text-blue-700', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', focusRing: 'focus:ring-blue-500', accent: 'bg-blue-500', inputBorder: 'border-blue-200' },
  2: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', subtext: 'text-emerald-700', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', focusRing: 'focus:ring-emerald-500', accent: 'bg-emerald-500', inputBorder: 'border-emerald-200' },
  3: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', subtext: 'text-violet-700', badgeBg: 'bg-violet-100', badgeText: 'text-violet-700', focusRing: 'focus:ring-violet-500', accent: 'bg-violet-500', inputBorder: 'border-violet-200' },
  4: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', subtext: 'text-rose-700', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', focusRing: 'focus:ring-rose-500', accent: 'bg-rose-500', inputBorder: 'border-rose-200' },
  5: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', subtext: 'text-amber-700', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', focusRing: 'focus:ring-amber-500', accent: 'bg-amber-500', inputBorder: 'border-amber-200' },
  6: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', subtext: 'text-cyan-700', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700', focusRing: 'focus:ring-cyan-500', accent: 'bg-cyan-500', inputBorder: 'border-cyan-200' },
  7: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', subtext: 'text-indigo-700', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-700', focusRing: 'focus:ring-indigo-500', accent: 'bg-indigo-500', inputBorder: 'border-indigo-200' },
  8: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900', subtext: 'text-fuchsia-700', badgeBg: 'bg-fuchsia-100', badgeText: 'text-fuchsia-700', focusRing: 'focus:ring-fuchsia-500', accent: 'bg-fuchsia-500', inputBorder: 'border-fuchsia-200' },
};

const DEFAULT_THEME = { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', subtext: 'text-slate-600', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', focusRing: 'focus:ring-slate-500', accent: 'bg-slate-500', inputBorder: 'border-slate-300' };

// --- Toast Component ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-500 animate-[fadeInUp_0.3s_ease-out] border backdrop-blur-md ${
      type === 'success' 
        ? 'bg-emerald-500/90 border-emerald-400 text-white' 
        : 'bg-red-500/90 border-red-400 text-white'
    }`}>
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-white/20' : 'bg-white/20'}`}>
        {type === 'success' ? <Icons.Check /> : <Icons.Alert />}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
        <Icons.X />
      </button>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [udiseInput, setUdiseInput] = useState('');
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null);
  const [formData, setFormData] = useState<FormDataMap>({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const getRelevantClasses = useCallback(() => {
    if (!schoolDetails) return [];
    const type = schoolDetails.type.toUpperCase();
    if (type === 'PS') return CLASS_CONFIG.PS;
    if (type === 'UPS') return CLASS_CONFIG.UPS;
    if (type === 'COMP' || type === 'COMPOSITE') return CLASS_CONFIG.COMP;
    return [];
  }, [schoolDetails]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udiseInput) return;

    if (GOOGLE_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
      setMessage({ type: 'error', text: 'Google Script URL not configured.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setSchoolDetails(null);
    setFormData({});

    try {
      const result = await fetchSchoolDetails(udiseInput);
      if (result.success && result.data) {
        setSchoolDetails(result.data);
        if (result.data.existingData) {
          setFormData(result.data.existingData);
          setMessage({ type: 'success', text: 'School found! Loaded existing data.' });
        } else {
          setFormData({});
          setMessage(null);
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'School not found.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch data. Check internet connection.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClassDataChange = (classNum: number, field: 'enrolled' | 'appeared', value: string) => {
    if (value && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({
      ...prev,
      [classNum]: { ...prev[classNum], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!schoolDetails) return;

    const classes = getRelevantClasses();
    for (const cls of classes) {
      const data = formData[cls] || { enrolled: '', appeared: '' };
      const enr = parseInt(data.enrolled || '0', 10);
      const app = parseInt(data.appeared || '0', 10);

      if (app > enr) {
        setMessage({ type: 'error', text: `Class ${cls}: 'Appeared' (${app}) cannot exceed 'Enrolled' (${enr}).` });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await submitSchoolData({
        udise: schoolDetails.udise,
        name: schoolDetails.name,
        panchayat: schoolDetails.panchayat,
        type: schoolDetails.type,
        classData: formData,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Data saved successfully!' });
        setSchoolDetails(prev => prev ? { ...prev, existingData: formData } : null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Submission failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Unexpected error during submission.' });
    } finally {
      setLoading(false);
    }
  };

  const relevantClasses = getRelevantClasses();
  const isUpdateMode = !!schoolDetails?.existingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col font-sans text-white relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
         <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
         
         {/* Floating Particles */}
         {[...Array(20)].map((_, i) => (
           <div
             key={i}
             className="absolute w-1 h-1 bg-white rounded-full opacity-30"
             style={{
               top: `${Math.random() * 100}%`,
               left: `${Math.random() * 100}%`,
               animation: `float ${5 + Math.random() * 10}s linear infinite`,
               animationDelay: `${Math.random() * 5}s`
             }}
           />
         ))}
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(5px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
        .animate-bounce-subtle { animation: bounce 2s infinite; }
      `}</style>

      {/* Modern Glass Header */}
      <header className="sticky top-0 z-30 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl text-white shadow-2xl shadow-indigo-500/50 transform hover:scale-110 transition-transform duration-300">
              <Icons.School />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                EduData <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Portal</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Student Records Management</p>
            </div>
          </div>
          <div className="text-xs font-bold text-white/80 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hidden sm:block hover:bg-white/15 transition-all">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Toast Container */}
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
        
        {/* Modern Search Section */}
        <div className="max-w-2xl mx-auto mb-12 text-center animate-fade-in-up">
          <div className="mb-6">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              School Data Entry
            </h2>
            <p className="text-slate-300 text-lg font-medium">
              Enter UDISE code to manage student records
            </p>
          </div>

          <div className="relative group max-w-lg mx-auto">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
            <form onSubmit={handleSearch} className="relative flex p-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
              <input
                type="text"
                value={udiseInput}
                onChange={(e) => setUdiseInput(e.target.value)}
                placeholder="Ex: 9050300106"
                className="w-full pl-6 pr-4 py-4 bg-transparent text-xl font-bold text-white placeholder:text-white/40 placeholder:font-normal outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 rounded-2xl font-bold shadow-lg shadow-indigo-500/50 transition-all duration-300 active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[50px] sm:min-w-[130px] hover:shadow-2xl hover:shadow-indigo-500/60"
              >
                {loading ? <Icons.Loader /> : <span className="hidden sm:inline">Search</span>}
                <span className="sm:hidden"><Icons.Search /></span>
              </button>
            </form>
          </div>
        </div>

        {/* Content Area */}
        {schoolDetails && (
          <div className="animate-[fadeInUp_0.6s_ease-out_forwards] space-y-8">
            
            {/* Premium School Info Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
              <div className={`h-2 w-full ${isUpdateMode ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}></div>
              
              <div className="p-8 sm:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white leading-tight mb-4">{schoolDetails.name}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-2 text-white/80 text-sm font-bold bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                          <span className="uppercase text-xs tracking-wider text-white/50">UDISE</span>
                          <span className="text-white font-black">{schoolDetails.udise}</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/80 text-sm font-bold bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                          <span className="uppercase text-xs tracking-wider text-white/50">Panchayat</span>
                          <span className="text-white font-black">{schoolDetails.panchayat}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isUpdateMode && (
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white border border-amber-300/50 shadow-lg shadow-amber-500/30 animate-bounce-subtle">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        UPDATE MODE
                      </span>
                    )}
                    <span className={`px-6 py-3 rounded-xl text-sm font-black tracking-wide shadow-xl border-2 backdrop-blur-sm ${
                      schoolDetails.type === 'PS' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-emerald-500/30' :
                      schoolDetails.type === 'UPS' ? 'bg-blue-500/20 text-blue-300 border-blue-400/50 shadow-blue-500/30' :
                      'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/30'
                    }`}>
                      {schoolDetails.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Grid Section */}
            <div>
              <div className="flex items-center justify-between mb-8 px-2">
                 <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full"></span>
                    Classwise Enrollment
                 </h3>
                 <div className="text-sm font-black text-white/80 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full shadow-lg border border-white/20">
                    Rule: Appeared ≤ Enrolled
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relevantClasses.map((cls, index) => {
                  const data = formData[cls] || { enrolled: '', appeared: '' };
                  const isInvalid = parseInt(data.appeared) > parseInt(data.enrolled);
                  const theme = CLASS_THEMES[cls] || DEFAULT_THEME;

                  return (
                    <div 
                      key={cls} 
                      className={`relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105 border-2 bg-white/10 backdrop-blur-2xl border-white/20`}
                      style={{ animationDelay: `${index * 100}ms`, animation: 'fadeInUp 0.6s ease-out forwards', opacity: 0 }}
                    >
                      {/* Premium Gradient Accent */}
                      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${
                        cls === 1 ? 'from-blue-400 to-blue-600' :
                        cls === 2 ? 'from-emerald-400 to-emerald-600' :
                        cls === 3 ? 'from-violet-400 to-violet-600' :
                        cls === 4 ? 'from-rose-400 to-rose-600' :
                        cls === 5 ? 'from-amber-400 to-amber-600' :
                        cls === 6 ? 'from-cyan-400 to-cyan-600' :
                        cls === 7 ? 'from-indigo-400 to-indigo-600' :
                        'from-fuchsia-400 to-fuchsia-600'
                      }`}></div>

                      <div className="p-6">
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-6">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-2xl bg-gradient-to-br text-white transform hover:rotate-12 transition-transform duration-300 ${
                             cls === 1 ? 'from-blue-400 to-blue-600' :
                             cls === 2 ? 'from-emerald-400 to-emerald-600' :
                             cls === 3 ? 'from-violet-400 to-violet-600' :
                             cls === 4 ? 'from-rose-400 to-rose-600' :
                             cls === 5 ? 'from-amber-400 to-amber-600' :
                             cls === 6 ? 'from-cyan-400 to-cyan-600' :
                             cls === 7 ? 'from-indigo-400 to-indigo-600' :
                             'from-fuchsia-400 to-fuchsia-600'
                           }`}>
                              {cls}
                           </div>
                           <span className={`text-xs font-black uppercase tracking-widest text-white/60`}>Class</span>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-5">
                          <div>
                            <label className={`block text-xs font-black uppercase mb-3 ml-1 tracking-wider text-white/70`}>Enrolled</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={data.enrolled || ''}
                              onChange={(e) => handleClassDataChange(cls, 'enrolled', e.target.value)}
                              className={`w-full px-5 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl outline-none font-black text-xl text-white text-center transition-all shadow-lg hover:shadow-2xl hover:bg-white/15 focus:bg-white/20 focus:border-white/40 focus:scale-105`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-black uppercase mb-3 ml-1 tracking-wider text-white/70`}>Appeared</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={data.appeared || ''}
                              onChange={(e) => handleClassDataChange(cls, 'appeared', e.target.value)}
                              className={`w-full px-5 py-4 backdrop-blur-sm border-2 rounded-2xl outline-none font-black text-xl text-center transition-all shadow-lg hover:shadow-2xl ${
                                isInvalid 
                                  ? 'border-red-400 text-red-300 bg-red-500/20 focus:border-red-300 animate-pulse' 
                                  : `bg-white/10 border-white/20 text-white hover:bg-white/15 focus:bg-white/20 focus:border-white/40 focus:scale-105`
                              }`}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        {/* Error Message */}
                        <div className={`mt-4 transition-all duration-300 ${isInvalid ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}`}>
                          <div className="text-center">
                            <span className="inline-block text-[10px] font-black text-red-200 bg-red-500/40 px-3 py-1 rounded-full border border-red-400/50 shadow-lg">
                              CHECK VALUE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="sticky bottom-6 z-20 flex justify-center pb-safe px-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`
                  w-full sm:w-auto group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/50 border border-white/20
                  ${loading ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${isUpdateMode ? 'from-amber-500 to-orange-600' : 'from-indigo-600 to-purple-600'} transition-all duration-300 group-hover:scale-110`}></div>
                <div className="relative flex items-center justify-center gap-3 px-12 py-5 text-white font-black text-lg tracking-wide">
                  {loading ? (
                    <>
                      <Icons.Loader />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {isUpdateMode ? <Icons.Refresh /> : <Icons.Save />}
                      <span>{isUpdateMode ? 'Update Records' : 'Save Records'}</span>
                      <Icons.ChevronRight />
                    </>
                  )}
                </div>
              </button>
            </div>
            
            {/* Bottom Spacer */}
            <div className="h-12"></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;