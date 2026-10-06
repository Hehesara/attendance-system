import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function SubjectManagement() {
  const {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    classes,
    teachers,
    assignments,
    assignSubjectToClass,
  } = useAttendance();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [quickAssignSubject, setQuickAssignSubject] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Information Technology',
    semester: 5,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    classId: '',
    teacherId: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      code: '',
      name: '',
      department: 'Information Technology',
      semester: 5,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      department: sub.department,
      semester: sub.semester,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, formData);
      setEditingSubject(null);
    } else {
      addSubject(formData);
      setIsCreateOpen(false);
    }
  };

  const handleQuickAssign = (e) => {
    e.preventDefault();
    if (!quickAssignSubject || !assignmentForm.classId || !assignmentForm.teacherId) return;

    assignSubjectToClass({
      classId: assignmentForm.classId,
      subjectId: quickAssignSubject.id,
      teacherId: assignmentForm.teacherId,
    });

    setAssignmentForm({ classId: '', teacherId: '' });
    setQuickAssignSubject(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Subject Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage course curriculum and assign classes and teachers</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => {
          const subjectAssignments = assignments.filter((a) => a.subjectId === sub.id);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{sub.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject ${sub.name}?`)) deleteSubject(sub.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-600 space-y-1">
                  <p>Department: <span className="font-semibold text-slate-800">{sub.department}</span></p>
                  <p>Semester: <span className="font-semibold text-slate-800">Sem {sub.semester}</span></p>
                </div>

                {/* Assigned Divisions */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    Assigned Classes ({subjectAssignments.length})
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {subjectAssignments.length === 0 ? (
                      <span className="text-[11px] text-slate-400">Not assigned yet</span>
                    ) : (
                      subjectAssignments.map((asg) => {
                        const cls = classes.find((c) => c.id === asg.classId);
                        const tea = teachers.find((t) => t.id === asg.teacherId);
                        return (
                          <div key={asg.id} className="text-xs flex justify-between text-slate-600 bg-slate-50 px-2 py-1 rounded">
                            <span className="font-semibold text-slate-800">{cls?.name}</span>
                            <span className="text-slate-500">{tea?.name || 'Unassigned'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setQuickAssignSubject(sub)}
                  className="w-full py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Assign to Class & Teacher
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Subject Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingSubject}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingSubject(null);
        }}
        title={editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Create New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Code</label>
              <input
                type="text"
                required
                placeholder="e.g. CS303"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingSubject(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Assign Modal */}
      {quickAssignSubject && (
        <Modal
          isOpen={!!quickAssignSubject}
          onClose={() => setQuickAssignSubject(null)}
          title={`Assign ${quickAssignSubject.code}: ${quickAssignSubject.name}`}
        >
          <form onSubmit={handleQuickAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
              <select
                required
                value={assignmentForm.classId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher</label>
              <select
                required
                value={assignmentForm.teacherId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">-- Choose Teacher --</option>
                {teachers.map((tea) => (
                  <option key={tea.id} value={tea.id}>
                    {tea.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickAssignSubject(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
