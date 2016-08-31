var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Person
 */
var PersonSchema = Schema({
	firstName:		{ type: String },
	lastName:		{ type: String },
	middleName:		{ type: String },
	displayName:	{ type: String },
	uid:			{ type: String, index: true },
	emplid:			{ type: String, index: true },
	title:			{ type: String },
	location:		{ type: String },
	gender:			{ type: String },
	employeetype:	{ type: String },
	email:			{ type: String },
	phone:			{ type: String },
	manager:		{ type: Schema.ObjectId, ref: "Person" },
	subordinates:	[{ type: Schema.ObjectId, ref: "Person" }], // array of immediate subordinates
	ancestors:		[{ type: Schema.ObjectId, ref: "Person" }], // array of ancestors (ObjectIds) ordered top to bottom
	inactive:		{ type: Boolean, default: false, index: true },
	inactiveDate:	{ type: Date, default: null },
	previousManagers: [{
						person:  { type: Schema.ObjectId, ref: "Person" },
						endDate: { type: Date }
					}],
	previousSubordinates: [{
						person:  { type: Schema.ObjectId, ref: "Person" },
						endDate: { type: Date }
					}],
	personLDAP:	{
		dn:				{ type: String, index: true },
		cn:				{ type: String },
		o:				{ type: String },
		ou:				{ type: String },
		l:				{ type: String },
		emplid:			{ type: String },
		uid:			{ type: String },
		title:			{ type: String },
		givenname:		{ type: String },
		middlename:		{ type: String },
		sn:				{ type: String },
		gender:			{ type: String, length: 8 },
		manager:		{ type: String },
		employeetype:	{ type: String },
		mail:			{ type: String, length: 256 },
		phone:			{ type: String, length: 16 },
		affiliation:	[{ type: String }],
		primaryaffiliation:	{ type: String },
		chgTimestamp:	{ type: Date, default: Date.now }
	}
});

// Static Methods

/**
 * get all descendants
 */
PersonSchema.statics.findDescendantsOf = function (personId, callback) {
	return this.find({ ancestors: personId }, callback);
};

// Instance Methods

/**
 * get manager
 */
PersonSchema.methods.findManager = function (callback) {
	return this.model("Person").find({ _id: this.manager }, callback);
};

/**
 * get all subordinates
 */
PersonSchema.methods.findSubordinates = function (callback) {
	return this.model("Person").find({ _id: { $in: this.subordinates } }, callback);
};

PersonSchema.methods.findDescendants = function (callback) {
	return this.model("Person").findDescendantsOf(this.id, callback);
};

/**
 * get all ancestors
 */
PersonSchema.methods.findAncestors = function (callback) {
	return this.model("Person").find({ _id: { $in: this.ancestors } }, callback);
};

module.exports = mongoose.model("Person", PersonSchema);
