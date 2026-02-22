# Hall Booking System

A comprehensive hall booking system for colleges with admin and faculty login functionality.

## Features

### Admin Features
- **Login System**: Secure admin authentication
- **Hall Management**: Add and delete halls with capacity information
- **View All Bookings**: Monitor all faculty bookings across the system
- **Dashboard**: Overview of hall utilization and booking statistics

### Faculty Features
- **Login System**: Secure faculty authentication
- **Hall Booking**: Book available halls for specific time slots
- **8-Hour Time Table**: Time slots from 9 AM to 5 PM (8 slots)
- **Real-time Availability**: View hall availability with color-coded status
- **First Come First Serve**: Booking conflicts prevented with unique constraints
- **Booking Management**: View and cancel personal bookings
- **Visual Feedback**: Clear indication of booked vs available slots

### System Features
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant reflection of booking changes
- **Secure Authentication**: Password hashing with bcrypt
- **Data Validation**: Comprehensive input validation
- **Error Handling**: User-friendly error messages

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **dotenv** for environment variables

### Frontend
- **Next.js 15** with React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Lucide React** for icons

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hall-booking-system
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

Seed the database with sample data:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Credentials

### Admin
- **Username**: admin
- **Password**: admin123

### Faculty
- **Username**: faculty1
- **Password**: faculty123
- **Username**: faculty2
- **Password**: faculty123
- **Username**: faculty3
- **Password**: faculty123
- **Username**: faculty4
- **Password**: faculty123

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Halls
- `GET /api/halls` - Get all halls
- `POST /api/halls` - Create new hall (admin only)
- `DELETE /api/halls/:id` - Delete hall (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `DELETE /api/bookings/:id` - Cancel booking

## Database Schema

### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (admin/faculty),
  name: String
}
```

### Hall
```javascript
{
  name: String (unique),
  capacity: Number
}
```

### Booking
```javascript
{
  hall: ObjectId (ref: Hall),
  faculty: ObjectId (ref: User),
  date: String,
  timeSlot: String,
  purpose: String
}
```

## Time Slots
The system supports 8 time slots:
- 9-10 AM
- 10-11 AM
- 11-12 PM
- 12-1 PM
- 1-2 PM
- 2-3 PM
- 3-4 PM
- 4-5 PM

## Business Rules

1. **First Come First Serve**: Bookings are processed on a first-come, first-served basis
2. **No Double Booking**: Each hall can only be booked by one faculty per time slot
3. **Future Bookings Only**: Users can only book halls for current and future dates
4. **Cancellation Rights**: Only the faculty who made the booking can cancel it
5. **Admin Oversight**: Admins can view all bookings but cannot make bookings themselves

## Development

### Adding New Features
1. Backend changes go in the `server` directory
2. Frontend changes go in the `client` directory
3. Database models are in separate files (User.js, Hall.js, Booking.js)
4. UI components use the established design system

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)

## Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible from your hosting environment
3. Run `npm start` to start the production server

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the built files to your hosting platform
3. Update API endpoints if necessary

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure your MongoDB URI is correct and accessible
2. **CORS Issues**: Backend includes CORS middleware for cross-origin requests
3. **Port Conflicts**: Change the PORT in .env if 5000 is already in use
4. **Booking Conflicts**: The system prevents double bookings with database constraints

### Support
For issues and questions, please check the console logs for detailed error messages.