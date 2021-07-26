const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Creating Schema
const categorySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
}, { timestamps: true })

// Creating model after schema
const Category = mongoose.model('Category', categorySchema)

module.exports = Category