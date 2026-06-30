/**
 * Author: Abdul Ahad Khan
 * Roll Number: 24BCD002
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Question schema
const Question = require('./models/Question'); 

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// --- REMOTE CODE EXECUTION ROUTE (JDOODLE) ---
const JDOODLE_LANGUAGES = {
  cpp: { language: 'cpp17', versionIndex: '0' },
  python: { language: 'python3', versionIndex: '4' },
  javascript: { language: 'nodejs', versionIndex: '4' }
};

app.post('/api/run', async (req, res) => {
  const { code, language, stdin } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Missing code or language specification.' });
  }

  const langConfig = JDOODLE_LANGUAGES[language];

  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: stdin || "",
      language: langConfig.language,
      versionIndex: langConfig.versionIndex
    });

    const result = response.data;
    const isError = !result.memory;

    return res.status(200).json({
      status: isError ? "Execution Error" : "Accepted",
      time: result.cpuTime ? `${result.cpuTime}s` : "N/A",
      memory: result.memory ? `${result.memory} KB` : "N/A",
      stdout: result.output,
      error: isError ? result.output : ""
    });

  } catch (error) {
    console.error('JDoodle API Error:', error.message);
    let errorMessage = 'Remote Code Execution Engine failed.';
    
    if (error.response && error.response.data) {
        errorMessage = `JDoodle Error: ${error.response.data.error || 'Check backend terminal.'}`;
    }

    return res.status(500).json({ error: errorMessage });
  }
});

// --- NEW: FETCH ALL QUESTIONS (FOR SIDEBAR) ---
app.get('/api/questions', async (req, res) => {
  try {
    // Fetch only the necessary fields to keep the sidebar loading lightning fast
    const questions = await Question.find({}, 'id title slug difficulty').sort({ id: 1 });
    res.json(questions);
  } catch (error) {
    console.error('Database Fetch Error:', error);
    res.status(500).json({ error: 'Server error fetching question list' });
  }
});

// --- FETCH QUESTION BY SLUG ROUTE (FOR WORKSPACE) ---
app.get('/api/questions/:slug', async (req, res) => {
  try {
    const question = await Question.findOne({ slug: req.params.slug });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Strip out the hidden test cases before sending to the frontend so users can't cheat
    const safeData = {
        title: question.title,
        difficulty: question.difficulty,
        description: question.description,
        examples: question.examples,
        constraints: question.constraints,
        templates: question.templates
    };
    
    res.json(safeData);
  } catch (error) {
    console.error('Database Fetch Error:', error);
    res.status(500).json({ error: 'Server error fetching question data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Execution server running (using JDoodle API) on port ${PORT}`));