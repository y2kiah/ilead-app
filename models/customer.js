var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Customer
 */
var CustomerSchema = Schema({
	customerId:		{ type: String, index: { unique: true }, lowercase: true },
	name:			{ type: String }
});

module.exports = mongoose.model("Customer", CustomerSchema);
