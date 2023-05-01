const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const usersModel = require("./models/users.js");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var MongoDBStore = require("connect-mongodb-session")(session);
var dbStore = new MongoDBStore({
    //uri: "mongodb://localhost:27017/connect_mongodb_session_test",
    uri: `mongodb+srv://${process.env.ATLAS_DB_USER}:${process.env.ATLAS_DB_PASSWORD}@cluster0.y8duirz.mongodb.net/comp2537w1?retryWrites=true&w=majority`,
    collection: "mySessions"
});

app.use(session({
    secret: "secret",
    store: dbStore,
    resave: false,
    saveUninitialized: false,
}))

app.get('/', (req, res) => {
    res.send(`
    <h1>Welcome</h1>
    <p>Please sign up or log in to continue:</p>
    <button><a style="color: black; text-decoration: none" href="/signup">Sign Up</a></button>
    <button><a style="color: black; text-decoration: none" href="/login">Log in</a></button>
    `)
})

app.use(express.json());

app.get("/signup", (req, res) => {
    res.send(`
    <form action="/signup" method="post">
    <input type="text", name="username", placeholder="Enter your username"/>
    <br>
    <input type="password", name="signPass", placeholder="Enter your password"/>
    <input type="submit", value="sign up"/>
    </form>
    `)
})

app.post("/signup", async (req, res) => {
    try {
        const password = req.body.signPass;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new usersModel({
            username: req.body.username,
            password: hashedPassword,
            type: "non-administrator"
        })
        await user.save();
        console.log(req.body.signPass);
        res.send(`<p>User successfully created!</p>
        <br>
        <button><a style="color: black; text-decoration: none" href="/login">Log in</a></button>`);
    } catch (error) {
        console.log(error);
        console.log(req.body.signPass);
        res.send("Error creating user");
    }
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

    const Joi = require("joi");
    app.use(express.json());
    const schema = Joi.object({
        password: Joi.alternatives().try(
            Joi.string(),
            Joi.number().integer().allow("")
        )
    });

    try {
        const value = await schema.validateAsync({ password: req.body.password });
    } catch (err) {
        console.log(err);
        console.log("Password must be a string or an integer");
        return
    }


    try {
        const result = await usersModel.findOne({
            username: req.body.username,
        })
        if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedUsername = req.body.username;
            req.session.loggedPassword = req.body.password;
            res.redirect("/protectedRoute");
        } else {
            res.send("incorrect password");
        }
    } catch (error) {
        console.log(error)
    }
});

// app.get("*", (req, res) => {
//     res.status(404).send("404 - Page not found");
// })

// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.status(401).json({ error: "access denied" });
    }
    next();
}
app.use(authenticatedOnly);


app.use(express.static("public"));
app.get("/protectedRoute", (req, res) => {
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;
    HTMLResponse = `
    Welcome
    <br>
    <img src="${imageName}" />
    <br>
    <form action="/logout" method="post">
        <input type="submit" value="Log out" />
    </form>
    `
    res.send(HTMLResponse);
});

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

const protectedRouteForAdminsOnlyMiddlewareFunction = async (req, res, next) => {
    try {
        const result = await usersModel.findOne(
            {
                username: req.session.loggedUsername
            }
        )
        if (result?.type != "administrator") {
            return res.send("Access denied");
        }
        next();
    } catch (error) {
        console.log(error);
    }
};
app.use(protectedRouteForAdminsOnlyMiddlewareFunction);

app.get("/protectedRouteForAdminsOnly", (req, res) => {
    res.send("Welcome Admin");
});

app.get("*", (req, res) => {
    res.status(404).send("404 - Page not found");
})

module.exports = app;

// for logging out. request.session.destroy(err)