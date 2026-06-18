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
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Usuario", usuarioSchema)
