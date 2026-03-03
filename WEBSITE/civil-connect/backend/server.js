// ============================================================
// INFRALINK – Smart Civic & Disaster Governance System
// Node.js Express Backend
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// ─── App & HTTP server ──────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Legacy ward join
  socket.on('joinWard', (ward) => {
    if (ward) {
      socket.join(`ward-${ward}`);
      console.log(`[Socket] ${socket.id} joined ward-${ward}`);
    }
  });

  // Room-based join: role + ward
  socket.on('joinRoom', (data) => {
    const { userId, role, ward } = data || {};
    if (role === 'USER' && ward) {
      socket.join(`ward-${ward}`);
      socket.join('users');  // All users join the 'users' room for global USER broadcasts
      console.log(`[Socket] ${socket.id} (USER) joined ward-${ward} and users room`);
    } else if (role === 'USER') {
      socket.join('users');  // Users without ward still join 'users' room
      console.log(`[Socket] ${socket.id} (USER) joined users room`);
    } else if (role === 'WARD_AUTHORITY' && ward) {
      socket.join(`authority-${ward}`);
      socket.join(`ward-${ward}`);
      socket.join('authorities');  // All authorities join common room
      console.log(`[Socket] ${socket.id} (AUTHORITY) joined authority-${ward}`);
    } else if (role === 'ADMIN') {
      socket.join('admin');
      console.log(`[Socket] ${socket.id} (ADMIN) joined admin room`);
    } else if (role === 'HIGHER_AUTHORITY') {
      socket.join('higher');
      console.log(`[Socket] ${socket.id} (HIGHER_AUTHORITY) joined higher room`);
    }
    if (userId) {
      socket.join(`user-${userId}`);
    }
  });

  // Client-side zone update broadcast (fallback)
  socket.on('zoneUpdated', (data) => {
    console.log(`[Socket] Zone update from client:`, data);
    io.emit('zoneUpdate', data);
    if (data.ward) {
      io.to(`ward-${data.ward}`).emit('wardAlert', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve uploads folder ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ─────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const issueRoutes = require('./routes/issueRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Serve frontend static build ────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── MongoDB Connection & Server Start ──────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/infralink';

// ─── Seed Default Accounts (4 roles) ────────────────────────
const User = require('./models/User');
const Issue = require('./models/Issue');
const Notification = require('./models/Notification');

async function seedDefaultAccounts() {
  const defaults = [
    { name: 'System Admin', mobileNumber: '9000000001', password: 'admin123', role: 'ADMIN', ward: 'All' },
    { name: 'Ward Authority', mobileNumber: '9000000002', password: 'authority123', role: 'WARD_AUTHORITY', ward: 'Ward 1' },
    { name: 'Higher Authority', mobileNumber: '9000000003', password: 'higher123', role: 'HIGHER_AUTHORITY', ward: 'All' },
    { name: 'Demo Citizen', mobileNumber: '9000000004', password: 'user123', role: 'USER', ward: 'Ward 1' },
  ];

  for (const acc of defaults) {
    const exists = await User.findOne({ mobileNumber: acc.mobileNumber });
    if (!exists) {
      await User.create(acc);
      console.log(`[Seed] Created default account: ${acc.role} (${acc.mobileNumber})`);
    } else {
      // Update password + role for existing seed accounts to keep them in sync
      exists.password = acc.password;
      exists.role = acc.role;
      exists.name = acc.name;
      await exists.save();
      console.log(`[Seed] Updated default account: ${acc.role} (${acc.mobileNumber})`);
    }
  }
}

// ─── Seed 200 Default Issues ─────────────────────────────────
async function seedDefaultIssues() {
  const count = await Issue.countDocuments();
  if (count >= 200) {
    console.log(`[Seed] Issues already seeded (${count} found)`);
    return;
  }
  // Clear any partial data and reseed
  if (count > 0 && count < 200) {
    await Issue.deleteMany({});
    console.log(`[Seed] Cleared ${count} partial issues, reseeding...`);
  }

  const types = [
    { category: 'road_damage', title: 'Road Damage', img: 'road.jpg' },
    { category: 'garbage', title: 'Garbage Complaint', img: 'garbage.jpg' },
    { category: 'drainage', title: 'Drainage Blockage', img: 'drainage.jpg' },
    { category: 'water_leakage', title: 'Water Leakage', img: 'water_leak.jpg' },
    { category: 'streetlight', title: 'Streetlight Not Working', img: 'streetlight.jpg' },
    { category: 'tree_fallen', title: 'Tree Fallen', img: 'tree.jpg' },
    { category: 'fire_hazard', title: 'Fire Hazard', img: 'fire.jpg' },
    { category: 'flooding', title: 'Flooding', img: 'flood.jpg' },
    { category: 'pothole', title: 'Pothole', img: 'pothole.jpg' },
    { category: 'broken_footpath', title: 'Broken Footpath', img: 'footpath.jpg' },
  ];

  // Fixed distribution: 80 pending, 60 in_progress, 40 solved, 20 escalated = 200
  const statusPool = [
    ...Array(80).fill('pending'),
    ...Array(60).fill('in_progress'),
    ...Array(40).fill('solved'),
    ...Array(20).fill('escalated'),
  ];
  // Shuffle status pool
  for (let i = statusPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusPool[i], statusPool[j]] = [statusPool[j], statusPool[i]];
  }

  const descriptions = {
    road_damage: ['Severe road damage near junction causing traffic delays', 'Road surface completely broken needs immediate repair', 'Asphalt cracking on main road affecting commuters', 'Road collapse near bridge area dangerous for vehicles'],
    garbage: ['Garbage overflowing from bins for days', 'Waste not collected causing health hazard', 'Illegal dumping of waste in residential area', 'Garbage pile blocking pedestrian path'],
    drainage: ['Drain blocked causing severe water logging', 'Open drain cover missing near school zone', 'Sewage overflow on main street causing smell', 'Drain clogged with construction debris'],
    water_leakage: ['Water pipe burst flooding the road', 'Continuous water leakage from underground pipeline', 'Leaking pipe wasting water near market', 'Water supply pipe damaged during construction'],
    streetlight: ['Street light not working for over a week', 'Multiple lights off creating safety concern', 'Flickering streetlight needs replacement', 'Broken light pole fallen on footpath'],
    tree_fallen: ['Large tree fallen blocking main road', 'Fallen tree damaged parked vehicles', 'Uprooted tree near school creating risk', 'Heavy branch fallen on power lines'],
    fire_hazard: ['Electric wire sparking near residential building', 'Fire risk from exposed wiring at market', 'Garbage fire near apartment complex', 'Short circuit risk from damaged transformer'],
    flooding: ['Street flooded after heavy rain', 'Water logging in residential colony', 'Underpass completely flooded blocking traffic', 'Flooding near hospital entrance area'],
    pothole: ['Deep pothole on highway causing accidents', 'Multiple dangerous potholes on main road', 'Pothole near school zone needs urgent fix', 'Large pothole filled with water misleading drivers'],
    broken_footpath: ['Footpath broken and dangerous for pedestrians', 'Missing tiles on footpath near bus stop', 'Cracked footpath near hospital entrance', 'Footpath damaged by tree roots'],
  };

  const locations = [
    { name: 'MG Road', lat: 10.7900, lng: 78.7000 },
    { name: 'Koramangala', lat: 10.7850, lng: 78.7100 },
    { name: 'Indiranagar', lat: 10.8000, lng: 78.6900 },
    { name: 'Whitefield', lat: 10.7750, lng: 78.7200 },
    { name: 'Jayanagar', lat: 10.8050, lng: 78.6800 },
    { name: 'BTM Layout', lat: 10.7700, lng: 78.7300 },
    { name: 'HSR Layout', lat: 10.8100, lng: 78.6700 },
    { name: 'Electronic City', lat: 10.7600, lng: 78.7400 },
    { name: 'Marathahalli', lat: 10.8150, lng: 78.6600 },
    { name: 'Hebbal', lat: 10.7500, lng: 78.7500 },
    { name: 'Rajajinagar', lat: 10.8200, lng: 78.6500 },
    { name: 'Basavanagudi', lat: 10.7950, lng: 78.7050 },
    { name: 'Malleshwaram', lat: 10.8025, lng: 78.6950 },
    { name: 'Yelahanka', lat: 10.7825, lng: 78.7150 },
    { name: 'JP Nagar', lat: 10.7975, lng: 78.6975 },
  ];

  const demoUser = await User.findOne({ mobileNumber: '9000000004' });
  const authority = await User.findOne({ mobileNumber: '9000000002' });

  const issues = [];
  for (let i = 0; i < 200; i++) {
    const type = types[i % types.length];
    const status = statusPool[i];
    const wardNum = (i % 10) + 1;
    const ward = `Ward ${wardNum}`;
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const descs = descriptions[type.category];
    const desc = descs[Math.floor(Math.random() * descs.length)];
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    // Build expected completion date for in_progress issues (7-30 days from created)
    let expectedCompletionDate = null;
    if (status === 'in_progress') {
      expectedCompletionDate = new Date(createdAt);
      expectedCompletionDate.setDate(expectedCompletionDate.getDate() + Math.floor(Math.random() * 23) + 7);
    }

    issues.push({
      title: `${type.title} at ${loc.name} - ${ward}`,
      description: desc,
      category: type.category,
      status,
      ward,
      latitude: parseFloat((loc.lat + latOffset).toFixed(6)),
      longitude: parseFloat((loc.lng + lngOffset).toFixed(6)),
      image: `sample/${type.img}`,
      reportedBy: demoUser?._id || null,
      assignedTo: status !== 'pending' && authority ? authority._id : null,
      expectedCompletionDate,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Issue.insertMany(issues);
  console.log('[Seed] 200 Issues Seeded Successfully');
  console.log(`[Seed] Distribution: pending=${statusPool.filter(s=>s==='pending').length}, in_progress=${statusPool.filter(s=>s==='in_progress').length}, solved=${statusPool.filter(s=>s==='solved').length}, escalated=${statusPool.filter(s=>s==='escalated').length}`);
}

// ─── Seed 20 Default Notifications ──────────────────────────
async function seedDefaultNotifications() {
  const count = await Notification.countDocuments();
  if (count > 0) {
    console.log(`[Seed] Notifications already seeded (${count} found)`);
    return;
  }

  const notifications = [
    { title: 'Flood Warning', message: 'Flood warning issued for Ward 3 - Take precautions immediately', type: 'ZONE_ALERT', severity: 'critical', roleTarget: 'ALL', ward: 'Ward 3' },
    { title: 'Issue Resolved', message: 'Garbage complaint in Ward 5 has been resolved by municipal team', type: 'STATUS_UPDATE', severity: 'info', roleTarget: 'ALL', ward: 'Ward 5' },
    { title: 'Road Repaired', message: 'Road repair completed on MG Road, Ward 1 - Traffic restored', type: 'STATUS_UPDATE', severity: 'info', roleTarget: 'ALL', ward: 'Ward 1' },
    { title: 'Maintenance Update', message: 'Scheduled maintenance: Water supply disruption in Ward 2 tomorrow 10AM-4PM', type: 'ANNOUNCEMENT', severity: 'warning', roleTarget: 'USER', ward: 'Ward 2' },
    { title: 'New Report', message: 'New drainage blockage reported in Ward 4 market area', type: 'REPORT', severity: 'info', roleTarget: 'WARD_AUTHORITY', ward: 'Ward 4' },
    { title: 'Streetlight Fixed', message: 'Streetlight repair completed in Ward 8 main road', type: 'STATUS_UPDATE', severity: 'info', roleTarget: 'ALL', ward: 'Ward 8' },
    { title: 'Cyclone Warning', message: 'Cyclone warning: Ward 6 and Ward 9 residents advised to stay indoors', type: 'ZONE_ALERT', severity: 'critical', roleTarget: 'ALL', ward: 'Ward 6' },
    { title: 'Tree Fallen', message: 'Tree fallen on road in Ward 10 - Authorities dispatched for clearance', type: 'REPORT', severity: 'warning', roleTarget: 'ALL', ward: 'Ward 10' },
    { title: 'Leak Fixed', message: 'Water leakage in Ward 1 pipeline fixed by municipal team', type: 'STATUS_UPDATE', severity: 'info', roleTarget: 'ALL', ward: 'Ward 1' },
    { title: 'Issue Escalated', message: 'Pothole complaint escalated to higher authority - Ward 5', type: 'STATUS_UPDATE', severity: 'warning', roleTarget: 'HIGHER_AUTHORITY', ward: 'Ward 5' },
    { title: 'Monthly Report', message: 'Monthly report: 45 issues resolved across all wards this month', type: 'ANNOUNCEMENT', severity: 'info', roleTarget: 'ALL' },
    { title: 'Authority Update', message: 'New ward authority assigned for Ward 3 operations', type: 'ANNOUNCEMENT', severity: 'info', roleTarget: 'ADMIN' },
    { title: 'Footpath Report', message: 'Broken footpath near district hospital in Ward 2 reported', type: 'REPORT', severity: 'info', roleTarget: 'WARD_AUTHORITY', ward: 'Ward 2' },
    { title: 'Hazard Cleared', message: 'Fire hazard cleared in Ward 7 industrial area - Zone now safe', type: 'STATUS_UPDATE', severity: 'info', roleTarget: 'ALL', ward: 'Ward 7' },
    { title: 'Road Work', message: 'Road resurfacing scheduled for Ward 9 main road next week', type: 'ANNOUNCEMENT', severity: 'info', roleTarget: 'USER', ward: 'Ward 9' },
    { title: 'Flooding Report', message: 'Flooding reported in Ward 6 underpass - Alternate routes advised', type: 'REPORT', severity: 'warning', roleTarget: 'ALL', ward: 'Ward 6' },
    { title: 'Ward Performance', message: 'All issues in Ward 8 resolved this week - Top performing ward', type: 'ANNOUNCEMENT', severity: 'info', roleTarget: 'ALL', ward: 'Ward 8' },
    { title: 'New Scheme', message: 'New civic improvement scheme launched by municipal corporation for all wards', type: 'ANNOUNCEMENT', severity: 'info', roleTarget: 'ALL' },
  ];

  const seeded = notifications.map((n, i) => ({
    ...n,
    read: Math.random() > 0.5,
    createdAt: new Date(Date.now() - (i + 1) * 3600000 * Math.floor(Math.random() * 24 + 1)),
  }));

  await Notification.insertMany(seeded);
  console.log('[Seed] Created 20 default notifications');
}


mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('[MongoDB] Connected to', MONGO_URI);
    await seedDefaultAccounts();
    await seedDefaultIssues();
    await seedDefaultNotifications();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[INFRALINK] Running on http://0.0.0.0:${PORT}`);
      console.log(`[Socket.IO] Ready for real-time connections`);

      // Socket alive test — emits every 10 seconds
      setInterval(() => {
        io.emit('socketTest', { msg: 'alive', time: new Date().toISOString() });
      }, 10000);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });
