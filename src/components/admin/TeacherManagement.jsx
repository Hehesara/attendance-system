import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function TeacherManagement() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, classes, subjects, assignments } =
    useAttendance();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    department: 'Information Technology',
    designation: 'Assistant Professor',
  });

  const handleOpenCreate = () => {
    setTeacherForm({
      name: '',
      email: '',
      department: 'Information Technology',
      designation: 'Assistant Professor',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (tea) => {
    setEditingTeacher(tea);
    setTeacherForm({
      name: tea.name,
      email: tea.email,
      department: tea.department,
      designation: tea.designation || 'Assistant Professor',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherForm);
      setEditingTeacher(null);
    } else {
      addTeacher(teacherForm);
      setIsCreateOpen(false);
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
                      onClick={() => handleOpenEdit(tea)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete teacher ${tea.name}?`)) deleteTeacher(tea.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
        }}
        title={editingTeacher ? `Edit Teacher: ${editingTeacher.name}` : 'Add Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="sharma@college.edu"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

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
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingTeacher ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
