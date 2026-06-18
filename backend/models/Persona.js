const mongoose = require("mongoose")

const personaSchema = new mongoose.Schema({
    ownerName: {
        type: String,
        required: true
    },
    restaurantName: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    avatar: {
        type: String,
        default: ''
    },
    currencySymbol: {
        type: String,
        default: '$'
    },
    printerConnection: {
        type: String,
        default: ''
    },
    taxRate: {
        type: Number,
        default: 10
    },
    theme: {
        type: String,
        default: 'light'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Persona", personaSchema)
