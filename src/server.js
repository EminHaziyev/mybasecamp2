const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const methodOverride = require('method-override');
const flash = require('connect-flash');
const layouts = require('express-ejs-layouts');
require('dotenv').config();

const { sequelize, User } = require('./sequelize');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(layouts);

// Static
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Sessions
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..') }),
    secret: process.env.SESSION_SECRET || 'change_me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
  })
);
app.use(flash());

// Auth locals
app.use(async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.isAuthenticated = false;
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        res.locals.currentUser = user;
        res.locals.isAuthenticated = true;
      } else {
        req.session.userId = null;
      }
    } catch (e) {}
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const threadRoutes = require('./routes/threads');
const messageRoutes = require('./routes/messages');
const attachmentRoutes = require('./routes/attachments');

app.use('/', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/threads', threadRoutes);
app.use('/messages', messageRoutes);
app.use('/attachments', attachmentRoutes);

app.get('/', (req, res) => {
  res.render('home');
});

// Boot
const PORT = process.env.PORT || 3000;

sequelize.sync().then(async () => {
  // Ensure at least one admin if none exist (optional bootstrap)
  const count = await User.count();
  if (count === 0) {
    await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: await User.hashPassword('admin123'), isAdmin: true });
    // eslint-disable-next-line no-console
    console.log('Seeded default admin: admin@example.com / admin123');
  }
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});


