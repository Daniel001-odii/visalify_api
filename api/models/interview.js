import mongoose from "mongoose";
const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Add other fields as necessary
    visa_type: { type: String, required: true },
    duration: { type: Number, default: 0 },
    vo_voice: { type: String },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "denied"],
    },
    country: { type: String, required: true },
    has_ended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
