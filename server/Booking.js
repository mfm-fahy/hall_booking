import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  purpose: { type: String, required: true }
}, { timestamps: true });

bookingSchema.index({ hall: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model('Booking', bookingSchema);
