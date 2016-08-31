var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Scale
 */
//var units = ["normalized","quantity","percentage","dollars","days"];

var ScaleSchema = Schema({
	name:		{ type: String }, // likert, normalized, ten point, etc.
	//units:		{ type: String, enum: units, default: "normalized" }, // units don't belong in the scale, they belong with the measurement
	min:		{ type: Number, default: 0 },
	max:		{ type: Number, default: 1 },
	discrete:	{ type: Boolean, default: false },
	step:		{ type: Number } // applies to discrete
});

module.exports = mongoose.model("Scale", ScaleSchema);
