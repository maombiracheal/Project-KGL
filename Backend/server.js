// 1. Import Dependencies
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const path = require('path');
const fs = require('fs');

// simple logger that writes to both stdout and a file for post-mortem debugging
const logFile = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
function log(...args) {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    console.log(msg);
    logStream.write(msg + '\n');
}
function logErr(...args) {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    console.error(msg);
    logStream.write('ERROR: ' + msg + '\n');
}

// 2. Import Routes
const userRoutes = require('./routes/User');
const authRoutes = require('./routes/auth');
const produceRoutes = require('./routes/Stock'); // Stock Management
const procurementRoutes = require('./routes/procurement');
const salesRoutes = require('./routes/Sales');
const creditSalesRoutes = require('./routes/creditSales');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/report');


// 3. Initialize Express
const app = express();

// 4. Connect to MongoDB
connectDB();

// Log every incoming request (method and URL) to help diagnose 404s/500s.
app.use((req, res, next) => {
    // collapse multiple slashes so //login.html behaves like /login.html
    if (req.url.includes('//')) {
        const orig = req.url;
        req.url = req.url.replace(/\/+/g, '/');
        log(`normalized url ${orig} -> ${req.url}`);
    }
    log(`req ${req.method} ${req.url}`);
    next();
});

// root/login route(s) – built prior to API middleware so we can control error handling
// serve login from frontend public directory (other dashboards may live in htmlDir)
const publicDir = path.join(__dirname, '../Frontend/public');
const htmlDir = path.join(__dirname, '../Frontend/html');
app.get(['/', '/login', '/login.html'], (req, res, next) => {
  try {
    const filePath = path.join(publicDir, 'login.html');
    log('login route invoked, checking file exists:', filePath, fs.existsSync(filePath));
    res.sendFile(filePath, (err) => {
      if (err) {
        logErr('sendFile error for login page:', err);
        next(err);
      } else {
        log('login file sent successfully');
      }
    });
  } catch (err) {
    logErr('unexpected error in login route:', err);
    next(err);
  }
});

// 5. Apply Middleware
app.use(cors()); // Allows your frontend to communicate with this backend
app.use(express.json()); // Allows the server to read JSON data from requests
app.use(express.urlencoded({ extended: false }));

// 6. Define API Endpoints
// Each business rule (Procurement, Sales, Reports) has its own dedicated path
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stock', produceRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/credit', creditSalesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);


// 7. Error Handling Middleware (Optional but recommended for better implementation)
app.use((err, req, res, next) => {
    logErr(err.stack);
    res.status(500).send({ message: 'Something went wrong on the server!' });
});
// serve static files from backend public directory
app.use(express.static(path.join(__dirname, "public")));
// serve dashboard/html files from dedicated html directory (mounted early to avoid conflict with root static)
app.use('/html', (req, res, next) => {
    const requested = req.path; // e.g. /Directors-dashboard.html
    const filePath = path.join(htmlDir, requested);
    log('html middleware check', requested, '->', filePath, 'exists?', fs.existsSync(filePath));
    next();
});
app.use('/html', express.static(htmlDir));
// serve frontend static assets from Frontend/public at root
app.use(express.static(publicDir));
// expose original Frontend folder under /Frontend (if other assets exist there)
app.use('/Frontend', express.static(path.join(__dirname, '../Frontend')));
// also serve any other files at root (fallback)
app.use(express.static(__dirname));

// 8. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    log(`KGL Server is running on port ${PORT}`);
  
});
