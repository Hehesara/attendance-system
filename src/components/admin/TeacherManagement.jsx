import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Plus, Edit2, Trash2, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function TeacherManagement() {
  const {
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    resetUserPassword,
    classes,
    subjects,
    assignments,
  } = useAttendance();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Form state
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    department: 'Information Technology',
    designation: 'Assistant Professor',
    initialPassword: '',
  });
  const [formError, setFormError] = useState(null);

  // Reset Password State
  const [resetTargetTeacher, setResetTargetTeacher] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleOpenCreate = () => {
    setTeacherForm({
      name: '',
      email: '',
      department: 'Information Technology',
      designation: 'Assistant Professor',
      initialPassword: '',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (tea) => {
    setEditingTeacher(tea);
    setTeacherForm({
      name: tea.name,
      email: tea.email,
      department: tea.department,
      designation: tea.designation || 'Assistant Professor',
      initialPassword: '',
    });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) return;

    if (!editingTeacher && (!teacherForm.initialPassword || teacherForm.initialPassword.length < 6)) {
      setFormError('Initial password is required and must be at least 6 characters long');
      return;
    }

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, {
          name: teacherForm.name,
          email: teacherForm.email,
          department: teacherForm.department,
          designation: teacherForm.designation,
        });
        setEditingTeacher(null);
      } else {
        await addTeacher({
          name: teacherForm.name,
          email: teacherForm.email,
          department: teacherForm.department,
          designation: teacherForm.designation,
          password: teacherForm.initialPassword,
        });
        setIsCreateOpen(false);
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save teacher');
    }
  };

  const handleOpenReset = (tea) => {
    setResetTargetTeacher(tea);
    setTemporaryPassword('');
    setResetFeedback(null);
    setResetError(null);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetFeedback(null);

    if (!temporaryPassword || temporaryPassword.length < 6) {
      setResetError('Temporary password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetUserPassword(resetTargetTeacher.id, temporaryPassword);
      setResetFeedback(
        res?.message ||
          'Password reset successfully. Give the temporary password to the user securely.'
      );
      setTimeout(() => {
        setResetTargetTeacher(null);
        setTemporaryPassword('');
        setResetFeedback(null);
      }, 2500);
    } catch (err) {
      setResetError(
        err?.response?.data?.message || err?.message || 'Failed to reset password'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Teacher Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Faculty directory and assigned courses</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((tea) => {
          const teacherAssignments = assignments.filter((a) => a.teacherId === tea.id);

          return (
            <div
              key={tea.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{tea.name}</h3>
                    <p className="text-xs text-slate-500">{tea.designation || 'Faculty'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenReset(tea)}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors cursor-pointer"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(tea)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete teacher ${tea.name}?`)) deleteTeacher(tea.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1">
                  <p>Email: <span className="text-slate-800">{tea.email}</span></p>
                  <p>Department: <span className="font-semibold text-slate-800">{tea.department}</span></p>
                </div>

                {/* Course Allocations */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    Assigned Classes & Subjects ({teacherAssignments.length})
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {teacherAssignments.length === 0 ? (
                      <span className="text-[11px] text-slate-400">None assigned</span>
                    ) : (
                      teacherAssignments.map((asg) => {
                        const cls = classes.find((c) => c.id === asg.classId);
                        const sub = subjects.find((s) => s.id === asg.subjectId);
                        return (
                          <div key={asg.id} className="text-xs flex justify-between bg-slate-50 px-2 py-1 rounded">
                            <span className="font-semibold text-slate-800">{cls?.name}</span>
                            <span className="text-slate-600">{sub?.name} ({sub?.code})</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingTeacher}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTeacher(null);
          setFormError(null);
        }}
        title={editingTeacher ? `Edit Teacher: ${editingTeacher.name}` : 'Add Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Prof. S. Sharma"
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
            <input
              type="email"
              required
              placeholder="sharma@college.edu"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          {!editingTeacher && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Initial password for teacher login"
                value={teacherForm.initialPassword}
                onChange={(e) =>
                  setTeacherForm({ ...teacherForm, initialPassword: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters. Teacher will use this to sign in.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                value={teacherForm.department}
                onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
              <input
                type="text"
                value={teacherForm.designation}
                onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTeacher(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              {editingTeacher ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={!!resetTargetTeacher}
        onClose={() => {
          setResetTargetTeacher(null);
          setResetFeedback(null);
          setResetError(null);
        }}
        title={`Reset Password: ${resetTargetTeacher?.name || ''}`}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {resetFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{resetFeedback}</span>
            </div>
          )}

          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{resetError}</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Set a temporary password for <strong>{resetTargetTeacher?.name}</strong> ({resetTargetTeacher?.email}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              New Temporary Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Enter new temporary password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters.</p>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetTargetTeacher(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResetting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
