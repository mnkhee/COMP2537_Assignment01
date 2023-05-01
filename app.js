const express = require("express");
const app = express();
const session = require("express-session");
const usersModel = require("./models/users.js");

app.listen(3000, () => {
    console.log("server is running on port 3000")
})

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
//     },
//     {
//         username: "test",
//         password: "test",
//         type: "non-administrator"
//     }
// ]

app.use(session({
    secret: "secret"
}))

app.get('/', (req, res) => {
    res.send("Test");
})

app.get("/login", (req, res) => {
    res.send(`
    <form action="/login" method="post">
    <input type="text", name="username", placeholder="Enter your username"/>
    <br>
    <input type="password", name="password", placeholder="Enter your password"/>
    <input type="submit", value="login"/>
    </form>
    `)
})

// GLOBAL_AUTHENTICATED = false;
app.use(express.urlencoded({ extended: false }));
app.post("/login", async (req, res) => {
    const result = await usersModel.find({
        username: req.body.username,
        password: req.body.password
    })
    if (result) {
        req.session.GLOBAL_AUTHENTICATED = true;
        req.session.loggedUsername = req.body.username;
        req.session.loggedPassword = req.body.password;
    }
    res.redirect("/protectedRoute");
})

// only for authenticated users

const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).json({ error: "access denied" });
    }
    next();
}
app.use(authenticatedOnly);
app.get("/protectedRoute", (req, res) => {
    res.send("Welcome");
});

const protectedRouteForAdminsOnlyMiddlewareFunction = async (req, res, next) => {
    const result = await usersModel.findOne(
        {
            username: req.session.loggedUsername,
            password: req.session.loggedPassword
        }
    )
    if (result?.type != "administrator") {
        return res.send("Access denied");
    }
    next();
};
app.use(protectedRouteForAdminsOnlyMiddlewareFunction);

app.get("/protectedRouteForAdminsOnly", (req, res) => {
    res.send("Welcome Admin");
});

module.exports = app;