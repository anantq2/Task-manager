require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging (Requirement: Log files)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// --- DATABASE CONNECTION ---
// Check if Env variables exist
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("FATAL ERROR: MONGO_URI or JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Error:", err));

// --- MODELS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  title: String,
  userId: String
});
const Task = mongoose.model('Task', taskSchema);

// --- AUTH MIDDLEWARE ---
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('Token required');
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
};

// --- ROUTES ---

// 1. Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error: "Fields required"});
  
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ username, password: hashedPassword });
    res.json({ message: "User registered" });
  } catch (e) { res.status(500).json({ error: "Error registering" }); }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET);
  res.json({ token, username: user.username });
});

// 3. Get Tasks (Protected)
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch(e) { res.status(500).json({error: "Error fetching tasks"}); }
});

// 4. Add Task (Protected)
app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const task = await Task.create({ title: req.body.title, userId: req.user.userId });
    res.json(task);
  } catch(e) { res.status(500).json({error: "Error adding task"}); }
});

// 5. Delete Task (Protected)
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch(e) { res.status(500).json({error: "Error deleting task"}); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));