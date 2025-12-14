import React, { useState, useCallback } from 'react';
import { fetchSchoolDetails, submitSchoolData } from './services/googleSheetService';
import { SchoolDetails, FormDataMap } from './types';
import { CLASS_CONFIG, GOOGLE_SCRIPT_URL } from './constants';
import { Loader2, Search, Save, School, AlertCircle, CheckCircle2 } from 'lucide-react';

// Using lucide-react for icons - Assuming standard library availability or replace with SVG
// Since I cannot install packages, I will create simple SVG components if needed, 
// but using lucide-react imports is standard for this role. 
// If lucide-react is not available in environment, these will break, so I will define inline SVGs for robustness.

const Icons = {
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
};

const App: React.FC = () => {
  const [udiseInput, setUdiseInput] = useState('');
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null);
  const [formData, setFormData] = useState<FormDataMap>({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Derived state for classes based on school type
  const getRelevantClasses = useCallback(() => {
    if (!schoolDetails) return [];
    const type = schoolDetails.type.toUpperCase();
    if (type === 'PS') return CLASS_CONFIG.PS;
    if (type === 'UPS') return CLASS_CONFIG.UPS;
    if (type === 'COMP' || type === 'COMPOSITE') return CLASS_CONFIG.COMP;
    return []; // Default or error
  }, [schoolDetails]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udiseInput) return;

    if (GOOGLE_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
      setMessage({ type: 'error', text: 'Please configure the Google Script URL in constants.ts first.' });
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
          setMessage({ type: 'success', text: 'Existing data found. Mode: Update' });
        } else {
          setFormData({});
          setMessage(null);
        }
      } else {
        setMessage({ type: 'error', text: result.message || 'School not found.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClassDataChange = (classNum: number, field: 'enrolled' | 'appeared', value: string) => {
    // Only allow numeric input
    if (value && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({
      ...prev,
      [classNum]: {
        ...prev[classNum],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!schoolDetails) return;

    // Validate
    const classes = getRelevantClasses();
    for (const cls of classes) {
      const data = formData[cls] || { enrolled: '', appeared: '' };
      const enr = parseInt(data.enrolled || '0', 10);
      const app = parseInt(data.appeared || '0', 10);

      if (app > enr) {
        setMessage({ type: 'error', text: `Class ${cls}: Appeared cannot be greater than Enrolled.` });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        // After success, we effectively have existing data now
        setSchoolDetails(prev => prev ? { ...prev, existingData: formData } : null);

        // Hide message after 5 seconds but keep form state
        setTimeout(() => {
            setMessage(null);
        }, 5000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Submission failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred during submission.' });
    } finally {
      setLoading(false);
    }
  };

  const relevantClasses = getRelevantClasses();
  const isUpdateMode = !!schoolDetails?.existingData;

  return (
    <div className="min-h-screen pb-12 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Student Data Entry</h1>
          <p className="text-blue-100 mt-2 text-sm opacity-90">Manage enrollment and appeared statistics efficiently.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 -mt-4">
        
        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="udise" className="block text-sm font-medium text-slate-700 mb-1">
                Enter UDISE Code
              </label>
              <input
                id="udise"
                type="text"
                value={udiseInput}
                onChange={(e) => setUdiseInput(e.target.value)}
                placeholder="e.g. 9050300106"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-w-[120px]"
            >
              {loading ? <Icons.Loader /> : <Icons.Search />}
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {message.type === 'error' ? <Icons.Alert /> : <Icons.Check />}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* School Details & Form */}
        {schoolDetails && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* School Info Card */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              {isUpdateMode && (
                 <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold rounded-bl-lg border-l border-b border-amber-200">
                    UPDATE MODE
                 </div>
              )}
              <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">School Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Name</label>
                  <p className="text-lg font-medium text-slate-900">{schoolDetails.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nyay Panchayat</label>
                  <p className="text-lg font-medium text-slate-900">{schoolDetails.panchayat}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">School Type</label>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-bold ${
                    schoolDetails.type === 'PS' ? 'bg-green-100 text-green-700' :
                    schoolDetails.type === 'UPS' ? 'bg-amber-100 text-amber-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {schoolDetails.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Class Data Grid */}
            <div>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Class Enrollment Data</h3>
                  <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded border">
                    Validating: Appeared ≤ Enrolled
                  </span>
               </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {relevantClasses.map((cls) => {
                  const data = formData[cls] || { enrolled: '', appeared: '' };
                  const isInvalid = parseInt(data.appeared) > parseInt(data.enrolled);

                  return (
                    <div 
                      key={cls} 
                      className={`bg-white rounded-lg shadow-sm border p-4 transition-all duration-200 hover:shadow-md ${
                        isInvalid ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded text-sm">Class {cls}</span>
                        {isInvalid && <span className="text-xs font-bold text-red-600">Error</span>}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Enrolled</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={data.enrolled || ''}
                            onChange={(e) => handleClassDataChange(cls, 'enrolled', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-semibold text-center"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Appeared</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={data.appeared || ''}
                            onChange={(e) => handleClassDataChange(cls, 'appeared', e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-50 border rounded focus:ring-2 outline-none text-sm font-semibold text-center ${
                              isInvalid 
                              ? 'border-red-300 focus:ring-red-500 text-red-700 bg-white' 
                              : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="sticky bottom-6 z-10">
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`${
                    isUpdateMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white text-lg font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 w-full md:w-auto justify-center`}
                >
                  {loading ? (
                    <>
                      <Icons.Loader />
                      <span>{isUpdateMode ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      {isUpdateMode ? <Icons.Refresh /> : <Icons.Save />}
                      <span>{isUpdateMode ? 'Update Data' : 'Submit Data'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
