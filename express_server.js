const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

// Middleware

// Handles body (of forms submitted);
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Handles cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  secret: 'SuperSecureSecret'
}));

// Encyrpts cookies
const bcrypt = require('bcrypt');

// Static files
app.use(express.static(__dirname + '/public'));

// Globals
const users = {
  "userId": {
    id: "userId",
    email: "user@example.com",
    password: bcrypt.hashSync('password', 10)}
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    createdBy: 'userId'},
  '9sm5xK': {
    longURL: "http://www.google.com",
    createdBy: 'userId'}
};

// Generate random number for Id's
const generateRandomNumber = () => {
  return Math.floor((Math.random()) * 1e10).toString(32);
};

// Registeration email exists checker
const regChecker = (email, password) => {
  if (password === undefined) {
    for (randId in users) {
      if (users[randId].email === email){
        return true;
      }
    } return false;
  }
};

// This checks if the current userid (from the cookie) matches with the database
const userChecker = (currentUser) => {
  for (let user in users) {
    if (user === currentUser) {
      return true;
    }
  } return false;
};
// ------------------------ GET ENDPOINTS ------------------------

// Root Page
app.get("/", (req, res) => {
  let templateVars = { url: urlDatabase, username: users[req.session.user_id]};
  if (userChecker(req.session.user_id)) {
    res.render('urls_index', templateVars);
  } else {
    res.render('index', templateVars);
  }
});

// Login, redirects to root. ****Not Actively Linked****
app.get('/login', (req, res) => {
  res.redirect('/');
});

// Main Page
app.get('/urls', (req, res) => {
  if (userChecker(req.session.user_id)) {
    let customLinks = {};
    for (let link in urlDatabase){
      if (urlDatabase[link].createdBy === req.session.user_id){
        customLinks[link] = urlDatabase[link];
      }
    }
    let templateVars = {
      url: customLinks,
      username: users[req.session.user_id]
    };
    res.render('urls_index', templateVars);
  } else {
    res.status(401).send('Error: 401: You are not authorized, Please <a href="/"> Login </a>');
  }
});

// New Link Page ****Not Actively Linked****
app.get('/urls/new', (req, res) => {
  if (userChecker(req.session.user_id)) {
    let customLinks = {};
    for (let link in urlDatabase){
      if (urlDatabase[link].createdBy === req.session.user_id){
        customLinks[link] = urlDatabase[link];
      }
    }
    let templateVars = {
      url: customLinks,
      username: users[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  } else {
    res.status(401).send('Error: 401: You are not authorized, Please <a href="/"> Login </a>');
  }
});

// Url Custom Page ****Not Actively Linked****
app.get('/urls/:id', (req, res) => {
  if (!(urlDatabase[req.params.id])) {
    res.status(404).send('Error: 404: Page not found. <a href="/"> Go Back </a>');
    return;
  } if (!req.session.user_id) {
    res.status(401).send('Error: 401: You are not authorized, Please <a href="/"> Login </a>');
    return;
  } if (urlDatabase[req.params.id].createdBy !== req.session.user_id) {
    res.status(403).send('Error: 403: This is not your link! Please <a href="/"> Go Back </a>');
    return;
  } if (userChecker(req.session.user_id)) {

    let templateVars = {
      url: req.params.id,
      long: urlDatabase[req.params.id].longURL
    };
    res.render('urls_show', templateVars);
    return;
  }

});

// This is the short link that redirects to long url
app.get("/u/:shortURL", (req, res) => {
  if(!urlDatabase[req.params.shortURL]) {
    res.status(404).send('Error: 404: Page not found. <a href="/"> Go Back </a>');
  }
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});


// Registration Page
app.get('/register', (req, res) => {
  if (userChecker(req.session.user_id)){
    res.redirect('/');
  } res.render('register');
});

// ------------------------ POST ------------------------

// Delete url
app.post("/urls/:id/delete", (req, res) => {
  if (userChecker(req.session.user_id)) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send('403: You are not allowed to delete this');
  }
});

// Create URL
app.post("/urls", (req, res) => {
  if (userChecker(req.session.user_id)) {
    let newID = generateRandomNumber();
    urlDatabase[newID] = {
      longURL: req.body.longURL,
      createdBy: req.session.user_id
    };
    res.redirect('/urls');
  } else {
    res.status(401).send('Error: 401: You are not authorized, Please <a href="/"> Login </a>');
  }
});

// Update URL
app.post("/urls/:id", (req, res) => {
  if (!(urlDatabase[req.params.id])) {
    res.status(404).send('Error: 404: Page not found. <a href="/"> Go Back </a>');
    return;
  } if (!req.session.user_id) {
    res.status(401).send('Error: 401: You are not authorized, Please <a href="/"> Login </a>');
    return;
  } if (urlDatabase[req.params.id].createdBy !== req.session.user_id) {
    res.status(403).send('Error: 403: This is not your link! Please <a href="/"> Go Back </a>');
    return;
  } if (userChecker(req.session.user_id)) {
    urlDatabase[req.params.id] = {
      longURL: req.body.newURL,
      createdBy: req.session.user_id
    };
    res.redirect('/urls');
  }
});

// Login
app.post("/login", (req, res) => {
  // email-password checker
  for (user in users) {
    if (users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = users[user].id;
      res.redirect('/urls');
      return;
    }
  }
  res.status(401).send({error: 'User and Password do not match'});
});

// Logout
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/');
});

// Register
app.post('/register', (req, res) => {
  // checks if email or password is empty
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Email or password empty. <a href="/register">Go Back</a>');
  } else if (regChecker(req.body.email)) {
    res.status(400).send('Email already in database. Forgot? Well too bad. Make a new one. <a href="/register">Go Back</a>');
  } else {
    // generates a new id and assigns it into database
    let newUserId = generateRandomNumber();
    users[newUserId] = {
      id: newUserId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = newUserId;
    res.redirect('/urls');
  }
});

// This is where the magic begins
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
