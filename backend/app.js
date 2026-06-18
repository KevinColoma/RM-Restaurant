const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
if (process.env.NODE_ENV === 'test') {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
}
const express = require('express')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); 
const connectDB = require('./db'); 
const session = require('express-session');
const multer = require('multer');
const webRoutes = require('./routes/restaurantRoutes')
const port = process.env.PORT
const app = express()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, 'avatar-' + req.personaId + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
app.use((req, res, next) => { req.upload = upload; next(); });


app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge:  24 * 60 * 60 * 1000 }, 
}));

app.use((req,res,next)=>{
    res.set('Cache-Control','no-store, no-cache,must-revalidate,private')
   res.setHeader('Expires', '-1')
   res.setHeader('pragma','no-cache')
    next();
})





app.use(webRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).render('404');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`RMS app listening on port ${port}!`));
}

module.exports = app; 