const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE MODEL ---
const WitchSchema = new mongoose.Schema({
    magicalName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    ritualHash: { type: String, required: true }
});
const Witch = mongoose.model("Witch", WitchSchema);

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🔮 Connected to the Ancient Grimoire (MongoDB)"))
    .catch((err) => console.log("❌ Connection failed:", err));

// --- HELPER FUNCTION ---
const stringifyRitual = (ritualArray) => ritualArray.join('-').toLowerCase();

// --- ROUTES ---
app.post("/initiate", async (req, res) => {
    try {
        const { magicalName, email, ritualSequence, confirmRitualSequence } = req.body;

        if (!magicalName || !email || !ritualSequence || !confirmRitualSequence) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (ritualSequence.length < 4) {
            return res.status(400).json({ message: "Ritual must contain at least 4 ingredients." });
        }
        if (stringifyRitual(ritualSequence) !== stringifyRitual(confirmRitualSequence)) {
            return res.status(400).json({ message: "Your ritual sequences do not match!" });
        }

        const existingWitch = await Witch.findOne({ email });
        if (existingWitch) {
            return res.status(400).json({ message: "Email is already bound to the Grimoire." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedRitual = await bcrypt.hash(stringifyRitual(ritualSequence), salt);

        const newWitch = new Witch({ magicalName, email, ritualHash: hashedRitual });
        await newWitch.save();

        res.status(201).json({ message: "Initiation complete! You may now cast your login spell." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/cast", async (req, res) => {
    try {
        const { email, ritualSequence } = req.body;

        const witch = await Witch.findOne({ email });
        if (!witch) return res.status(400).json({ message: "No witch found with that email." });

        const isMatch = await bcrypt.compare(stringifyRitual(ritualSequence), witch.ritualHash);
        if (!isMatch) return res.status(400).json({ message: "The ritual failed. Incorrect ingredients." });

        res.json({ message: "Login successful!", magicalName: witch.magicalName });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(process.env.PORT || 5000, () => console.log(`🌙 Coven gathering on port 5000`));