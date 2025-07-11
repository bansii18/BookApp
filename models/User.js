const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username:{  
        type : String,
        required : true,
    },
    email: {
        type : String,
        required : true,
    },
    password:{  
        type : String,
        required : true,
        minlength : [6,"MINIMUM PASSWORD LENGTH IS 6"],
    }
});
module.exports = mongoose.model("User",userSchema);