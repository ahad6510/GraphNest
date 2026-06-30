// Author: Abdul Ahad Khan (24BCD002)
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // e.g., 'two-sum'
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  examples: [{
    id: Number,
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  templates: {
    cpp: String,
    python: String,
    javascript: String
  },
  // The hidden test cases used for the Submit button
  testCases: [{
    inputArray: [mongoose.Schema.Types.Mixed], // Flexible array for different data types
    target: mongoose.Schema.Types.Mixed,
    expectedOutput: [mongoose.Schema.Types.Mixed]
  }]
});

module.exports = mongoose.model('Question', QuestionSchema);