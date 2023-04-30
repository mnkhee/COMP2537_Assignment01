const express = require('express');
const app = express();
const session = require('express-session');

app.listen(3000, () => {
    console.log('server is running on port 3000');
});

// const users = [
//     {
//         username: "admin",
//         password: "admin",
//         type: "administrator"
//     },
//     {
//         username: "user",
//         password: "user",
//         type: "non-administrator"
//     }
// ];

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
    if (users.find((user => user.username == req.body.username && user.password == req.body.password))) {
        req.session.GLOBAL_AUTHENTICATED = true;
        req.session.loggedUsername = req.body.username;
        req.session.loggedPassword = req.body.password;
    }
    res.redirect('/protectedRoute');
});

// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).json({ error: "access denied" });
    }
    next(); 
};

app.use(authenticatedOnly);
app.get('/protectedRoute', (req, res) => {
    res.send('Welcome');
});

const protectedRouteForAdminsOnlyMiddlewareFunctions = (req, res, next) => {
    if (users.find((user) => user.username == req.session.loggedUsername && user.password == req.session.loggedPassword)?.type != "administrator") {
        // return res.send("access denied");
        res.send("access denied");
    }
    next();
};
app.use(protectedRouteForAdminsOnlyMiddlewareFunctions);

app.get("/protectedRouteForAdminsOnly", (req, res) => {
    res.send("Welcome Admin");
})