import React, { useState } from 'react';
import { Shield, User, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function Login({ onLogin }) {
  const { login } = useAttendance();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('alex.j@college.edu');
  const [password, setPassword] = useState('101');
  const [studentPersona, setStudentPersona] = useState('studentAlex');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'admin') {
      setEmail('admin@college.edu');
      setPassword('admin123');
    } else if (newRole === 'teacher') {
      setEmail('sharma@college.edu');
      setPassword('teacher123');
    } else if (newRole === 'student') {
      if (studentPersona === 'studentAlex') {
        setEmail('alex.j@college.edu');
        setPassword('101');
      } else {
        setEmail('rohan.s@college.edu');
        setPassword('102');
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (onLogin) {
        await onLogin({ email, password, role });
      } else {
        await login({ email, password, role });
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-2">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AttendTrack Portal</h1>
          <p className="text-xs text-slate-500">Sign in to access your attendance management system</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          {['student', 'teacher', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              className={`py-2 text-xs font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                role === r
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Subtle Student Persona Selector */}
        {role === 'student' && (
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="studentPersona"
                checked={studentPersona === 'studentAlex'}
                onChange={() => {
                  setStudentPersona('studentAlex');
                  setEmail('alex.j@college.edu');
                  setPassword('101');
                }}
                className="text-indigo-600"
              />
              <span>Alex Johnson (Regular)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="studentPersona"
                checked={studentPersona === 'studentRohan'}
                onChange={() => {
                  setStudentPersona('studentRohan');
                  setEmail('rohan.s@college.edu');
                  setPassword('102');
                }}
                className="text-indigo-600"
              />
              <span>Rohan (Defaulter)</span>
            </label>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email / Student ID</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In as <span className="capitalize">{role}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}