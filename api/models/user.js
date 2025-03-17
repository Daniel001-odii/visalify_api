import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile_img: {
      type: String,
    },
    subscription: {
      type: String,
      enum: ["free", "premium"],
      default: "free"
    },

    email_verified: {
      type: Boolean,
      default: false,
    },

    interview_date: Date,
    language: String,
    subscription_start_date: Date,
    subscription_end_date: Date,

    last_login: Date,
    nationality: String,
    target_country: String,
    visa_type: String,
    travelled_before: String,
    visa_refused_before: String,
    occupation: String,



  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


export default mongoose.model("User", userSchema);
