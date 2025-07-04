const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const port = 3000;
const Book = require("./models/bookModel");
const cookieParser = require("cookie-parser");
const secretKey = 'Krishn@invraj8'; 
const user = require("./models/User");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// set currentUser
app.use(async (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      const loggedInUser = await user.findById(decoded.userId);
      res.locals.currentUser = loggedInUser;
    } catch (err) {
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }
  next();
});

// Route Protection
const checkAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (err) {
    return res.redirect("/login");
  }
};

// Connect MongoDB
mongoose.connect("mongodb+srv://vraj_10:Atlas123@vrajcluster.f25aaog.mongodb.net/Book?retryWrites=true&w=majority&appName=vrajcluster")
  .then(() => console.log("MongoDB Connection Successful"))
  .catch(err => console.log(err));

// Start Server
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

// Routes

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Book List
app.get('/displayBooks', async (req, res) => {
  try {
    const books = await Book.find();           
    res.render('displayBooks', { books });     
  } catch (err) {
    res.send("Error occurred");
  }
});

// Add New Book (form)
app.get('/books/new', checkAuth, (req, res) => {
  res.render('new');
});

// Add New Book (logic)
app.post('/books', checkAuth, async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.token, secretKey);
    const loggedInUser = await user.findById(decoded.userId);

    const bookData = {
      ...req.body,
      author: loggedInUser.username
    };

    await Book.create(bookData);
    res.redirect('/displayBooks'); 
  } catch (err) {
    res.send("Error creating book");
  }
});

// Edit Book (form)
app.get('/books/:id/edit', checkAuth, async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.render('edit', { book });
});

// Update Book
app.post('/books/:id', checkAuth, async (req, res) => {
  const { title, description, category, rating, image } = req.body;
  await Book.findByIdAndUpdate(req.params.id, {
    title, description, category, rating, image
  });
  res.redirect('/displayBooks');
});

// Delete Book
app.post('/books/:id/delete', checkAuth, async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await user.create({ username, email, password: hashedPassword });
  res.redirect("/displayBooks");
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const existeduser = await user.findOne({ email });

  if (!existeduser) return res.send('User not found');

  const userPwd = await bcrypt.compare(password, existeduser.password);
  if (!userPwd) return res.send('Invalid password');

  const token = jwt.sign({ userId: existeduser._id }, secretKey, { expiresIn: '1h' });
  res.cookie('token', token);
  res.redirect('/displayBooks');
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});