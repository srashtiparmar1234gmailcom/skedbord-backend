// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const JWT_SECRET = 'skedbord_secret_key';
const ADMIN_NAME = 'Skedbord Play Park Admin';

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// ===== MODELS =====
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
}));

const Membership = mongoose.model('Membership', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  plan: String,
  totalDays: Number,
  remainingDays: Number,
  status: { type: String, default: 'active' }
}));

const Attendance = mongoose.model('Attendance', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: String,
  markedBy: String
}));

const Payment = mongoose.model('Payment', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  plan: String,
  amount: Number,
  txnId: String,
  status: { type: String, default: 'pending' }
}));

// ===== ROUTES =====

// Signup
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hash });
  res.send({ message: 'Signup successful' });
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).send('User not found');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send('Wrong password');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET
  );

  res.send({ token, role: user.role, name: user.name });
});

// User submits payment
app.post('/payment', async (req, res) => {
  const { userId, plan, amount, txnId } = req.body;
  await Payment.create({ userId, plan, amount, txnId });
  res.send({ message: 'Payment submitted. Waiting for admin approval.' });
});

// Admin – view users
app.get('/admin/users', async (req, res) => {
  const users = await User.find({ role: 'user' });
  res.send(users);
});

// Admin – assign membership manually
app.post('/admin/assign', async (req, res) => {
  const { userId, plan } = req.body;
  const days = plan === 'hourly' ? 1 : plan === 'weekly' ? 7 : 30;

  await Membership.findOneAndUpdate(
    { userId },
    { plan, totalDays: days, remainingDays: days, status: 'active' },
    { upsert: true }
  );

  res.send({ message: 'Membership assigned successfully' });
});

// Admin – mark attendance
app.post('/admin/attendance', async (req, res) => {
  const { userId } = req.body;

  const membership = await Membership.findOne({ userId, status: 'active' });
  if (!membership || membership.remainingDays <= 0)
    return res.status(400).send('No active membership');

  membership.remainingDays--;
  await membership.save();

  await Attendance.create({
    userId,
    date: new Date().toDateString(),
    markedBy: ADMIN_NAME
  });

  res.send({ message: 'Attendance marked' });
});
// test route
app.get("/"),(req,res) => {
  res.send("Skedbord Play Park Backend is Running");
    });
// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Server running on port ',PORT);
});


