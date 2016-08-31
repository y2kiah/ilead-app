var Question = require("../models/question");

exports.index = function(req, res) {
	Question.find()
		.lean()
		.exec(function (err, questionDocs) {
			res.send(JSON.stringify(questionDocs));
		});
};

exports.new = function(req, res) {
	res.send('new');
};

exports.create = function(req, res) {
	res.send('create ' + JSON.stringify(req.params));
};

exports.show = function(req, res) {
	Question.find({ id: req.params.question })
		.lean()
		.exec(function (err, questionDoc) {
			res.send(JSON.stringify(questionDoc));
		});
};

exports.edit = function(req, res) {
	res.send('edit ' + req.params.question);
};

exports.update = function(req, res) {
	res.send('update ' + req.params.question);
};

exports.destroy = function(req, res) {
	res.send('destroy ' + req.params.question);
};
