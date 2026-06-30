// backend/seed.js
const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('./models/Question');

const questions = [
  // --- 1. TWO SUM ---
  {
    id: 1,
    title: "1. Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { id: 1, input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { id: 2, input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "" },
      { id: 3, input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    templates: {
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ logic here\n        \n    }\n};`,
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your Python logic here\n        pass`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your JavaScript logic here\n    \n};`
    },
    testCases: [] // Managed by frontend driver code for now
  },
  
  // --- 2. THREE SUM ---
  {
    id: 2,
    title: "2. 3Sum",
    slug: "3sum",
    difficulty: "Medium",
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      { id: 1, input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]", explanation: "The distinct triplets are [-1,0,1] and [-1,-1,2]." },
      { id: 2, input: "nums = [0,1,1]", output: "[]", explanation: "The only possible triplet does not sum up to 0." },
      { id: 3, input: "nums = [0,0,0]", output: "[[0,0,0]]", explanation: "The only possible triplet sums up to 0." }
    ],
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5"
    ],
    templates: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your C++ logic here\n        \n    }\n};`,
      python: `class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        # Write your Python logic here\n        pass`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    // Write your JavaScript logic here\n    \n};`
    },
    testCases: []
  },

  // --- 3. MERGE INTERVALS ---
  {
    id: 3,
    title: "3. Merge Intervals",
    slug: "merge-intervals",
    difficulty: "Medium",
    description: `Given an array of intervals where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: [
      { id: 1, input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { id: 2, input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
      { id: 3, input: "intervals = [[4,7],[1,4]]", output: "[[1,7]]", explanation: "Intervals [1,4] and [4,7] are considered overlapping." }
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4"
    ],
    templates: {
      cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your C++ logic here\n        \n    }\n};`,
      python: `class Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        # Write your Python logic here\n        pass`,
      javascript: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    // Write your JavaScript logic here\n    \n};`
    },
    testCases: []
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Preparing to seed...');

    await Question.deleteMany({});
    console.log('Cleared existing database entries.');

    await Question.insertMany(questions);
    console.log(`SUCCESS: ${questions.length} questions injected into the database!`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();