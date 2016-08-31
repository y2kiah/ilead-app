var Organization = require("../models/organization");

exports.index = function(req, res) {
	Organization.find()
		.lean()
		.exec(function (err, organizationDocs) {
			res.send(JSON.stringify(organizationDocs));
		});
};

exports.new = function(req, res) {
	res.send('new');
};

exports.create = function(req, res) {
	res.send('create ' + JSON.stringify(req.params));
};

exports.show = function(req, res) {
	Organization.find({ id: req.params.organization })
		.lean()
		.exec(function (err, organizationDoc) {
			res.send(JSON.stringify(organizationDoc));
		});
};

exports.edit = function(req, res) {
	res.send('edit ' + req.params.organization);
};

exports.update = function(req, res) {
	res.send('update ' + req.params.organization);
};

exports.destroy = function(req, res) {
	res.send('destroy ' + req.params.organization);
};
