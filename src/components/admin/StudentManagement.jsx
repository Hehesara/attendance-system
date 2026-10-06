import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import Modal from '../common/Modal';
import {
  Upload,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export default function StudentManagement() {
  const { students, classes, importStudentsCSV, addStudent, updateStudent, deleteStudent } =
    useAttendance();

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedClassForImport, setSelectedClassForImport] = useState(classes[0]?.id || '');
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [importFeedback, setImportFeedback] = useState(null);

  // Manual Add / Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    rollNo: '',
    name: '',
    email: '',
    classId: classes[0]?.id || '',
  });

  // Table Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseCsvContent(content);
      }
    };
    reader.readAsText(file);
  };

  // Parse CSV string into preview array
  const parseCsvContent = (text) => {
    setCsvRawText(text);
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      setParsedPreview([]);
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
    setParsedPreview(parsed);
  };

  // Sample CSV template
  const downloadSampleCsv = () => {
    const sample = `Roll No,Student Name,Email\n101,Aarav Sharma,aarav.s@college.edu\n102,Diya Patel,diya.p@college.edu\n103,Rohan Verma,rohan.v@college.edu`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Student_Roster.csv';
    a.click();
  };

  // Commit CSV import
  const handleCommitImport = () => {
    if (!selectedClassForImport || parsedPreview.length === 0) return;

    const count = importStudentsCSV(selectedClassForImport, parsedPreview);
    const targetClass = classes.find((c) => c.id === selectedClassForImport);
    setImportFeedback(`Imported ${count} students into ${targetClass?.name}`);

    setTimeout(() => {
      setIsCsvModalOpen(false);
      setParsedPreview([]);
      setCsvRawText('');
      setImportFeedback(null);
    }, 1500);
  };

  // Handle Manual Student Add / Edit
  const handleStudentFormSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.rollNo) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, studentForm);
      setEditingStudent(null);
    } else {
      addStudent(studentForm);
      setIsManualAddOpen(false);
    }
  };

  const openEditStudent = (st) => {
    setEditingStudent(st);
    setStudentForm({
      rollNo: st.rollNo,
      name: st.name,
      email: st.email,
      classId: st.classId,
    });
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
                            onClick={() => openEditStudent(st)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${st.name}?`)) deleteStudent(st.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
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
        onClose={() => {
          setIsCsvModalOpen(false);
          setParsedPreview([]);
          setCsvRawText('');
          setImportFeedback(null);
        }}
        title="Import Students CSV"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {importFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importFeedback}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Target Class
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

          <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50">
            <p className="text-xs text-slate-600 font-medium">Select a CSV file from your computer</p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="mt-2 text-xs text-slate-500"
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-xs text-indigo-600 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Or Paste CSV Text:
            </label>
            <textarea
              rows={3}
              placeholder="Roll No,Student Name,Email&#10;101,Aarav Sharma,aarav.s@college.edu"
              value={csvRawText}
              onChange={(e) => parseCsvContent(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs bg-white"
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
              onClick={() => {
                setIsCsvModalOpen(false);
                setParsedPreview([]);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
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
        }}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add Student'}
      >
        <form onSubmit={handleStudentFormSubmit} className="space-y-4">
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

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsManualAddOpen(false);
                setEditingStudent(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
