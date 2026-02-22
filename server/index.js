import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import User from './User.js';
import Hall from './Hall.js';
import Booking from './Booking.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://hall-booking-cl1f.vercel.app"] 
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://hall-booking-cl1f.vercel.app"] 
    : ["http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Hall Booking System API',
    status: 'Running',
    endpoints: {
      login: 'POST /api/login',
      halls: 'GET /api/halls',
      bookings: 'GET /api/bookings',
      faculty: 'GET /api/faculty',
      addFaculty: 'POST /api/faculty'
    }
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ id: user._id, username: user.username, role: user.role, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/faculty', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const faculty = await User.create({
      username,
      password: hashedPassword,
      role: 'faculty',
      name
    });
    res.json({ id: faculty._id, username: faculty.username, name: faculty.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/faculty', async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' }).select('-password');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/faculty/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Faculty deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/halls', async (req, res) => {
  try {
    const halls = await Hall.find();
    res.json(halls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/halls', async (req, res) => {
  try {
    const hall = await Hall.create(req.body);
    res.json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/halls/:id', async (req, res) => {
  try {
    await Hall.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hall deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('hall').populate('faculty', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/export', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('hall').populate('faculty', 'name');
    const exportData = bookings.map(b => ({
      hall: b.hall?.name || 'Unknown',
      faculty: b.faculty?.name || 'Unknown',
      date: new Date(b.date).toLocaleDateString(),
      timeSlot: b.timeSlot,
      purpose: b.purpose,
      createdAt: new Date(b.createdAt).toLocaleString()
    }));
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { hall, date, timeSlot, purpose, faculty } = req.body;
    
    // Check if slot is already booked
    const existingBooking = await Booking.findOne({ hall, date, timeSlot });
    if (existingBooking) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    
    // Check faculty daily limit (2 hours per day)
    const facultyBookingsToday = await Booking.countDocuments({ faculty, date });
    if (facultyBookingsToday >= 2) {
      return res.status(400).json({ error: 'You can only book maximum 2 hours per day' });
    }
    
    const booking = await Booking.create(req.body);
    const populated = await Booking.findById(booking._id).populate('hall').populate('faculty', 'name');
    
    // Emit to all connected clients about the new booking
    io.emit('bookingCreated', {
      booking: populated,
      message: `${populated.hall.name} has been booked by ${populated.faculty.name} for ${populated.timeSlot} on ${new Date(populated.date).toLocaleDateString()}`
    });
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hall').populate('faculty', 'name');
    await Booking.findByIdAndDelete(req.params.id);
    
    // Emit to all connected clients about the cancelled booking
    io.emit('bookingDeleted', {
      bookingId: req.params.id,
      message: `${booking.hall.name} booking for ${booking.timeSlot} on ${new Date(booking.date).toLocaleDateString()} has been cancelled by ${booking.faculty.name}`
    });
    
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
