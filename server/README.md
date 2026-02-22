# Hall Booking Backend Server

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Make sure MongoDB is running locally on port 27017

3. Seed the database:
```bash
npm run seed
```

4. Start the server:
```bash
npm start
```

Server will run on http://localhost:5000

## Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Faculty 1
- Username: `faculty1`
- Password: `faculty123`

### Faculty 2
- Username: `faculty2`
- Password: `faculty123`

## API Endpoints

- `GET /api/users` - Get all users
- `POST /api/login` - Login with username and password
