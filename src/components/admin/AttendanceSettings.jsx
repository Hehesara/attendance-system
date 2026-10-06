import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Settings, CheckCircle2 } from 'lucide-react';

export default function AttendanceSettings() {
  const { settings, updateSettings } = useAttendance();

  const [threshold, setThreshold] = useState(settings.minimumThreshold || 75);
  const [academicYear, setAcademicYear] = useState(settings.academicYear || '2026-2027');
  const [semesterTerm, setSemesterTerm] = useState(settings.semesterTerm || 'Odd Semester (Term 1)');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      minimumThreshold: Number(threshold),
      academicYear,
      semesterTerm,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Attendance Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure institutional attendance rules and academic terms</p>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Attendance settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Threshold Card matching original AdminView styling */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900">Attendance Minimum Threshold</h3>
              <p className="text-xs text-slate-500">Alert triggers when attendance drops below this mark</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="50"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-20 border border-slate-200 rounded-lg px-3 py-1.5 text-center text-sm font-bold text-slate-800 bg-white"
            />
            <span className="text-sm font-semibold text-slate-600">%</span>
          </div>
        </div>

        {/* Academic Terms Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Academic Term Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Semester Term</label>
              <input
                type="text"
                value={semesterTerm}
                onChange={(e) => setSemesterTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
