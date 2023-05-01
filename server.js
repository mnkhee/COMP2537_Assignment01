const mongoose = require("mongoose");
const app = require("./app.js");

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/comp2537w1");

    //use `"await mongoose.connect("mongodb://user:password@127.0.0.1:17017/test");` if your database has auth enabled
    console.log("connected to db");
    app.listen(3000, () => {
        console.log("server is running on port 3000");
    })
}