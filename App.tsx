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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
         <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Floating Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Icons.School />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
              EduData Portal
            </h1>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 hidden sm:block">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Toast Container */}
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}

      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-10 text-center animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            School Data Entry
          </h2>
          <p className="text-slate-600 mb-8 text-lg">
            Enter UDISE code to fetch details and update enrollment statistics.
          </p>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row bg-white rounded-xl shadow-xl overflow-hidden p-2">
              <div className="flex-grow flex items-center px-4">
                <div className="text-slate-400 mr-3">
                   <Icons.Search />
                </div>
                <input
                  type="text"
                  value={udiseInput}
                  onChange={(e) => setUdiseInput(e.target.value)}
                  placeholder="Enter UDISE Code (e.g. 9050300106)"
                  className="w-full py-3 bg-transparent text-lg font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 sm:mt-0 sm:ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Icons.Loader /> : <span>Fetch Data</span>}
              </button>
            </form>
          </div>
        </div>

        {/* Content Area */}
        {schoolDetails && (
          <div className="animate-[fadeInUp_0.6s_ease-out_forwards] space-y-8">
            
            {/* School Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden relative group">
              {/* Decorative accent top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${isUpdateMode ? 'from-amber-400 via-orange-500 to-amber-600' : 'from-indigo-500 via-purple-500 to-blue-500'}`}></div>
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{schoolDetails.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm font-medium">
                       <span>UDISE: {schoolDetails.udise}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span>{schoolDetails.panchayat}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isUpdateMode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-bounce-subtle">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        UPDATE MODE
                      </span>
                    )}
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm border ${
                      schoolDetails.type === 'PS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      schoolDetails.type === 'UPS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {schoolDetails.type}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Total Classes</span>
                      <span className="font-semibold text-slate-700">{relevantClasses.length} Grades</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Status</span>
                      <span className="font-semibold text-slate-700">{isUpdateMode ? 'Existing Record' : 'New Entry'}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Action</span>
                      <span className={`font-semibold ${isUpdateMode ? 'text-amber-600' : 'text-indigo-600'}`}>
                        {isUpdateMode ? 'Modify & Update' : 'Fill & Save'}
                      </span>
                   </div>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div>
              <div className="flex items-center justify-between mb-6 px-1">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Class Enrollment
                    <span className="text-xs font-normal text-slate-400 bg-white border px-2 py-0.5 rounded-md shadow-sm hidden sm:inline-block">
                      Only numbers allowed
                    </span>
                 </h3>
                 <div className="text-sm text-slate-500 font-medium">
                    Appeared ≤ Enrolled
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relevantClasses.map((cls, index) => {
                  const data = formData[cls] || { enrolled: '', appeared: '' };
                  const isInvalid = parseInt(data.appeared) > parseInt(data.enrolled);

                  return (
                    <div 
                      key={cls} 
                      className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                        isInvalid ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 border border-indigo-100">
                          {cls}
                        </div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Class</span>
                      </div>

                      <div className="space-y-4">
                        <div className="relative group/input">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">ENROLLED</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={data.enrolled || ''}
                            onChange={(e) => handleClassDataChange(cls, 'enrolled', e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold text-center text-slate-900 transition-all group-hover/input:bg-white"
                            placeholder="0"
                          />
                        </div>
                        <div className="relative group/input">
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">APPEARED</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={data.appeared || ''}
                            onChange={(e) => handleClassDataChange(cls, 'appeared', e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none font-semibold text-center transition-all group-hover/input:bg-white ${
                              isInvalid 
                                ? 'bg-red-50 border-red-300 focus:ring-red-200 text-red-600' 
                                : 'bg-slate-50 border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900'
                            }`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      
                      {isInvalid && (
                        <div className="mt-3 text-center">
                          <span className="inline-block text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                            Check Values
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Footer */}
            <div className="sticky bottom-6 z-20 flex justify-center pb-safe">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`
                  group relative overflow-hidden rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/30
                  ${loading ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${isUpdateMode ? 'from-amber-500 to-orange-600' : 'from-indigo-600 to-blue-600'} transition-all duration-300 group-hover:scale-110`}></div>
                <div className="relative flex items-center gap-3 px-10 py-4 text-white font-bold text-lg tracking-wide">
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
