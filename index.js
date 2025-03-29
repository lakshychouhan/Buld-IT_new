const express = require('express');
const app = express();
const fs = require('fs');
const session = require('express-session');

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use("/images", express.static("images"));
app.use("/styles", express.static("styles"));

// Session configuration
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret
  resave: false,
  saveUninitialized: false
}));

// Dummy user data (replace with a database later)
const users = [
  { id: 1, username: 'admin', password: 'password123' }
];

// Load prebuild data
let prebuild;
fs.readFile('./build_data/pb.json', function (err, data) {
  if (err) {
    console.error('Error reading pb.json:', err);
    throw err;
  }
  prebuild = JSON.parse(data);
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.loggedIn) {
    return next();
  }
  res.redirect('/');
}

// Routes
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.render('home', { username: req.session.username }); // Render home page if logged in
  } else {
    res.render('login', { error: null }); // Render login page if not logged in
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.loggedIn = true;
    req.session.username = user.username;
    res.redirect('/'); // Redirect to home page after login
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

app.get('/build', isAuthenticated, (req, res) => {
  res.render('buildStart');
});

app.get('/doc', isAuthenticated, (req, res) => {
  res.render('documentation/doc');
});

app.get('/prebuild', isAuthenticated, (req, res) => {
  res.render('options', { pb: prebuild });
});

// Route for the contact page
app.get('/contact', isAuthenticated, (req, res) => {
  res.render('contact');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
app.get('/about', (req, res) => {
  res.render('about');
});

// Routers for intel and amd (protected)
const intelRouter = require('./routes/intel');
const amdRouter = require('./routes/amd');

app.use('/intel', isAuthenticated, intelRouter);
app.use('/amd', isAuthenticated, amdRouter);

// Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});