# GraphNest 🚀

**Live Demo:** [https://graph-nest-lime.vercel.app](https://graph-nest-lime.vercel.app)

GraphNest is a full-stack MERN competitive programming platform and online coding judge. Built to simulate a real technical interview environment, it features a live code editor, an integrated countdown timer, and an execution engine capable of evaluating C++, Python, and JavaScript against hidden test cases.

## ✨ Features

* **Multi-Language Execution:** Write, run, and submit code natively in C++ (GCC), Python 3, and JavaScript (Node.js).
* **Custom Code Judge:** Intercepts standard output to evaluate user submissions against robust, hidden test cases (handling edge cases for problems like Merge Intervals and 3Sum).
* **Interview Simulation Timer:** An integrated 45-minute countdown timer with play/pause/reset functionality that persists across page reloads via local storage.
* **Google OAuth Authentication:** Secure, session-persistent login using `@react-oauth/google` and JWT decoding.
* **Progress Tracking:** Automatically tracks and saves solved problems to the user's specific profile, updating the UI with completion checkmarks.
* **Smart Problem Search:** Instantly filter the problem repository by title using a sleek, sliding sidebar interface.
* **Monaco Editor Integration:** Provides a world-class, VS Code-like coding experience directly in the browser.

## 🛠️ Tech Stack

* **Frontend:** React, Next.js, Monaco Editor
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **Execution Engine:** JDoodle Compiler API
* **Deployment:** Vercel (Frontend), Render (Backend)

## 🚀 Local Setup

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/ahad6510/GraphNest.git](https://github.com/ahad6510/GraphNest.git)
cd GraphNest

2. Setup the Backend
Open a terminal in the backend directory:

Bash
cd backend
npm install
Create a .env file in the backend directory with the following variables:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JDOODLE_CLIENT_ID=your_jdoodle_client_id
JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret
Start the backend server:

Bash
npm run dev
3. Setup the Frontend
Open a new terminal in the frontend directory:

Bash
cd frontend
npm install
Create a .env.local file in the frontend directory:

Code snippet
NEXT_PUBLIC_API_URL=http://localhost:5000
(Also ensure your Google Client ID is configured in page.js for local authentication).

Start the frontend development server:

Bash
npm run dev
👨‍💻 Author
Abdul Ahad Khan with love.