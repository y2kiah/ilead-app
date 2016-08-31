var Customer = require("../models/customer");

exports.index = function(req, res) {
	Customer.find()
		.lean()
		.exec(function (err, customerDocs) {
			res.send(JSON.stringify(customerDocs));
		});
};

exports.new = function(req, res) {
	res.send('new');
};

exports.create = function(req, res) {
	res.send('create ' + JSON.stringify(req.params));
};

exports.show = function(req, res) {
	res.send(req.params.customer);
	Customer.find({ customerId: req.params.customer })
		.lean()
		.exec(function (err, customerDoc) {
			res.send(JSON.stringify(customerDoc));
		});
};

exports.edit = function(req, res) {
	res.send('edit ' + req.params.customer);
};

exports.update = function(req, res) {
	res.send('update ' + req.params.customer);
};

exports.destroy = function(req, res) {
	res.send('destroy ' + req.params.customer);
};
