import React, { useState } from 'react';
import { useAttendance } from './context/AttendanceContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Modal from './components/common/Modal';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import ClassManagement from './components/admin/ClassManagement';
import SubjectManagement from './components/admin/SubjectManagement';
import StudentManagement from './components/admin/StudentManagement';
import TeacherManagement from './components/admin/TeacherManagement';
import AdminReportsView from './components/admin/AdminReportsView';
import AttendanceSettings from './components/admin/AttendanceSettings';

// Teacher Components
import TeacherDashboard from './components/teacher/TeacherDashboard';
import MyClassesView from './components/teacher/MyClassesView';
import MarkAttendanceView from './components/teacher/MarkAttendanceView';
import AttendanceHistoryView from './components/teacher/AttendanceHistoryView';
import TeacherReportsView from './components/teacher/TeacherReportsView';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import MyAttendanceView from './components/student/MyAttendanceView';
import StudentHistoryView from './components/student/StudentHistoryView';
import StudentStatisticsView from './components/student/StudentStatisticsView';

import { Menu, LogOut, Loader2, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const { currentUser, isLoading, login, logout, changePassword } = useAttendance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium text-slate-300">Connecting to Attendance System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={(creds) => login(creds)} />;
  }

  const handleSignOut = () => {
    logout();
    setActiveTab('dashboard');
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in all required fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await changePassword(passwordForm);
      setPasswordFeedback(res?.message || 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordFeedback(null);
      }, 1500);
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message || err?.message || 'Failed to update password'
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Sidebar
        role={currentUser.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSignOut={handleSignOut}
        onOpenChangePassword={() => {
          setPasswordError(null);
          setPasswordFeedback(null);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setIsChangePasswordOpen(true);
        }}
      />

      <main className="w-full flex-1 p-6 md:p-10 max-w-7xl mx-auto">
        {/* Exact Header matching User Reference Screenshot */}
        <header className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back, {currentUser.name.toLowerCase().includes('admin') ? 'admin' : currentUser.name}
              </h1>
              <p className="text-sm text-slate-500">
                Role: <span className="capitalize font-semibold text-indigo-600">{currentUser.role}</span> | {currentUser.department}
                {currentUser.rollNo ? ` | Roll No: ${currentUser.rollNo}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPasswordError(null);
                setPasswordFeedback(null);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangePasswordOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              title="Change Account Password"
            >
              <Key className="w-4 h-4 text-slate-500" />
              <span>Change Password</span>
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}

        {/* ADMIN VIEWS */}
        {currentUser.role === 'admin' && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'classes' && <ClassManagement />}
            {activeTab === 'subjects' && <SubjectManagement />}
            {activeTab === 'students' && <StudentManagement />}
            {activeTab === 'teachers' && <TeacherManagement />}
            {activeTab === 'reports' && <AdminReportsView />}
            {activeTab === 'settings' && <AttendanceSettings />}
          </>
        )}

        {/* TEACHER VIEWS */}
        {currentUser.role === 'teacher' && (
          <>
            {activeTab === 'dashboard' && <TeacherDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'my-classes' && <MyClassesView setActiveTab={setActiveTab} />}
            {activeTab === 'mark' && <MarkAttendanceView />}
            {activeTab === 'history' && <AttendanceHistoryView />}
            {activeTab === 'reports' && <TeacherReportsView />}
          </>
        )}

        {/* STUDENT VIEWS */}
        {currentUser.role === 'student' && (
          <>
            {activeTab === 'dashboard' && <StudentDashboard setActiveTab={setActiveTab} />}
            {activeTab === 'my-attendance' && <MyAttendanceView />}
            {activeTab === 'history' && <StudentHistoryView />}
            {activeTab === 'statistics' && <StudentStatisticsView />}
          </>
        )}
      </main>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setPasswordError(null);
          setPasswordFeedback(null);
        }}
        title="Change Password"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
          {passwordFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordFeedback}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              placeholder="Enter current password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmittingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}