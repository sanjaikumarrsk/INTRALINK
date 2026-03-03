const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

// Build the standard auth response object
const authResponse = (user, token) => ({
  token,
  userId: user._id,
  role: user.role,
  name: user.name,
  mobileNumber: user.mobileNumber,
  ward: user.ward || '',
  createdAt: user.createdAt || null,
});

// ─── Register ────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, mobileNumber, password, confirmPassword, ward, address, emergencyContact, gender, dateOfBirth } = req.body;

    if (!name || !mobileNumber || !password) {
      return res.status(400).json({ message: 'Please provide name, mobileNumber, and password' });
    }

    // Validate mobile: 10 digits
    const trimmedMobile = String(mobileNumber).trim();
    if (!/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate confirm password if provided
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if mobile number already exists
    const existing = await User.findOne({ mobileNumber: trimmedMobile });
    if (existing) {
      return res.status(409).json({ message: 'Mobile number already registered' });
    }

    // Create user (role defaults to USER via schema)
    const user = await User.create({
      name: name.trim(),
      mobileNumber: trimmedMobile,
      password,
      ward: ward || null,
      address: address || '',
      emergencyContact: emergencyContact || '',
      gender: gender || '',
      dateOfBirth: dateOfBirth || null,
    });

    const token = generateToken(user);
    res.status(201).json(authResponse(user, token));
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── Login ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return res.status(400).json({ message: 'Please provide mobileNumber and password' });
    }

    const trimmedMobile = String(mobileNumber).trim();

    // Find user and explicitly select password field
    const user = await User.findOne({ mobileNumber: trimmedMobile }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const token = generateToken(user);
    res.json(authResponse(user, token));
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── Get current user (optional /auth/me) ────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      role: user.role,
      ward: user.ward || '',
      address: user.address || '',
      emergencyContact: user.emergencyContact || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || null,
      createdAt: user.createdAt || null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
