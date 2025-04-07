import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
    {
        interview: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", required: true },
        text: { type: String, required: true },
        audio: { type: String },
        is_suggestion: { type: Boolean, default: false },
        sender: { type: String, enum: ["user", "vo_bot"], required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
