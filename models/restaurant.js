// imports
const mongoose = require("mongoose")


const restaurantSchema = new mongoose.Schema({
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
    username: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        min: 6,
        max: 18,
        required: true
    },
    isadmin: {
        type: Boolean,
        default: false
    },
    taxRate: {
        type: Number,
        default: 10
    },
    currencySymbol: {
        type: String,
        default: '$'
    },
    printerConnection: {
        type: String,
        default: ''
    },
    theme: {
        type: String,
        default: 'light'
    },
    avatar: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model("Restaurant", restaurantSchema);