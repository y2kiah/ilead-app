var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Organization
 */
var OrganizationSchema = Schema({
	organizationId:	{ type: String, index: true, lowercase: true },
	name:			{ type: String },
	customer:		{ type: Schema.ObjectId, ref: "Customer" },
	departments:	[{ type: Schema.ObjectId, ref: "Department" }]
});

module.exports = mongoose.model("Organization", OrganizationSchema);
