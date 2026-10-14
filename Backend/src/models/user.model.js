import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: function(){
      return !this.googleId; // If googleId is not present, password is required
    },
  },
  fullname: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["buyer", "seller"],
    default: "buyer",
  },
  googleId:{type:String}
});

// the pre middleware is used to hash the password before saving it to the database. This ensures that the password is stored securely and cannot be easily accessed by unauthorized users.

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * email
 * contact
 * password
 * fullname
 */

const userModel = mongoose.model("user", userSchema);

export default userModel;
