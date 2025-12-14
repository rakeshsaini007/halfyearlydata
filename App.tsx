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
        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900' 
        : 'bg-red-50/95 border-red-200 text-red-900'
    }`}>
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
        {type === 'success' ? <Icons.Check /> : <Icons.Alert />}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 relative">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
              <Icons.School />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              EduData <span className="text-indigo-600">Portal</span>
            </h1>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 hidden sm:block">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Toast Container */}
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12 text-center animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
            School Data Entry
          </h2>
          <p className="text-slate-500 mb-8 text-lg font-medium">
            Enter UDISE code to manage student records.
          </p>

          <div className="relative group max-w-lg mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <form onSubmit={handleSearch} className="relative flex p-1.5 bg-white rounded-2xl shadow-xl border border-slate-100">
              <input
                type="text"
                value={udiseInput}
                onChange={(e) => setUdiseInput(e.target.value)}
                placeholder="Ex: 9050300106"
                className="w-full pl-5 pr-4 py-3 bg-transparent text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-semibold shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[50px] sm:min-w-[120px]"
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
            
            {/* School Info Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className={`h-2 w-full bg-gradient-to-r ${isUpdateMode ? 'from-amber-400 via-orange-500 to-amber-600' : 'from-indigo-500 via-purple-500 to-blue-500'}`}></div>
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 leading-tight">{schoolDetails.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                       <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold bg-slate-100 px-3 py-1 rounded-md">
                          <span className="uppercase text-xs tracking-wider text-slate-400">UDISE</span>
                          <span className="text-slate-700">{schoolDetails.udise}</span>
                       </div>
                       <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold bg-slate-100 px-3 py-1 rounded-md">
                          <span className="uppercase text-xs tracking-wider text-slate-400">Panchayat</span>
                          <span className="text-slate-700">{schoolDetails.panchayat}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isUpdateMode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm animate-bounce-subtle">
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        UPDATE MODE
                      </span>
                    )}
                    <span className={`px-5 py-2 rounded-lg text-sm font-bold tracking-wide shadow-sm border ${
                      schoolDetails.type === 'PS' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      schoolDetails.type === 'UPS' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      {schoolDetails.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div>
              <div className="flex items-center justify-between mb-6 px-2">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Classwise Enrollment
                 </h3>
                 <div className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
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
                      className={`relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${theme.border} ${theme.bg}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Color Accent Bar */}
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.accent}`}></div>

                      <div className="p-5">
                        {/* Card Header */}
                        <div className="flex justify-between items-center mb-5">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm ${theme.badgeBg} ${theme.badgeText}`}>
                              {cls}
                           </div>
                           <span className={`text-xs font-bold uppercase tracking-widest ${theme.subtext}`}>Class</span>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-5">
                          <div>
                            <label className={`block text-xs font-extrabold uppercase mb-2 ml-1 tracking-wide ${theme.subtext}`}>Enrolled</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={data.enrolled || ''}
                              onChange={(e) => handleClassDataChange(cls, 'enrolled', e.target.value)}
                              className={`w-full px-4 py-3 bg-white border-2 rounded-xl outline-none font-bold text-lg text-slate-900 text-center transition-all shadow-sm ${theme.inputBorder} ${theme.focusRing} focus:border-transparent focus:ring-4 focus:ring-opacity-20`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-extrabold uppercase mb-2 ml-1 tracking-wide ${theme.subtext}`}>Appeared</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={data.appeared || ''}
                              onChange={(e) => handleClassDataChange(cls, 'appeared', e.target.value)}
                              className={`w-full px-4 py-3 bg-white border-2 rounded-xl outline-none font-bold text-lg text-center transition-all shadow-sm ${
                                isInvalid 
                                  ? 'border-red-400 text-red-600 focus:ring-red-400 bg-red-50' 
                                  : `${theme.inputBorder} text-slate-900 ${theme.focusRing} focus:border-transparent focus:ring-4 focus:ring-opacity-20`
                              }`}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        {/* Error Message */}
                        <div className={`mt-4 transition-all duration-300 ${isInvalid ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}`}>
                          <div className="text-center">
                            <span className="inline-block text-[10px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
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
                  w-full sm:w-auto group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/30
                  ${loading ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${isUpdateMode ? 'from-amber-500 to-orange-600' : 'from-indigo-600 to-blue-600'} transition-all duration-300 group-hover:scale-110`}></div>
                <div className="relative flex items-center justify-center gap-3 px-12 py-4 text-white font-bold text-lg tracking-wide">
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
