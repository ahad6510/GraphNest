/**
 * Author: Abdul Ahad Khan
 * Roll Number: 24BCD002
 */
'use client';
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

// ⚠️ PASTE YOUR GOOGLE CLIENT ID HERE ⚠️
const GOOGLE_CLIENT_ID = "1091505976080-3e7f5apg5nv00o1r6qd58hteitfgfduj.apps.googleusercontent.com";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [currentSlug, setCurrentSlug] = useState(''); 
  const [problemList, setProblemList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- NEW: SOLVED PROBLEMS STATE ---
  const [solvedProblems, setSolvedProblems] = useState(new Set());

  const [questionData, setQuestionData] = useState(null);
  const [lang, setLang] = useState('cpp');
  const [code, setCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState(2700); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerLoaded, setIsTimerLoaded] = useState(false);

  // --- 1. LOAD DATA ON MOUNT ---
  useEffect(() => {
    const savedUser = localStorage.getItem('graphnest_user');
    let currentUser = null;
    
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      setUser(currentUser);
      
      // Load solved problems explicitly for this user's email
      const savedSolved = localStorage.getItem(`graphnest_solved_${currentUser.email}`);
      if (savedSolved) {
        setSolvedProblems(new Set(JSON.parse(savedSolved)));
      }
    }

    const savedSlug = localStorage.getItem('graphnest_active_problem') || 'two-sum';
    setCurrentSlug(savedSlug);

    const savedTime = localStorage.getItem('graphnest_time');
    const savedIsRunning = localStorage.getItem('graphnest_timer_running');
    
    if (savedTime !== null) setTimeRemaining(parseInt(savedTime, 10));
    if (savedIsRunning === 'true') setIsTimerRunning(true);

    setIsTimerLoaded(true); 
    setIsCheckingAuth(false);
  }, []);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    if (!isTimerLoaded) return; 

    if (isTimerRunning) {
      localStorage.setItem('graphnest_timer_running', 'true');
      const interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          localStorage.setItem('graphnest_time', newTime.toString());
          if (newTime <= 0) {
            clearInterval(interval);
            setIsTimerRunning(false);
            localStorage.setItem('graphnest_timer_running', 'false');
            return 0;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      localStorage.setItem('graphnest_timer_running', 'false');
    }
  }, [isTimerRunning, isTimerLoaded]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (currentSlug) {
      localStorage.setItem('graphnest_active_problem', currentSlug);
    }
  }, [currentSlug]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/questions`)
      .then(res => res.json())
      .then(data => setProblemList(data))
      .catch(err => console.error("Failed to load problem list:", err));
  }, []);

  useEffect(() => {
    if (!currentSlug) return; 

    const fetchQuestion = async () => {
      setQuestionData(null);
      setExecutionResult(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/questions/${currentSlug}`);
        const data = await response.json();
        setQuestionData(data);
        if (data.templates) {
           setCode(data.templates.cpp); 
           setLang('cpp');
        }
      } catch (err) {
        console.error("Failed to fetch question:", err);
      }
    };
    fetchQuestion();
  }, [currentSlug]);

  useEffect(() => {
    if (questionData && questionData.templates) {
      setCode(questionData.templates[lang]);
    }
  }, [lang, questionData]);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded); 
    localStorage.setItem('graphnest_user', JSON.stringify(decoded));
    
    // Load their specific solved list on fresh login
    const savedSolved = localStorage.getItem(`graphnest_solved_${decoded.email}`);
    if (savedSolved) {
      setSolvedProblems(new Set(JSON.parse(savedSolved)));
    } else {
      setSolvedProblems(new Set());
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSolvedProblems(new Set()); // Clear screen memory
    localStorage.removeItem('graphnest_user');
  };

  // ==========================================
  // CODE EXECUTION DRIVER LOGIC
  // ==========================================
  const handleExecute = async (mode) => {
    setIsRunning(true);
    setExecutionResult(null);
    let finalCodeToRun = code;

    const cppHeaders = `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <unordered_map>\nusing namespace std;\n`;

    if (currentSlug === 'two-sum') {
      if (mode === 'run') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid printVec(vector<int>& v) { cout << "["; for(int i=0; i<v.size(); i++) cout << v[i] << (i<v.size()-1 ? "," : ""); cout << "]"; }\nint main() { Solution sol; vector<int> nums = {2,7,11,15}; vector<int> res = sol.twoSum(nums, 9); cout << "--- Run Code (Example 1) ---\\nInput: nums = [2,7,11,15], target = 9\\nExpected: [0,1]\\nActual: "; printVec(res); cout << "\\n"; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\nsol = Solution()\nres = sol.twoSum([2,7,11,15], 9)\nprint("--- Run Code (Example 1) ---\\nInput: nums = [2,7,11,15], target = 9\\nExpected: [0, 1]\\nActual:", res)`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nlet res = twoSum([2,7,11,15], 9);\nconsole.log("--- Run Code (Example 1) ---\\nInput: nums = [2,7,11,15], target = 9\\nExpected: [0,1]\\nActual:", JSON.stringify(res));`;
        }
      } else if (mode === 'submit') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid printVec(vector<int>& v) { cout << "["; for(int i=0; i<v.size(); i++) cout << v[i] << (i<v.size()-1 ? "," : ""); cout << "]"; }\nint main() { Solution sol; vector<pair<vector<int>, int>> inputs = {{{2,7,11,15}, 9}, {{3,2,4}, 6}, {{3,3}, 6}, {{0,4,3,0}, 0}, {{-1,-2,-3,-4,-5}, -8}, {{10,20,30,40,50}, 90}, {{2,5,5,11}, 10}, {{-10,7,19,15}, 9}, {{150,24,79,50,88,345,3}, 200}, {{1,2,3,4,5,6,7,8,9,10}, 19}}; vector<vector<int>> expected = {{0,1}, {1,2}, {0,1}, {0,3}, {2,4}, {3,4}, {1,2}, {0,2}, {0,3}, {8,9}}; int passed = 0; for(int i=0; i<inputs.size(); i++) { vector<int> res = sol.twoSum(inputs[i].first, inputs[i].second); vector<int> s_res = res; vector<int> s_exp = expected[i]; sort(s_res.begin(), s_res.end()); sort(s_exp.begin(), s_exp.end()); if(res.size() == 2 && s_res == s_exp) passed++; else { cout << "Failed Test Case " << i+1 << "\\nInput: nums = "; printVec(inputs[i].first); cout << ", target = " << inputs[i].second << "\\nExpected: "; printVec(expected[i]); cout << "\\nActual: "; printVec(res); cout << "\\n"; return 0; } } cout << "Accepted! " << passed << "/" << inputs.size() << " cases passed." << endl; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\ncases = [([2,7,11,15], 9, [0,1]), ([3,2,4], 6, [1,2]), ([3,3], 6, [0,1]), ([0,4,3,0], 0, [0,3]), ([-1,-2,-3,-4,-5], -8, [2,4]), ([10,20,30,40,50], 90, [3,4]), ([2,5,5,11], 10, [1,2]), ([-10,7,19,15], 9, [0,2]), ([150,24,79,50,88,345,3], 200, [0,3]), ([1,2,3,4,5,6,7,8,9,10], 19, [8,9])]\npassed = 0\nsol = Solution()\nfor i, (nums, target, exp) in enumerate(cases):\n    res = sol.twoSum(nums, target)\n    if res and sorted(res) == sorted(exp): passed += 1\n    else: print(f"Failed Test Case {i+1}\\nInput: nums = {nums}, target = {target}\\nExpected: {exp}\\nActual: {res}"); exit()\nprint(f"Accepted! {passed}/{len(cases)} cases passed.")`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nconst cases = [ {n:[2,7,11,15], t:9, e:[0,1]}, {n:[3,2,4], t:6, e:[1,2]}, {n:[3,3], t:6, e:[0,1]}, {n:[0,4,3,0], t:0, e:[0,3]}, {n:[-1,-2,-3,-4,-5], t:-8, e:[2,4]}, {n:[10,20,30,40,50], t:90, e:[3,4]}, {n:[2,5,5,11], t:10, e:[1,2]}, {n:[-10,7,19,15], t:9, e:[0,2]}, {n:[150,24,79,50,88,345,3], t:200, e:[0,3]}, {n:[1,2,3,4,5,6,7,8,9,10], t:19, e:[8,9]} ]; let passed = 0; for(let i=0; i<cases.length; i++) { let res = twoSum(cases[i].n, cases[i].t); let s_res = res ? [...res].sort().toString() : ""; let s_exp = [...cases[i].e].sort().toString(); if(res && s_res === s_exp) passed++; else { console.log(\`Failed Test Case \${i+1}\\nInput: nums = [\${cases[i].n}], target = \${cases[i].t}\\nExpected: [\${cases[i].e}]\\nActual: [\${res}]\`); process.exit(0); } } console.log(\`Accepted! \${passed}/\${cases.length} cases passed.\`);`;
        }
      }
    } else if (currentSlug === '3sum') {
      if (mode === 'run') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid printVec(vector<int>& v) { cout << "["; for(int i=0; i<v.size(); i++) cout << v[i] << (i<v.size()-1 ? "," : ""); cout << "]"; }\nvoid print2D(vector<vector<int>>& v) { cout << "["; for(int i=0; i<v.size(); i++) { printVec(v[i]); cout << (i<v.size()-1 ? "," : ""); } cout << "]"; }\nint main() { Solution sol; vector<int> nums = {-1,0,1,2,-1,-4}; vector<vector<int>> res = sol.threeSum(nums); cout << "--- Run Code (Example 1) ---\\nInput: nums = [-1,0,1,2,-1,-4]\\nExpected: [[-1,-1,2],[-1,0,1]]\\nActual: "; print2D(res); cout << "\\n"; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\nsol = Solution()\nres = sol.threeSum([-1,0,1,2,-1,-4])\nprint("--- Run Code (Example 1) ---\\nInput: nums = [-1,0,1,2,-1,-4]\\nExpected: [[-1, -1, 2], [-1, 0, 1]]\\nActual:", res)`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nlet res = threeSum([-1,0,1,2,-1,-4]);\nconsole.log("--- Run Code (Example 1) ---\\nInput: nums = [-1,0,1,2,-1,-4]\\nExpected: [[-1,-1,2],[-1,0,1]]\\nActual:", JSON.stringify(res));`;
        }
      } else if (mode === 'submit') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid printVec(vector<int>& v) { cout << "["; for(int i=0; i<v.size(); i++) cout << v[i] << (i<v.size()-1 ? "," : ""); cout << "]"; }\nvoid print2D(vector<vector<int>>& v) { cout << "["; for(int i=0; i<v.size(); i++) { printVec(v[i]); cout << (i<v.size()-1 ? "," : ""); } cout << "]"; }\nint main() { Solution sol; vector<vector<int>> inputs = {{-1,0,1,2,-1,-4}, {0,1,1}, {0,0,0}, {0,0,0,0}, {-2,0,1,1,2}, {-1,0,1,0}, {-2,0,0,2,2}, {-1,-1,-1,2,2}, {1,2,-2,-1}, {3,0,-2,-1,1,2}}; vector<vector<vector<int>>> expected = {{{-1,-1,2},{-1,0,1}}, {}, {{0,0,0}}, {{0,0,0}}, {{-2,0,2},{-2,1,1}}, {{-1,0,1}}, {{-2,0,2}}, {{-1,-1,2}}, {}, {{-2,-1,3},{-2,0,2},{-1,0,1}}}; int passed = 0; for(int i=0; i<inputs.size(); i++) { vector<vector<int>> res = sol.threeSum(inputs[i]); vector<vector<int>> s_res = res; vector<vector<int>> s_exp = expected[i]; for(auto& v : s_res) sort(v.begin(), v.end()); sort(s_res.begin(), s_res.end()); for(auto& v : s_exp) sort(v.begin(), v.end()); sort(s_exp.begin(), s_exp.end()); if(s_res == s_exp) passed++; else { cout << "Failed Test Case " << i+1 << "\\nInput: nums = "; printVec(inputs[i]); cout << "\\nExpected: "; print2D(expected[i]); cout << "\\nActual: "; print2D(res); cout << "\\n"; return 0; } } cout << "Accepted! " << passed << "/" << inputs.size() << " cases passed." << endl; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\ncases = [([-1,0,1,2,-1,-4], [[-1,-1,2],[-1,0,1]]), ([0,1,1], []), ([0,0,0], [[0,0,0]]), ([0,0,0,0], [[0,0,0]]), ([-2,0,1,1,2], [[-2,0,2],[-2,1,1]]), ([-1,0,1,0], [[-1,0,1]]), ([-2,0,0,2,2], [[-2,0,2]]), ([-1,-1,-1,2,2], [[-1,-1,2]]), ([1,2,-2,-1], []), ([3,0,-2,-1,1,2], [[-2,-1,3],[-2,0,2],[-1,0,1]])]\npassed = 0\nsol = Solution()\nfor i, (nums, exp) in enumerate(cases):\n    res = sol.threeSum(nums)\n    s_res = sorted([sorted(x) for x in res]) if res else []\n    s_exp = sorted([sorted(x) for x in exp])\n    if s_res == s_exp: passed += 1\n    else: print(f"Failed Test Case {i+1}\\nInput: nums = {nums}\\nExpected: {exp}\\nActual: {res}"); exit()\nprint(f"Accepted! {passed}/{len(cases)} cases passed.")`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nconst cases = [ {n:[-1,0,1,2,-1,-4], e:[[-1,-1,2],[-1,0,1]]}, {n:[0,1,1], e:[]}, {n:[0,0,0], e:[[0,0,0]]}, {n:[0,0,0,0], e:[[0,0,0]]}, {n:[-2,0,1,1,2], e:[[-2,0,2],[-2,1,1]]}, {n:[-1,0,1,0], e:[[-1,0,1]]}, {n:[-2,0,0,2,2], e:[[-2,0,2]]}, {n:[-1,-1,-1,2,2], e:[[-1,-1,2]]}, {n:[1,2,-2,-1], e:[]}, {n:[3,0,-2,-1,1,2], e:[[-2,-1,3],[-2,0,2],[-1,0,1]]} ]; let passed = 0; const sort2D = (arr) => arr ? [...arr].map(a => [...a].sort((x,y)=>x-y)).sort((a,b) => { for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]-b[i];} return 0; }) : []; for(let i=0; i<cases.length; i++) { let res = threeSum(cases[i].n); let s_res = JSON.stringify(sort2D(res)); let s_exp = JSON.stringify(sort2D(cases[i].e)); if(s_res === s_exp) passed++; else { console.log(\`Failed Test Case \${i+1}\\nInput: nums = [\${cases[i].n}]\\nExpected: \${JSON.stringify(cases[i].e)}\\nActual: \${JSON.stringify(res)}\`); process.exit(0); } } console.log(\`Accepted! \${passed}/\${cases.length} cases passed.\`);`;
        }
      }
    } else if (currentSlug === 'merge-intervals') {
      if (mode === 'run') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid print2D(vector<vector<int>>& v) { cout << "["; for(int i=0; i<v.size(); i++) { cout << "[" << v[i][0] << "," << v[i][1] << "]"; cout << (i<v.size()-1 ? "," : ""); } cout << "]"; }\nint main() { Solution sol; vector<vector<int>> intervals = {{1,3},{2,6},{8,10},{15,18}}; vector<vector<int>> res = sol.merge(intervals); cout << "--- Run Code (Example 1) ---\\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\\nExpected: [[1,6],[8,10],[15,18]]\\nActual: "; print2D(res); cout << "\\n"; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\nsol = Solution()\nres = sol.merge([[1,3],[2,6],[8,10],[15,18]])\nprint("--- Run Code (Example 1) ---\\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\\nExpected: [[1, 6], [8, 10], [15, 18]]\\nActual:", res)`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nlet res = merge([[1,3],[2,6],[8,10],[15,18]]);\nconsole.log("--- Run Code (Example 1) ---\\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\\nExpected: [[1,6],[8,10],[15,18]]\\nActual:", JSON.stringify(res));`;
        }
      } else if (mode === 'submit') {
        if (lang === 'cpp') {
          finalCodeToRun = `${cppHeaders}${code}\nvoid print2D(vector<vector<int>>& v) { cout << "["; for(int i=0; i<v.size(); i++) { cout << "[" << v[i][0] << "," << v[i][1] << "]"; cout << (i<v.size()-1 ? "," : ""); } cout << "]"; }\nint main() { Solution sol; vector<vector<vector<int>>> inputs = {{{1,3},{2,6},{8,10},{15,18}}, {{1,4},{4,5}}, {{4,7},{1,4}}, {{1,4},{2,3}}, {{1,10},{2,9},{3,8}}, {{1,2},{3,4},{5,6}}, {{1,5}}, {{1,4},{1,4}}, {{0,0},{1,2},{2,2}}, {{2,3},{4,5},{6,7},{8,9},{1,10}}}; vector<vector<vector<int>>> expected = {{{1,6},{8,10},{15,18}}, {{1,5}}, {{1,7}}, {{1,4}}, {{1,10}}, {{1,2},{3,4},{5,6}}, {{1,5}}, {{1,4}}, {{0,0},{1,2}}, {{1,10}}}; int passed = 0; for(int i=0; i<inputs.size(); i++) { vector<vector<int>> res = sol.merge(inputs[i]); if(res == expected[i]) passed++; else { cout << "Failed Test Case " << i+1 << "\\nInput: intervals = "; print2D(inputs[i]); cout << "\\nExpected: "; print2D(expected[i]); cout << "\\nActual: "; print2D(res); cout << "\\n"; return 0; } } cout << "Accepted! " << passed << "/" << inputs.size() << " cases passed." << endl; return 0; }`;
        } else if (lang === 'python') {
          finalCodeToRun = `from typing import List\n${code}\ncases = [ ([[1,3],[2,6],[8,10],[15,18]], [[1,6],[8,10],[15,18]]), ([[1,4],[4,5]], [[1,5]]), ([[4,7],[1,4]], [[1,7]]), ([[1,4],[2,3]], [[1,4]]), ([[1,10],[2,9],[3,8]], [[1,10]]), ([[1,2],[3,4],[5,6]], [[1,2],[3,4],[5,6]]), ([[1,5]], [[1,5]]), ([[1,4],[1,4]], [[1,4]]), ([[0,0],[1,2],[2,2]], [[0,0],[1,2]]), ([[2,3],[4,5],[6,7],[8,9],[1,10]], [[1,10]]) ]\npassed = 0\nsol = Solution()\nfor i, (intervals, exp) in enumerate(cases):\n    res = sol.merge(intervals)\n    if res == exp: passed += 1\n    else: print(f"Failed Test Case {i+1}\\nInput: intervals = {intervals}\\nExpected: {exp}\\nActual: {res}"); exit()\nprint(f"Accepted! {passed}/{len(cases)} cases passed.")`;
        } else if (lang === 'javascript') {
          finalCodeToRun = `${code}\nconst cases = [ {i: [[1,3],[2,6],[8,10],[15,18]], e: [[1,6],[8,10],[15,18]]}, {i: [[1,4],[4,5]], e: [[1,5]]}, {i: [[4,7],[1,4]], e: [[1,7]]}, {i: [[1,4],[2,3]], e: [[1,4]]}, {i: [[1,10],[2,9],[3,8]], e: [[1,10]]}, {i: [[1,2],[3,4],[5,6]], e: [[1,2],[3,4],[5,6]]}, {i: [[1,5]], e: [[1,5]]}, {i: [[1,4],[1,4]], e: [[1,4]]}, {i: [[0,0],[1,2],[2,2]], e: [[0,0],[1,2]]}, {i: [[2,3],[4,5],[6,7],[8,9],[1,10]], e: [[1,10]]} ]; let passed = 0; for(let k=0; k<cases.length; k++) { let res = merge(cases[k].i); if(JSON.stringify(res) === JSON.stringify(cases[k].e)) passed++; else { console.log(\`Failed Test Case \${k+1}\\nInput: intervals = \${JSON.stringify(cases[k].i)}\\nExpected: \${JSON.stringify(cases[k].e)}\\nActual: \${JSON.stringify(res)}\`); process.exit(0); } } console.log(\`Accepted! \${passed}/\${cases.length} cases passed.\`);`;
        }
      }
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: finalCodeToRun, language: lang, stdin: "" })
      });
      const data = await response.json();
      
      let finalStatus = data.status;

      if (data.stdout) {
        if (data.stdout.includes('Failed Test Case')) {
          finalStatus = "Wrong Answer";
          data.status = "Wrong Answer";
        } else if (data.stdout.includes('Expected:') && data.stdout.includes('Actual:')) {
          const expectedMatch = data.stdout.match(/Expected:\s*(.*)/);
          const actualMatch = data.stdout.match(/Actual:\s*(.*)/);
          if (expectedMatch && actualMatch) {
            const expStr = expectedMatch[1].replace(/\s+/g, '');
            const actStr = actualMatch[1].replace(/\s+/g, '');
            if (expStr !== actStr) {
              finalStatus = "Wrong Answer";
              data.status = "Wrong Answer";
            }
          }
        }
      }
      
      // --- NEW: SUCCESS TICK LOGIC ---
      // If they submitted it, and it passed all hidden tests (Accepted)
      if (mode === 'submit' && finalStatus === 'Accepted') {
        setSolvedProblems(prev => {
          const newSet = new Set(prev);
          newSet.add(currentSlug); // Mark current problem as solved
          
          if (user && user.email) {
            // Save their progress to local storage!
            localStorage.setItem(`graphnest_solved_${user.email}`, JSON.stringify(Array.from(newSet)));
          }
          return newSet;
        });
      }

      setExecutionResult(data);
    } catch (err) {
      setExecutionResult({ status: "Error", error: "Failed to run code." });
    } finally {
      setIsRunning(false);
    }
  };

  const filteredProblems = problemList.filter(prob => 
    prob.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCheckingAuth) {
     return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff' }}><h2>Loading...</h2></div>;
  }

  // ==========================================
  // RENDER LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f0f0f', color: '#fff', fontFamily: 'sans-serif' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <h1 style={{ fontSize: '36px', margin: 0, letterSpacing: '1px' }}>GraphNest</h1>
          </div>

          <p style={{ color: '#aaa', marginBottom: '40px', fontSize: '16px' }}>Sign in to access your coding workspace.</p>

          <div style={{ padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <GoogleLogin onSuccess={handleLoginSuccess} onError={() => console.error('Login Failed')} theme="filled_black" shape="pill" text="continue_with" />
          </div>
          
        </div>
      </GoogleOAuthProvider>
    );
  }

  if (!questionData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff' }}><h2>Loading problem...</h2></div>;
  }

  // ==========================================
  // RENDER MAIN APP
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* HEADER WITH PROFILE AND TIMER */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f0f0f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#fff', letterSpacing: '0.5px' }}>GraphNest</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '15px', borderRight: '1px solid #444', paddingRight: '20px' }}>
            <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <span style={{ fontSize: '14px', color: '#ccc' }}>{user.given_name}</span>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
          </div>

          {/* TIMER UI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#222', padding: '4px 10px', borderRadius: '6px', border: '1px solid #444' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: timeRemaining < 300 ? '#ef4444' : '#fff' }}>
              {formatTime(timeRemaining)}
            </span>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} title={isTimerRunning ? "Pause" : "Start"} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0 4px', fontSize: '14px' }}>
              {isTimerRunning ? '⏸' : '▶'}
            </button>
            <button 
              onClick={() => { 
                setIsTimerRunning(false); 
                setTimeRemaining(2700); 
                localStorage.setItem('graphnest_time', '2700');
                localStorage.setItem('graphnest_timer_running', 'false');
              }} 
              title="Reset to 45:00" 
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0 4px', fontSize: '14px' }}
            >
              ↺
            </button>
          </div>

          <div>
            <label style={{ marginRight: '8px', fontSize: '14px' }}>Language: </label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '6px 12px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}>
              <option value="cpp">C++ (GCC)</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node)</option>
            </select>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ☰ Problem List
          </button>
        </div>
      </div>

      {/* SLIDING RIGHT SIDEBAR */}
      <div style={{ position: 'fixed', top: 0, right: isSidebarOpen ? 0 : '-350px', width: '350px', height: '100vh', backgroundColor: '#141414', borderLeft: '2px solid #333', transition: 'right 0.3s ease-in-out', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: isSidebarOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Questions</h2>
            <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>
          <input 
            type="text" 
            placeholder="Search problems..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ padding: '15px', overflowY: 'auto', flex: 1 }}>
          {filteredProblems.length > 0 ? (
            filteredProblems.map(prob => (
              <div key={prob.slug} onClick={() => { setCurrentSlug(prob.slug); setIsSidebarOpen(false); setSearchQuery(''); }} style={{ padding: '15px', marginBottom: '10px', borderRadius: '6px', cursor: 'pointer', backgroundColor: currentSlug === prob.slug ? '#2c4a3e' : '#222', border: currentSlug === prob.slug ? '1px solid #22c55e' : '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* TITLE AND CHECKMARK */}
                <span style={{ fontWeight: currentSlug === prob.slug ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {solvedProblems.has(prob.slug) && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" title="Solved">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {prob.title}
                </span>

                <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '12px', backgroundColor: prob.difficulty === 'Medium' ? '#713f12' : '#064e3b', color: prob.difficulty === 'Medium' ? '#fbbf24' : '#34d399' }}>{prob.difficulty}</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
              No problems found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* BACKGROUND OVERLAY */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}

      {/* MAIN WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Description Panel */}
        <div style={{ width: '40%', padding: '24px', overflowY: 'auto', borderRight: '2px solid #333', backgroundColor: '#141414' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>{questionData.title}</h1>
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: questionData.difficulty === 'Medium' ? '#713f12' : '#064e3b', color: questionData.difficulty === 'Medium' ? '#fbbf24' : '#34d399', marginBottom: '20px' }}>{questionData.difficulty}</span>
          <p style={{ lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-line', marginBottom: '24px' }}>{questionData.description}</p>
          
          {questionData.examples.map((ex) => (
            <div key={ex.id} style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '6px', color: '#fff' }}>Example {ex.id}:</h4>
              <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '6px', border: '1px solid #2d2d2d', fontFamily: 'monospace', fontSize: '13px' }}>
                <div><span style={{ color: '#888' }}>Input:</span> {ex.input}</div>
                <div><span style={{ color: '#888' }}>Output:</span> {ex.output}</div>
                {ex.explanation && <div><span style={{ color: '#888' }}>Explanation:</span> {ex.explanation}</div>}
              </div>
            </div>
          ))}

          {questionData.constraints && questionData.constraints.length > 0 && (
            <>
              <h3 style={{ marginTop: '24px', fontSize: '16px', borderTop: '1px solid #2d2d2d', paddingTop: '16px' }}>Constraints:</h3>
              <ul style={{ paddingLeft: '20px', color: '#aaa', lineHeight: '1.8' }}>
                {questionData.constraints.map((item, idx) => <li key={idx}><code>{item}</code></li>)}
              </ul>
            </>
          )}
        </div>

        {/* Right Editor/Console Workspace */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, borderBottom: '2px solid #333' }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={lang === 'cpp' ? 'cpp' : lang === 'javascript' ? 'javascript' : 'python'}
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
            />
          </div>

          <div style={{ height: '35%', backgroundColor: '#0f0f0f', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #222' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#aaa' }}>Console Logs</span>
              <div>
                <button onClick={() => handleExecute('run')} disabled={isRunning} style={{ backgroundColor: isRunning ? '#555' : '#374151', color: '#fff', border: '1px solid #555', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: isRunning ? 'not-allowed' : 'pointer', marginRight: '10px' }}>Run Code</button>
                <button onClick={() => handleExecute('submit')} disabled={isRunning} style={{ backgroundColor: isRunning ? '#555' : '#15803d', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: isRunning ? 'not-allowed' : 'pointer' }}>{isRunning ? 'Executing...' : 'Submit'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, padding: '15px', overflow: 'hidden' }}>
              <div style={{ width: '100%', backgroundColor: '#141414', borderRadius: '4px', padding: '10px', overflowY: 'auto', border: '1px solid #222' }}>
                {executionResult ? (
                  <div>
                    <div style={{ fontWeight: 'bold', color: executionResult.status === 'Accepted' ? '#22c55e' : '#ef4444', marginBottom: '8px' }}>Result: {executionResult.status}</div>
                    {executionResult.stdout && <pre style={{ margin: '4px 0', fontFamily: 'monospace', color: executionResult.stdout.includes('Failed') || executionResult.status === 'Wrong Answer' ? '#ef4444' : '#22c55e', whiteSpace: 'pre-wrap' }}>{executionResult.stdout}</pre>}
                    {executionResult.error && <div><span style={{ fontSize: '12px', color: '#ef4444' }}>Compiler Trace:</span><pre style={{ margin: '4px 0', fontFamily: 'monospace', color: '#ef4444', whiteSpace: 'pre-wrap' }}>{executionResult.error}</pre></div>}
                  </div>
                ) : <span style={{ color: '#555', fontSize: '13px', fontFamily: 'monospace' }}>Click "Run Code" or "Submit".</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}