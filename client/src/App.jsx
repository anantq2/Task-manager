import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5000/api";

// --- LOGIN COMPONENT (Dark & Centered) ---
const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { username, password });
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        navigate('/dashboard');
      } else {
        alert("Registration Successful! Please Login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-2 text-blue-400">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-gray-400 mb-8">
          {isRegister ? 'Join the TaskManager' : 'Login to access your dashboard'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200">
            {isRegister ? 'Sign Up' : 'Login'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-gray-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <span 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-blue-400 cursor-pointer hover:underline ml-1"
          >
            {isRegister ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT (Dark & Centered) ---
const Dashboard = ({ token, setToken }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/');
  };

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    axios.get(`${API_URL}/tasks`, { headers: { Authorization: token } })
      .then(res => setTasks(res.data))
      .catch(() => handleLogout());
  }, [token]);

  const addTask = async () => {
    if (!newTask) return;
    const res = await axios.post(`${API_URL}/tasks`, { title: newTask }, { headers: { Authorization: token } });
    setTasks([...tasks, res.data]);
    setNewTask('');
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API_URL}/tasks/${id}`, { headers: { Authorization: token } });
    setTasks(tasks.filter(t => t._id !== id));
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
               📝 TaskManager
            </h1>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - CENTERED */}
      <main className="max-w-3xl mx-auto mt-10 p-4">
        
        {/* Input Section */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
          <div className="flex gap-3 mb-4">
            <input 
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={newTask} 
              onChange={e => setNewTask(e.target.value)} 
              placeholder="Add a new task..." 
            />
            <button onClick={addTask} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition">
              Add
            </button>
          </div>
          
          <input 
            className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-sm text-gray-300 focus:outline-none"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Your Tasks</h2>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task._id} className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700 flex justify-between items-center hover:border-gray-500 transition">
                <span className="text-white font-medium">{task.title}</span>
                <button onClick={() => deleteTask(task._id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-full transition">
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              No tasks found. Start by adding one!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setToken={setToken} />} />
        <Route path="/dashboard" element={<Dashboard token={token} setToken={setToken} />} />
      </Routes>
    </Router>
  );
}

export default App;