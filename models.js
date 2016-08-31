var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var sysModels = {
	Customer:		require("./models/customer")
};

var customerModels = {
	Organization:	require("./models/organization"),
	Department:		require("./models/department"),
	Person:			require("./models/person")
};

/**
 * 
 */
var setConnection = function (models, connection) {
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

// export functions

/**
 * 
 */
exports.setCustomerConnection = function (connection) {
	setConnection(Object.keys(customerModels), connection);
}

/**
 * 
 */
exports.setSysConnection = function (connection) {
	setConnection(Object.keys(sysModels), connection);
}

// export models
Object.keys(sysModels).forEach(function (model) {
	exports[model] = sysModels[model];
});

Object.keys(customerModels).forEach(function (model) {
	exports[model] = customerModels[model];
});

/*	exports.PerformanceReview = schema.define("PerformanceReview", {
		
	});
	
	exports.PerformanceObjective = schema.define("PerformanceObjective", {
		
	});
	
	exports.PerformanceEvaluation = schema.define("PerformanceEvaluation", {
		value:			{ type: Number }	// example scale: 0=Needs Improvement, 1=Meets Expectations, 2=Exceeds Expectations
	});
	
	exports.PerformanceReviewTemplate = schema.define("PerformanceReviewTemplate", {
		
	});
	
	exports.Cycle = schema.define("Cycle", {
		
	});
	
	exports.Scale = schema.define("Scale", {
		keyValues:		{ type: jdb.Schema.JSON }
	});
	*/
	// Relationships
	
	// set up relationships
/*	exports.Customer.hasMany("organizations", { model: exports.Organization, foreignKey: "organization_id" });
	
	exports.Organization.belongsTo("customer", { model: exports.Customer });
	exports.Organization.hasMany("departments", { model: exports.Department, foreignKey: "department_id" });
	exports.Organization.hasMany("cycles", { model: exports.Cycle, foreignKey: "cycle_id" });
	
	exports.Department.belongsTo("organization", { model: exports.Organization });
	exports.Department.hasMany("employees", { model: exports.Person, foreignKey: "employee_id" });
	exports.Department.hasOne("orgUnitLDAP", { model: exports.OrgUnitLDAP, foreignKey: "orgUnitLDAP_id" });
	
	exports.OrgUnitLDAP.belongsTo("department", { model: exports.Department });
	
	exports.Cycle.belongsTo("organization");
	exports.Cycle.hasMany("performanceReviews");
	
	exports.Person.belongsTo("department");
	exports.Person.hasOne("manager", { model: exports.Person });
	exports.Person.hasMany("subordinates", { model: exports.Person });
	exports.Person.hasMany("performanceReviews");
	exports.Person.hasOne("personLDAP", { model: exports.PersonLDAP });
	
	exports.PersonLDAP.belongsTo("person");
	
	exports.PerformanceReview.belongsTo("employee", { model: exports.Person });
	exports.PerformanceReview.belongsTo("cycle");
	exports.PerformanceReview.hasMany("performanceEvaluations");
	
	exports.PerformanceEvaluation.belongsTo("performanceReview");
	exports.PerformanceEvaluation.hasOne("performanceObjective");
	
	exports.PerformanceReviewTemplate.hasMany("performanceObjectives");
*/
