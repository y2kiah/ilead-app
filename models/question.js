var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Question
 */
var QuestionSchema = Schema({
	text:			{ type: String },
	hint:			{ type: String },
	category:		{ type: String }, // enum this
	availableFor:	{ type: String }, // enum this
	customer:		{ type: Schema.ObjectId, ref: "Customer" }
});

module.exports = mongoose.model("Question", QuestionSchema);
