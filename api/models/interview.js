import mongoose from "mongoose";
import User from "./user"; // Make sure the path to the user model is correct
const interviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        // Add other fields as necessary
        visa_type: String,
        duration: Number,
        chats: [{
            type: JSON
        }],
        
        
    },
    { timestamps: true }
);

export default mongoose.model("Interviews", interviewSchema);
