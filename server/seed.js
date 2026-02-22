import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './User.js';
import Hall from './Hall.js';

dotenv.config();

const users = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
  { username: 'faculty1', password: 'faculty123', role: 'faculty', name: 'Dr. John Smith' },
  { username: 'faculty2', password: 'faculty123', role: 'faculty', name: 'Dr. Sarah Johnson' },
  { username: 'faculty3', password: 'faculty123', role: 'faculty', name: 'Dr. Emily Davis' },
  { username: 'faculty4', password: 'faculty123', role: 'faculty', name: 'Dr. Michael Brown' },
  { username: 'faculty5', password: 'faculty123', role: 'faculty', name: 'Dr. Lisa Wilson' }
];

const halls = [
  { name: 'Conference Hall A', capacity: 50 },
  { name: 'Seminar Room B', capacity: 30 },
  { name: 'Auditorium', capacity: 200 },
  { name: 'Meeting Room C', capacity: 20 }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Clear existing data
    await User.deleteMany({});
    await Hall.deleteMany({});
    
    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    
    await User.insertMany(hashedUsers);
    await Hall.insertMany(halls);
    
    console.log('Database seeded successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Faculty: username=faculty1, password=faculty123');
    console.log('Faculty: username=faculty2, password=faculty123');
    console.log('Faculty: username=faculty3, password=faculty123');
    console.log('Faculty: username=faculty4, password=faculty123');
    console.log('Faculty: username=faculty5, password=faculty123');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
