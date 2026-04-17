# 📖 ScrMail — Complete Project Architecture & Data Flow

This document breaks down exactly how the ScrMail platform works from start to finish. It is designed as a study guide to help you understand every piece of the **MERN** stack and how they all talk to each other.

---

## 1. The Technology Stack (MERN+)

ScrMail is built using the **MERN** stack, plus a few specialized tools for authentication and third-party APIs.

### The Foundation
* **MongoDB (Atlas)**: Our NoSQL Cloud Database. We use this to permanently store user accounts and their past search keywords.
* **Express.js**: Our Backend Web Framework. It listens for HTTP requests (like `GET` or `POST`) from the frontend and routes them to the correct logic.
* **React.js (Vite)**: Our Frontend UI Library. It builds the interactive user interface (buttons, input fields, modals). We used *Vite* to bundle the React app because it is much faster than Create React App.
* **Node.js**: Our Backend Runtime Environment. It allows us to write server-side code using JavaScript.

### The Specialized Tools
* **Tailwind CSS**: A utility-first CSS framework. It allows us to style the React components rapidly using class names (e.g., `flex`, `text-center`, `bg-blue-500`) directly inside the JSX instead of writing custom CSS files.
* **Passport.js**: An authentication middleware for Node.js. We use the *Google OAuth 2.0 Strategy* to let users log in with their Google accounts without us having to manage passwords.
* **express-session**: Creates a persistent session cookie in the user's browser after they log in, keeping them authenticated across different pages.
* **connect-mongo**: Saves those `express-session` cookies directly into our MongoDB database so that if our backend server restarts, users don't get logged out automatically.
* **Gmail API (googleapis)**: Google's official Node.js library that allows our backend to act on behalf of the user to search their inbox and retrieve email text.
* **React Router**: Frontend routing library that lets users navigate between the `/` (Landing) and `/dashboard` (Dashboard) pages without the browser having to reload.
* **Axios**: An HTTP client used in our React frontend to send asynchronous API requests to our Express backend.

---

## 2. Project File Structure & Architecture

The project is split into two entirely separate folders that run on two different ports during development, but communicate over HTTP.

### Backend (`/backend`)
Runs on `http://localhost:5000` (or Render in production).
* **`server.js`**: The main entry point. It sets up Express, connects to MongoDB, configures the session cookie, initializes Passport, and mounts all API routes.
* **`config/db.js`**: Connects to the MongoDB Atlas cluster using Mongoose.
* **`config/passport.js`**: Contains the logic for the Google Login flow. It tells Google what permissions we want (`profile`, `email`, `gmail.readonly`) and specifies what to do when Google successfully returns a user's data.
* **`models/`**: Mongoose schemas defining how data looks in MongoDB (`User.js` and `SearchHistory.js`).
* **`routes/`**: The actual API endpoints our frontend calls (`auth.js` for login/logout, `email.js` for the Gmail API search, `history.js` for saving past searches).
* **`middleware/auth.js`**: A tiny piece of code that runs before protected routes to securely check: *"Is this user actually logged in right now?"*

### Frontend (`/frontend`)
Runs on `http://localhost:5173` (or Vercel in production).
* **`src/main.jsx` & `App.jsx`**: The React entry points. `App.jsx` handles all the page routing.
* **`src/context/AuthContext.jsx`**: Global state management. It checks if the user is logged in as soon as the site loads, and stores the user's data (name, profile picture) so any component (like the Navbar or Dashboard) can easily access it.
* **`src/pages/`**: The main screen layouts (`Landing.jsx` and `Dashboard.jsx`).
* **`src/components/`**: Reusable UI pieces (`Navbar.jsx`, `SearchBar.jsx`, `EmailCard.jsx`, `SearchHistory.jsx`).
* **`src/utils/api.js`**: A centralized Axios instance. This is configured to automatically attach cookies (`withCredentials: true`) to every request, and determines if it should hit localhost or the live Render URL.

---

## 3. The User Journey: Step-by-Step Data Flow

Here is exactly what happens under the hood when a user interacts with the app.

### Flow 1: User Log In
1. **User clicks "Sign in with Google"** on the Landing page.
2. The frontend triggers `window.location.href = '/auth/google'`. This redirects the browser completely away from React to our Backend Express server.
3. Express hits `passport.authenticate('google')` which redirects the user again to **accounts.google.com**.
4. The user clicks their account and grants permissions.
5. Google redirects the user back to our `/auth/google/callback` route, passing a special authorization code in the URL.
6. **Passport.js** securely exchanges that code for the user's Google Profile (Name, Email, Picture) and **Tokens** (Access Token & Refresh Token).
7. We save the user's details and Tokens in our **MongoDB Users Collection**. We *must* save the Tokens because we need them later to search their emails.
8. Express creates a Session Cookie in the browser and redirects the user back to the React `/dashboard`.

### Flow 2: Accessing the Dashboard (Protected Route)
1. The user hits the React `/dashboard`.
2. Before rendering the page, React checks the `AuthContext`.
3. The `AuthContext` makes a quiet background GET request to backend `/auth/current-user`.
4. Our Axios setup automatically attaches the Session Cookie to that request.
5. Express verifies the cookie, realizes the user is logged in, and returns the user's name and picture. (If the cookie was missing/invalid, it would return a 401 error, and React would kick them back to the Landing page).
6. React renders the Dashboard!

### Flow 3: Searching Emails (The Core Feature)
1. User types "Interview" in the SearchBar and hits Enter.
2. React makes a POST request to `/api/history` to save the word "Interview" into MongoDB.
3. React makes a GET request to `/api/email/search?q=Interview`.
4. The Backend Express router (`email.js`) receives the request. It uses the Session Cookie to identify exactly which user is asking for this.
5. Express grabs the user's saved **Access Token** from MongoDB.
6. Express uses the `googleapis` library. It says *"Hey Google, I am looking for all emails containing 'Interview'. Here is the Access Token to prove I am allowed to read this user's inbox."* (`gmail.users.messages.list`)
7. Google replies with a list of matching Email IDs.
8. Express loops through those IDs, asking Google for the full details of each one (Sender, Date, Subject, Snippet, Full HTML Body). (`gmail.users.messages.get`)
9. Once all emails are retrieved, Express sanitizes the data into a clean JSON array and sends it back to the React frontend.
10. React receives the array, updates its `emails` State, and renders the `EmailCard` components on the screen!

---

## 4. Database Models (MongoDB)

Our database is lean and efficient. We only have two collections:

### **User Document**
```json
{
  "_id": "64f3a...29b",
  "googleId": "10492850938450",
  "name": "Abhinav J",
  "email": "abhinav@gmail.com",
  "profilePicture": "https://lh3.googleusercontent.com/a/...",
  "accessToken": "ya29.a0AfB_...", // The key we use to read their Gmail
  "refreshToken": "1//0g...",       // Used to get a new Access Token when the old one expires
  "createdAt": "2026-03-14T08:00:00Z"
}
```

### **Search History Document**
```json
{
  "_id": "84c2f...10d",
  "userId": "64f3a...29b",  // Links directly back to the User who made the search
  "keyword": "Interview",
  "timestamp": "2026-03-14T15:30:00Z"
}
```

---

## 5. Deployment Map

When we pushed the code to GitHub and deployed it, the architecture split into two cloud services:

1. **Vercel (scrmail.vercel.app)**: Hosts the static React frontend. It only contains the HTML, CSS, and JS that runs in the user's browser.
2. **Render (scrmail-api.onrender.com)**: Hosts your Node.js server 24/7.
3. **MongoDB Atlas**: Hosts the database 24/7.

When a user on `scrmail.vercel.app` searches for an email, their browser sends an HTTP request across the internet to `scrmail-api.onrender.com`. Render securely queries MongoDB Atlas and queries the official Google APIs, aggregates the data, and sends the final JSON payload back across the internet to Vercel for the user to see!
