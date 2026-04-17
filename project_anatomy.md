# 📖 ScrMail (v2.0) — Advanced Project Architecture & Data Flow

This document breaks down exactly how the modernized ScrMail platform works from start to finish. It serves as an authoritative study guide covering the Advanced **MERN** stack implementations, Redis caching, AES-256 encryption, and professional backend architecture.

---

## 1. The Technology Stack (Advanced MERN)

### The Foundation
* **MongoDB (Atlas)**: Our NoSQL Cloud Database. We use this to permanently store user accounts and search history.
* **Express.js**: Our robust Backend Web Framework. It listens for HTTP requests, applies advanced middleware (rate limiting, validation), and routes logic.
* **React.js (Vite)**: Our Frontend UI Library utilizing rapid Vite build compilation.
* **Node.js**: The asynchronous Python equivalent for JS, allowing server operations.

### The Specialized Tools & Upgrades
* **RediSearch (Upstash / Redis Stack)**: An in-memory data store turned search engine. We transitioned from generic key-value caching to full-text indexing. When a user queries a keyword, the backend executes native `FT.SEARCH` queries against explicitly mapped email Hashes loaded in RAM, bypassing Google quotas entirely!
* **AES-256-GCM Encryption (Node Crypto)**: Google Access Tokens grant literal read-access to user emails. Storing them in plain-text is a critical vulnerability. We implemented native Node `crypto` algorithms to automatically encrypt all tokens using 256-bit Hex keys *before* they touch MongoDB.
* **Express Rate Limit (rate-limit-redis)**: Distributed traffic policing. Rate-limit tracks request velocities using user IDs and IP addresses stored globally across Redis clusters. It caps Auth attempts (10/min), general APIs (100/min), and Search endpoints (30/min).
* **Winston & Morgan Logs**: Enterprise-grade structured logging instead of `console.log`.
* **Helmet.js & Joi**: Helmet attaches HTTP security headers (XSS protections, strict-transport config), while Joi forces strict validation parsing on incoming JSON requests.
* **Passport.js & express-session**: Handles our deeply integrated Google OAuth 2.0 flow using encrypted persistent cookie sessions mapped via MongoDB or Redis.
* **Axios**: The HTTP client interfacing the API with `withCredentials: true` across cross-origin servers.

---

## 2. Updated Project File Structure

The project maintains a scalable structural barrier separating infrastructure logic from routing.

### Backend (`/backend`)
* **`server.js`**: The foundational entry point. Configures global CORS, hooks up session layers, binds rate-limiters, mounts routing, and includes Graceful Shutdown hooks for Redis/Mongo socket closure on termination.
* **`config/`**:
  * **`redis.js`**: The Redis factory. Features a smart fallback mechanism (detects if Upstash/Redis is offline and safely allows the application to run without caching instead of crashing).
  * **`db.js`**: Connects strictly to MongoDB Atlas.
  * **`passport.js`**: Defines the Google Strategy and intelligently utilizes the `getDecryptedAccessToken` methods seamlessly.
* **`models/` (Data schemas)**:
  * **`User.js`**: Employs a Mongoose `pre-save hook`. Anytime a user model is modified, this hook intercepts the payload, mathematically encrypts the `accessToken`, and allows the database persistence.
* **`middleware/`**:
  * **`rateLimiter.js`**: Instantiates distributed protection partitions restricting brute-force attacks.
  * **`errorHandler.js`**: Our global `catch-all`. Standardizes 500/400 errors, strips stack traces away in production preventing intelligence leaks, and outputs formatted JSON.
* **`utils/`**:
  * **`ApiResponse.js`**: Standardizes all successful responses into a unified `{ success, statusCode, message, data }` format, solving frontend unboxing fragmentation.
  * **`encryption.js`**: The mathematical core utilizing initialization vectors (IVs) and auth tags.

---

## 3. Advanced User Journey: The Data Flow

### Flow 1: Secure Authentication
1. **User clicks "Sign in with Google"** -> Routes to backend -> Redirects to Google.
2. User grants `gmail.readonly` permissions to ScrMail.
3. Google calls back to `/auth/google/callback` supplying the temporary `code`.
4. Passport resolves the `code` into an **Access Token**.
5. **[New]** The `User.js` model `pre-save` hook triggers. It generates a random 16-byte IV, mathematically encrypts the token via AES-256-GCM utilizing the `process.env.ENCRYPTION_KEY`, attaches an authentication tag, and saves the cypher-text in MongoDB.
6. A persistent session starts successfully.

### Flow 2: Searching Emails (RediSearch)
1. User types "Interview" & requests `/api/email/search?q=Interview`.
2. **[New]** The request hits the `searchLimiter` middleware. It checks Redis to ensure this user hasn't made 30 searches in the last 60 seconds.
3. Next, the Joi Validator checks if the `q` query string actually exists.
4. **Cache Check**: The router runs an `FT.SEARCH` query directly against our `idx:emails` RediSearch index using `@userId:{userId} %Interview%`.
5. **Cache Miss**: If results aren't found locally, the server pulls the encrypted token from MongoDB.
6. **[New]** The route runs `getDecryptedAccessToken()` to unmask the token, applies it to `googleapis`, and fires the `gmail.users.messages.list` request.
7. Google returns 50 emails. The server loops the data map asynchronously and maps the required fields.
8. **[RediSearch Indexing]** Before returning to the user, the server writes each email explicitly into Redis using `HSET` individually, which natively maps it into the RediSearch index with a 10-minute expiration.
9. Express utilizes `ApiResponse.success` and transmits the data via Vercel to the browser.
*(If the user searches "Interview" 2 minutes later, Step 4 triggers a **RediSearch Hit**, fetching results directly from RAM via `FT.SEARCH`, using 0ms of CPU parsing and 0 Google API quota usage!)*

---

## 4. Encryption Architecture Deep Dive

Why `AES-256-GCM`?
- **Symmetric**: The same 64-character hex key encrypts and decrypts (ideal for Node servers).
- **Authenticated**: GCM validates the cyphertext mathematically. If an attacker modifies even 1 character in the database, the decryption process dynamically throws an error preventing blind injection bypasses.
- **Dynamic IV**: A randomly generated Initialization Vector is built globally for *every* individual encryption. This means even if two users have the exact same Access Token, their MongoDB cyphertext strings will look completely different, preventing attacker pattern matching.

---

## 5. Deployment Mapping (Render + Vercel + Upstash)

1. **Vercel**: Handles edge-delivery of the compiled `dist` React folder globally. Contains the `.env` pointer `VITE_API_URL` locking requests to Render.
2. **Render**: The Node server constantly awaiting hits. Bootstraps secure HTTP-Only cookies using `app.set('trust proxy', 1)`.
3. **Upstash**: A serverless Redis cloud. Configured to explicitly enforce TLS (rediss://) masking packet-sniffing cache grabs from Render to Upstash clusters.

This entire structural rewrite establishes **ScrMail** from a minimal viable project into a senior-level, highly scalable architecture capstone.
