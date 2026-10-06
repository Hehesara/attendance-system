import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  UserCheck,
  Clock,
  TrendingUp,
  Shield,
  LogOut,
  X,
} from 'lucide-react';

export default function Sidebar({ role, activeTab, setActiveTab, isOpen, setIsOpen, onSignOut }) {
  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'classes', label: 'Classes', icon: Layers },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'teachers', label: 'Teachers', icon: GraduationCap },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'teacher':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'my-classes', label: 'My Classes', icon: Layers },
          { id: 'mark', label: 'Mark Attendance', icon: UserCheck },
          { id: 'history', label: 'Attendance History', icon: Clock },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'my-attendance', label: 'My Attendance', icon: BookOpen },
          { id: 'history', label: 'Attendance History', icon: Clock },
          { id: 'statistics', label: 'Statistics', icon: TrendingUp },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Close button */}
          <div className="flex items-center justify-between px-3 py-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-400" />
              <div>
                <span className="font-bold text-lg tracking-wide block leading-none">AttendTrack</span>
                <span className="text-[10px] text-slate-400 font-mono capitalize">
                  {role} Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}