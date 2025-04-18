import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },

    profile_img: { type: String },

    provider: {
      type: String,
      enum: ["google", "visalify"],
      default: "visalify",
    },

    subscription: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    subscription_status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "inactive"],
      default: "inactive",
    },
    customer_code: String,

    last_login: Date,
    last_login_string: String,

    interview_date: Date,
    language: { type: String, default: "english" },

    nationality: { type: String, default: "nigeria" },
    target_country: { type: String },

    onboarding_complete: {
      type: Boolean,
      default: false,
    },

    reset_password_token: String,
    reset_password_expires: Date,

    visa_type: {
      type: String,
      enum: [
        "Student Visa (F-1)",
        "Work Visa (H-1B)",
        "Tourist Visa (B-2)",
        "Family Visa",
      ],
    },

    visa_tip: {
      tips: [
        {
          type: String,
        }
      ],
      date: Date,
    },

    travelled_before: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    visa_refused_before: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    occupation: String,

    settings: {
      expert_suggestions: { type: Boolean, default: true },
      daily_tips_mail: { type: Boolean, default: true },
      vo_gender: {
        type: String,
        enum: ["male", "female"],
        default: "female",
      },
      vo_voice: { type: String },
      test_level: {
        type: String,
        enum: ["easy", "medium", "hard"],
      },
      voice_over: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
