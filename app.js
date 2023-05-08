const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const usersModel = require("./models/users.js");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const ejs = require("ejs");

app.set("view engine", "ejs");

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var MongoDBStore = require("connect-mongodb-session")(session);
var dbStore = new MongoDBStore({
    uri: `mongodb+srv://${process.env.ATLAS_DB_USER}:${process.env.ATLAS_DB_PASSWORD}@cluster0.y8duirz.mongodb.net/comp2537w1?retryWrites=true&w=majority`,
    collection: "mySessions",
});

app.use(
    session({
        secret: "secret",
        store: dbStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 3600000
        }
    })
);

// Middleware that checks if the user has previously logged in
const checkLoggedIn = (req, res, next) => {
    if (req.session.GLOBAL_AUTHENTICATED) {
        return res.redirect("/home");
    }
    next();
};

app.get("/", checkLoggedIn, (req, res) => {
    res.render("initial.ejs", {
    });
});

app.use(express.json());

app.get("/signup", checkLoggedIn, (req, res) => {
    res.render("signup.ejs", {});
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username) {
        return res.status(400).send("username required");
    }

    if (!email) {
        return res.status(400).send("email required");
    }

    if (!password) {
        return res.status(400).send("password required");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new usersModel({
            username: username,
            email: email,
            password: hashedPassword,
            type: "user",
        });
        await user.save();
        console.log(password);
        res.send(`<p>User successfully created!</p>
        <br>
        <button><a style="color: black; text-decoration: none" href="/login">Log in</a></button>`);
    } catch (error) {
        console.log(error);
        console.log(password);
        res.send("Error creating user");
    }
});

app.get("/login", checkLoggedIn, (req, res) => {
    res.render("login.ejs", {});
});

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
            email: req.body.email,
        });
        if (bcrypt.compareSync(req.body.password, result?.password)) {
            req.session.GLOBAL_AUTHENTICATED = true;
            req.session.loggedUsername = result?.username;
            req.session.loggedEmail = req.body.email;
            req.session.loggedPassword = req.body.password;
            req.session.loggedType = result?.type;
            res.redirect("/members");
        } else {
            res.send("incorrect password");
        }
    } catch (error) {
        console.log(error)
    }
});

// only for authenticated users
const authenticatedOnly = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        //return res.status(401).json({ error: "access denied" });
        app.use(function (req, res, next) {
            res.status(401).send("Access Denied");
        })
    }
    next();
}
app.use(authenticatedOnly);

const requireLogin = (req, res, next) => {
    if (!req.session.GLOBAL_AUTHENTICATED) {
        return res.redirect("/login");
    }
    next();
};


app.use(requireLogin);

app.get("/home", requireLogin, (req, res) => {
    res.render("home.ejs", { "user": req.session.loggedUsername });
})

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});


app.use(express.static("public"));
app.get("/members", requireLogin, (req, res) => {
    const randomImageNumber = Math.floor(Math.random() * 3) + 1;
    const imageName = `00${randomImageNumber}.png`;

    res.render("members.ejs", {
        "user": req.session.loggedUsername,
        "image": imageName,
        "isAdmin": req.session.loggedType == "administrator",
    });
});

const authenticatedAdmin = async (req, res, next) => {
    try {
        const result = await usersModel.findOne(
            {
                email: req.session.loggedEmail,
            }
        )
        console.log(req.session.loggedEmail);
        if (result?.type != "administrator") {
            return res.send("Access denied");
        }
        next();
    } catch (error) {
        console.log(error);
    }
};

app.use(authenticatedAdmin);

app.get("/admin", requireLogin, async (req, res) => {
    const users = await usersModel.find();
    res.render("admin", { "users": users });
});

app.post("/admin/promote", async (req, res) => {
    const userId = req.body;
    try {
        const result = await usersModel.updateOne(
            { _id: userId.userId },
            { $set: { type: "administrator" } }
        );
        res.redirect("/admin");
    } catch (error) {
        res.send("An error happened, please try again");
    }
});

app.post("/admin/demote", async (req, res) => {
    const userId = req.body;
    try {
        const result = await usersModel.updateOne(
            { _id: userId.userId },
            { $set: { type: "user" } }
        );
        res.redirect("/admin");
    } catch (error) {
        res.send("An error happened, please try again");
    }
});

app.use(function (req, res, next) {
    res.status(404).send("404 - Page not found")
})

module.exports = app;

