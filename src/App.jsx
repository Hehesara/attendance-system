import React, { useState } from 'react';
import { useAttendance } from './context/AttendanceContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';

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

import { Menu, LogOut, Loader2 } from 'lucide-react';

export default function App() {
  const { currentUser, isLoading, login, logout } = useAttendance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleQuickSwitch = async (personaKey) => {
    try {
      await login(personaKey);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Quick switch failed:', err);
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

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Sign Out
          </button>
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

      {/* Floating Discreet Persona Switcher */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md p-1 rounded-xl flex items-center gap-1 text-xs">
        <span className="px-2 text-slate-400 font-medium text-[11px]">Role Switch:</span>
        <button
          onClick={() => handleQuickSwitch('admin')}
          className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            currentUser.role === 'admin' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Admin
        </button>
        <button
          onClick={() => handleQuickSwitch('teacherSharma')}
          className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            currentUser.role === 'teacher' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Teacher
        </button>
        <button
          onClick={() => handleQuickSwitch('studentAlex')}
          className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            currentUser.role === 'student' && currentUser.name?.includes('Alex') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Student
        </button>
        <button
          onClick={() => handleQuickSwitch('studentRohan')}
          className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
            currentUser.role === 'student' && currentUser.name?.includes('Rohan') ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Defaulter
        </button>
      </div>
    </div>
  );
}