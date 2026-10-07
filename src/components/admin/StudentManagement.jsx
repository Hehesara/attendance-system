import React, { useState, useRef } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import {
  Upload,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Key,
  Loader2,
} from 'lucide-react';

export default function StudentManagement() {
  const {
    students,
    classes,
    importStudentsCSV,
    addStudent,
    updateStudent,
    deleteStudent,
    resetUserPassword,
  } = useAttendance();

  // CSV Import Modal State
  const fileInputRef = useRef(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedClassForImport, setSelectedClassForImport] = useState(classes[0]?.id || '');
  const [csvInitialPassword, setCsvInitialPassword] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [importFeedback, setImportFeedback] = useState(null);
  const [importError, setImportError] = useState(null);

  // Manual Add / Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    rollNo: '',
    name: '',
    email: '',
    classId: classes[0]?.id || '',
    initialPassword: '',
  });
  const [manualFormError, setManualFormError] = useState(null);

  // Reset Password State
  const [resetTargetStudent, setResetTargetStudent] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setParsedPreview([]);
      return;
    }

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseCsvContent(content);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleCloseCsvModal = () => {
    setIsCsvModalOpen(false);
    setParsedPreview([]);
    setCsvInitialPassword('');
    setImportFeedback(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Parse CSV string into preview array
  const parseCsvContent = (text) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      setParsedPreview([]);
      setImportError('The CSV file must contain a header row and at least one student row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rollIdx = headers.findIndex((h) => h.includes('roll'));
    const nameIdx = headers.findIndex((h) => h.includes('name'));
    const emailIdx = headers.findIndex((h) => h.includes('email'));

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length >= 2) {
        const rollNo = cols[rollIdx >= 0 ? rollIdx : 0] || `S${i}`;
        const name = cols[nameIdx >= 0 ? nameIdx : 1] || 'Unnamed Student';
        const email =
          cols[emailIdx >= 0 ? emailIdx : 2] ||
          `${name.toLowerCase().replace(/\s+/g, '.')}@college.edu`;
        parsed.push({ rollNo, name, email });
      }
    }
    if (parsed.length === 0) {
      setImportError('Could not find valid student rows in the CSV. Expected columns: Roll No, Name, Email.');
    } else {
      setImportError(null);
    }
    setParsedPreview(parsed);
  };

  // Commit CSV import
  const handleCommitImport = async () => {
    setImportError(null);
    setImportFeedback(null);
    if (!selectedClassForImport || parsedPreview.length === 0) return;

    if (!csvInitialPassword || csvInitialPassword.length < 6) {
      setImportError('Initial password for imported students is required (at least 6 characters)');
      return;
    }

    try {
      const count = await importStudentsCSV(
        selectedClassForImport,
        parsedPreview,
        csvInitialPassword
      );
      const targetClass = classes.find((c) => c.id === selectedClassForImport);
      setImportFeedback(
        `Imported ${count} students into ${targetClass?.name}. Students should change their password after their first login.`
      );

      setTimeout(() => {
        handleCloseCsvModal();
      }, 2000);
    } catch (err) {
      setImportError(err?.response?.data?.message || err?.message || 'Failed to import students');
    }
  };

  // Handle Manual Student Add / Edit
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    setManualFormError(null);
    if (!studentForm.name || !studentForm.rollNo) return;

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          rollNo: studentForm.rollNo,
          name: studentForm.name,
          email: studentForm.email,
          classId: studentForm.classId,
        });
        setEditingStudent(null);
      } else {
        if (!studentForm.initialPassword || studentForm.initialPassword.length < 6) {
          setManualFormError('Initial password is required (minimum 6 characters)');
          return;
        }
        await addStudent({
          rollNo: studentForm.rollNo,
          name: studentForm.name,
          email: studentForm.email,
          classId: studentForm.classId,
          password: studentForm.initialPassword,
        });
        setIsManualAddOpen(false);
      }
    } catch (err) {
      setManualFormError(err?.response?.data?.message || err?.message || 'Failed to save student');
    }
  };

  const openEditStudent = (st) => {
    setEditingStudent(st);
    setStudentForm({
      rollNo: st.rollNo,
      name: st.name,
      email: st.email,
      classId: st.classId,
      initialPassword: '',
    });
    setManualFormError(null);
  };

  const handleOpenReset = (st) => {
    setResetTargetStudent(st);
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
      const res = await resetUserPassword(resetTargetStudent.id, temporaryPassword);
      setResetFeedback(
        res?.message ||
          'Password reset successfully. Give the temporary password to the user securely.'
      );
      setTimeout(() => {
        setResetTargetStudent(null);
        setTemporaryPassword('');
        setResetFeedback(null);
      }, 2500);
    } catch (err) {
      setResetError(
        err?.response?.data?.message || err?.message || 'Failed to reset student password'
      );
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage students and import rosters using CSV</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setStudentForm({
                rollNo: '',
                name: '',
                email: '',
                classId: classes[0]?.id || '',
              });
              setIsManualAddOpen(true);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Student
          </button>
          <button
            onClick={() => {
              setSelectedClassForImport(classes[0]?.id || '');
              setIsCsvModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white w-full sm:w-auto"
          >
            <option value="All">All Classes ({students.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
              <tr>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No students found. Use Import CSV to add a class roster.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const studentClass = classes.find((c) => c.id === st.classId);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">#{st.rollNo}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{st.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                          {studentClass?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{st.email}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReset(st)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditStudent(st)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${st.name}?`)) deleteStudent(st.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV IMPORT MODAL */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={handleCloseCsvModal}
        title="Import Students CSV"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {importFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importFeedback}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Target Class *
            </label>
            <select
              value={selectedClassForImport}
              onChange={(e) => setSelectedClassForImport(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Initial Password for Imported Students *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="e.g. StudentPass@123"
              value={csvInitialPassword}
              onChange={(e) => setCsvInitialPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-1 font-medium">
              Students should change their password after their first login.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select CSV File *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-600 border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 cursor-pointer"
            />
          </div>

          {parsedPreview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Preview: {parsedPreview.length} students found
              </p>
              <div className="border border-slate-200 rounded-lg max-h-36 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-2">Roll No</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono">#{item.rollNo}</td>
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-slate-500">{item.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseCsvModal}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedPreview.length === 0}
              onClick={handleCommitImport}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg text-white ${
                parsedPreview.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Import {parsedPreview.length} Students
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Student Add / Edit Modal */}
      <Modal
        isOpen={isManualAddOpen || !!editingStudent}
        onClose={() => {
          setIsManualAddOpen(false);
          setEditingStudent(null);
          setManualFormError(null);
        }}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add Student'}
      >
        <form onSubmit={handleStudentFormSubmit} className="space-y-4">
          {manualFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{manualFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Roll No *</label>
              <input
                type="text"
                required
                placeholder="e.g. 101"
                value={studentForm.rollNo}
                onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="alex@college.edu"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class *</label>
            <select
              value={studentForm.classId}
              onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {!editingStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Initial password for student login"
                value={studentForm.initialPassword}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, initialPassword: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Minimum 6 characters. Students can change their password after login.
              </p>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsManualAddOpen(false);
                setEditingStudent(null);
                setManualFormError(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={!!resetTargetStudent}
        onClose={() => {
          setResetTargetStudent(null);
          setResetFeedback(null);
          setResetError(null);
        }}
        title={`Reset Password: ${resetTargetStudent?.name || ''}`}
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
            Set a temporary password for student <strong>{resetTargetStudent?.name}</strong> (Roll No: {resetTargetStudent?.rollNo}).
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
              onClick={() => setResetTargetStudent(null)}
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
