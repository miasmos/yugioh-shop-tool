var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	id: String,
	name: String,
	rarity: String,
	source: String,
	date: { type: Date, default: Date.now }
});

module.exports = {schema:schema, model:mongoose.model('card',schema)};