var Department = require("../models/department");
var Organization = require("../models/organization");

exports.index = function(req, res) {
	/*{ $and: [{ inactive: false },
							 { name: { $ne: "" } }] }
	*/
	//res.send(req.params.customer + " " + req.params.organization);
	Department.find({ name: { $ne: "" } })
		.lean()
		.exec(function (err, departmentDocs) {
			res.send(JSON.stringify(departmentDocs));
		});
};

exports.new = function(req, res) {
	res.send(Department.schema.tree);
};

exports.create = function(req, res) {
	var fields = {
		departmentId:	req.body.departmentId,
		name:			req.body.name,
		organization:	req.body.organization
	};
	
	Department.create(fields, function (err, departmentDoc) {
		if (err) {
			res.send("error");
		} else {
			res.send(req.body);
		}
	});
};

exports.show = function(req, res) {
	//res.send(req.params.customer + " " + req.params.organization + " " + req.params.department);
	
	/*Organization
		.findOne({ organizationId: req.params.organization })
		.populate()
		.exec();*/
		
	Department.findOne({ $and: [{ name: req.params.department },
								{ name: { $ne: "" } }] })
		.lean()
		.exec(function (err, departmentDoc) {
			res.send(JSON.stringify(departmentDoc));
		});
};

exports.edit = function(req, res) {
	res.send('edit ' + req.params.department);
};

exports.update = function(req, res) {
	res.send('update ' + req.params.department);
};

exports.destroy = function(req, res) {
	res.send('destroy ' + req.params.department);
};
