const mongoose = require("mongoose");
const usersSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    type: String,
    todos: [
        {
            name: String,
            done: {
                type: Boolean,
                default: false
            }
        }
    ]
});

const usersModel = mongoose.model("users", usersSchema);

module.exports = usersModel;