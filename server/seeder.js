const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Allocation = require('./models/Allocation');
const AttendanceSession = require('./models/AttendanceSession');
const Setting = require('./models/Setting');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected! Clearing previous collections...');

    await Promise.all([
      User.deleteMany(),
      Class.deleteMany(),
      Subject.deleteMany(),
      Allocation.deleteMany(),
      AttendanceSession.deleteMany(),
      Setting.deleteMany(),
    ]);

    console.log('Collections cleared. Seeding initial settings...');
    await Setting.create({
      minimumThreshold: 75,
      academicYear: '2026-2027',
      semesterTerm: 'Odd Semester (Term 1)',
    });

    console.log('Seeding Classes...');
    const classA = await Class.create({
      name: 'TE IT-A',
      department: 'Information Technology',
      semester: 5,
      academicYear: '2026-2027',
    });

    const classB = await Class.create({
      name: 'TE IT-B',
      department: 'Information Technology',
      semester: 5,
      academicYear: '2026-2027',
    });

    console.log('Seeding Subjects...');
    const subDSA = await Subject.create({
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      department: 'Information Technology',
      semester: 5,
    });

    const subDBMS = await Subject.create({
      code: 'CS302',
      name: 'Database Management Systems',
      department: 'Information Technology',
      semester: 5,
    });

    const subCN = await Subject.create({
      code: 'CS303',
      name: 'Computer Networks',
      department: 'Information Technology',
      semester: 5,
    });

    const subWD = await Subject.create({
      code: 'CS304',
      name: 'Web Technologies',
      department: 'Information Technology',
      semester: 5,
    });

    console.log('Seeding Users (Admin, Teachers, Students)...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const teacherPassword = await bcrypt.hash('teacher123', salt);

    // Admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: adminPassword,
      role: 'admin',
      department: 'Administration',
    });

    // Teachers
    const teacherSharma = await User.create({
      name: 'Prof. Sharma',
      email: 'sharma@college.edu',
      password: teacherPassword,
      role: 'teacher',
      department: 'Information Technology',
      designation: 'Associate Professor',
    });

    const teacherMehta = await User.create({
      name: 'Dr. Mehta',
      email: 'mehta@college.edu',
      password: teacherPassword,
      role: 'teacher',
      department: 'Information Technology',
      designation: 'Professor & HOD',
    });

    // Students for Class A
    // Note: Default password for student = their roll number
    const pass101 = await bcrypt.hash('101', salt);
    const pass102 = await bcrypt.hash('102', salt);
    const pass103 = await bcrypt.hash('103', salt);
    const pass104 = await bcrypt.hash('104', salt);
    const pass105 = await bcrypt.hash('105', salt);

    const alexStudent = await User.create({
      name: 'Alex Johnson',
      email: 'alex.j@college.edu',
      password: pass101,
      role: 'student',
      rollNo: '101',
      department: 'Information Technology',
      classId: classA._id,
    });

    const rohanStudent = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.s@college.edu',
      password: pass102,
      role: 'student',
      rollNo: '102',
      department: 'Information Technology',
      classId: classA._id,
    });

    const priyaStudent = await User.create({
      name: 'Priya Patel',
      email: 'priya.p@college.edu',
      password: pass103,
      role: 'student',
      rollNo: '103',
      department: 'Information Technology',
      classId: classA._id,
    });

    const aidenStudent = await User.create({
      name: 'Aiden Smith',
      email: 'aiden.s@college.edu',
      password: pass104,
      role: 'student',
      rollNo: '104',
      department: 'Information Technology',
      classId: classA._id,
    });

    const snehaStudent = await User.create({
      name: 'Sneha Deshmukh',
      email: 'sneha.d@college.edu',
      password: pass105,
      role: 'student',
      rollNo: '105',
      department: 'Information Technology',
      classId: classA._id,
    });

    console.log('Seeding Course Allocations...');
    await Allocation.create([
      { classId: classA._id, subjectId: subDSA._id, teacherId: teacherSharma._id },
      { classId: classA._id, subjectId: subDBMS._id, teacherId: teacherSharma._id },
      { classId: classA._id, subjectId: subCN._id, teacherId: teacherMehta._id },
      { classId: classA._id, subjectId: subWD._id, teacherId: teacherSharma._id },
      { classId: classB._id, subjectId: subDSA._id, teacherId: teacherSharma._id },
      { classId: classB._id, subjectId: subDBMS._id, teacherId: teacherMehta._id },
    ]);

    console.log('Seeding Attendance Sessions...');
    // Dates for recent lectures
    const dates = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
    ];

    const studentList = [alexStudent, rohanStudent, priyaStudent, aidenStudent, snehaStudent];

    // DSA Sessions (conducted by Sharma)
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const records = studentList.map((stu) => {
        // Alex has high attendance (~83%), Rohan has low attendance (~50%), Priya high (~100%)
        let status = 'Present';
        if (stu.rollNo === '102') {
          // Rohan misses odd days
          status = i % 2 === 0 ? 'Absent' : 'Present';
        } else if (stu.rollNo === '104') {
          // Aiden misses index 2 and 4
          status = i === 2 || i === 4 ? 'Absent' : 'Present';
        } else if (stu.rollNo === '101' && i === 3) {
          // Alex missed 1 class
          status = 'Absent';
        }
        return { studentId: stu._id, status };
      });

      await AttendanceSession.create({
        classId: classA._id,
        subjectId: subDSA._id,
        teacherId: teacherSharma._id,
        date,
        records,
      });
    }

    // DBMS Sessions (conducted by Sharma)
    for (let i = 0; i < 5; i++) {
      const date = dates[i];
      const records = studentList.map((stu) => {
        let status = 'Present';
        if (stu.rollNo === '102') {
          // Rohan misses DBMS often
          status = i < 3 ? 'Absent' : 'Present';
        } else if (stu.rollNo === '101' && i === 1) {
          status = 'Absent';
        }
        return { studentId: stu._id, status };
      });

      await AttendanceSession.create({
        classId: classA._id,
        subjectId: subDBMS._id,
        teacherId: teacherSharma._id,
        date,
        records,
      });
    }

    // Computer Networks Sessions (conducted by Mehta)
    for (let i = 0; i < 4; i++) {
      const date = dates[i];
      const records = studentList.map((stu) => {
        let status = 'Present';
        if (stu.rollNo === '102' && (i === 0 || i === 2)) {
          status = 'Absent';
        }
        return { studentId: stu._id, status };
      });

      await AttendanceSession.create({
        classId: classA._id,
        subjectId: subCN._id,
        teacherId: teacherMehta._id,
        date,
        records,
      });
    }

    // Web Technologies Sessions (conducted by Sharma)
    for (let i = 0; i < 4; i++) {
      const date = dates[i];
      const records = studentList.map((stu) => {
        let status = 'Present';
        if (stu.rollNo === '102' && i !== 1) {
          status = 'Absent';
        }
        return { studentId: stu._id, status };
      });

      await AttendanceSession.create({
        classId: classA._id,
        subjectId: subWD._id,
        teacherId: teacherSharma._id,
        date,
        records,
      });
    }

    console.log('Database seeding successfully finished!');
    console.log('----------------------------------------------------');
    console.log('Seeded Users:');
    console.log('1. Admin: admin@college.edu (Password: admin123)');
    console.log('2. Teacher: sharma@college.edu (Password: teacher123)');
    console.log('3. Teacher: mehta@college.edu (Password: teacher123)');
    console.log('4. Student (Regular): alex.j@college.edu or Roll No 101 (Password: 101)');
    console.log('5. Student (Defaulter): rohan.s@college.edu or Roll No 102 (Password: 102)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
