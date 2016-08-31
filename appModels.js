var mongoose = require("mongoose");
var Schema = mongoose.Schema;

exports.Customer = require("./models/customer");

exports.modelNames = Object.keys(exports);

/**
 * 
 */
exports.setConnection = function (models, connection) {
	if (typeof models === "string") {
		models = [ models ];
	}
	if (Array.isArray(models)) {
		models.forEach(function (model) {
			if (exports[model]) {
				exports[model] = connection.model(model);
			}
		});
	}
};
