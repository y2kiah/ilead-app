var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Department
 */
var DepartmentSchema = Schema({
	departmentId:	{ type: String, index: true, lowercase: true },
	name:			{ type: String, index: true },
	organization:	{ type: Schema.ObjectId, ref: "Organization" },
	members:		[{ type: Schema.ObjectId, ref: "Person" }],
	orgUnitLDAP: {
		dn:			{ type: String, index: true },
		o:			{ type: String },
		ou:			{ type: String }
	}
});

module.exports = mongoose.model("Department", DepartmentSchema);
