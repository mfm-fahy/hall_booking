# Deployment Instructions

## Backend Deployment (Render)

1. **Push your code to GitHub**
2. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Select the `server` folder as root directory
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `NODE_ENV`: production
     - `PORT`: 10000 (Render will set this automatically)

3. **After deployment, note your backend URL** (e.g., `https://your-app-name.onrender.com`)

## Frontend Deployment (Vercel)

1. **Update environment variables:**
   - In `.env.production`, replace `https://your-backend-url.onrender.com` with your actual Render URL
   - In `server/index.js`, replace `https://your-frontend-url.vercel.app` with your actual Vercel URL

2. **Deploy to Vercel:**
   - Connect your GitHub repository
   - Select the `client` folder as root directory
   - Vercel will auto-detect Next.js
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_API_URL`: https://your-backend-url.onrender.com/api
     - `NEXT_PUBLIC_SOCKET_URL`: https://your-backend-url.onrender.com

3. **Update CORS after deployment:**
   - Update the frontend URL in `server/index.js` CORS configuration
   - Redeploy the backend on Render

## Database Setup

Run the seed script on your deployed backend:
- Access your Render service console
- Run: `npm run seed`

## Important Notes

- Free tier on Render may have cold starts (30-second delay)
- Update CORS origins with actual deployment URLs
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) for Render