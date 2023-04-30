const express = require('express');
const app = express();
const session = require('express-session');

app.listen(3000, () => {
    console.log('server is running on port 3000');
});


app.use(session({
    secret: 'the secret is sky color is blue ' // bad secret
}));

// public routes
app.get('/', (req, res) => {
    res.send('<h1> Hello World </h1>');
});


app.get('/login', (req, res) => {
    res.send(`
    <form action="/login" method="post">
      <input type="text" name="username" placeholder="Enter your username" />
      <br>
      <input type="password" name="password" placeholder="Enter your password" />
      <input type="submit" value="Login" />
    </form>
  `)
});

// GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }))
// built-in middleware function in Express. It parses incoming requests with urlencoded payloads and is based on body-parser.

app.post('/login', (req, res) => {
    // set a global variable to true if the user is authenticated
    if (req.body.username === 'admin' && req.body.password === 'admin') {
        req.session.GLOBAL_AUTHENTICATED = true;
    }
    res.redirect('/protectedRoute');

});

// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).json({ error: 'not authenticated' });
    }
    next(); // allow the next route to run
};

app.use(authenticatedOnly);
app.get('/protectedRoute', (req, res) => {
    res.send('<h1> protectedRoute </h1>');
});