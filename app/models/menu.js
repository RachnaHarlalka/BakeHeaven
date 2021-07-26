const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Creating Schema
const menuSchema = new Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    description: { type: String, required: true },
    categoryId: { type: String, required: true },
}, { timestamps: true })

// Creating model after schema
const Menu = mongoose.model('Menu', menuSchema)

module.exports = Menu