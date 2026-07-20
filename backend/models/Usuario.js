const mongoose = require("mongoose")

const usuarioSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    personaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Persona",
        required: true
    },
    rolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rol",
        required: true
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    activeSessionId: {
        type: String,
        default: null
    },
    activeDeviceInfo: {
        type: String,
        default: null
    },
    // Last time the active session made an authenticated request. Lets a dead
    // session (browser closed, crash, power loss - none of which can notify the
    // server) expire on its own instead of locking the account out forever.
    lastSeenAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Usuario", usuarioSchema)
