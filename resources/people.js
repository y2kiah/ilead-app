var Person = require("../models/person");

exports.index = function(req, res) {
	Person.find({ inactive: false })
		.sort("lastName firstName emplid")
		.skip(0)
		.limit(req.query.limit)
		.lean()
		.exec(function (err, personDocs) {
			res.send(JSON.stringify(personDocs));
		});
	/*Person.find()
		.lean()
		.stream({ transform: JSON.stringify })
		.pipe(res);*/
};

exports.new = function(req, res) {
	res.send('new');
};

exports.create = function(req, res) {
	res.send('create ' + JSON.stringify(req.params));
};

exports.show = function(req, res) {
	Person.findOne({ $or: [{ uid: new RegExp("^"+req.params.person+"$","i") },
						   { emplid: req.params.person }] })
		.lean()
		.exec(function (err, personDoc) {
			res.send(JSON.stringify(personDoc));
		});
};

exports.edit = function(req, res) {
	res.send('edit ' + req.params.person);
};

exports.update = function(req, res) {
	res.send('update ' + req.params.person);
};

exports.destroy = function(req, res) {
	res.send('destroy ' + req.params.person);
};

exports.orgchart = function(req, res) {
	var selection = "-personLDAP -previousSubordinates -previousManagers",
		populatedSelection = selection + " -ancestors -manager";
	
	Person.findOne({ $or: [{ uid: new RegExp("^"+req.params.person+"$","i") }, { emplid: req.params.person }] },
			selection)
		.populate({ path: "ancestors", select: populatedSelection })
		.lean()
		.exec(function (err, personDoc) {
			Person.findDescendantsOf(personDoc._id, function (err, descendants) {
				if (err) {
					res.send(err);
				} else {
					var myOrgMembers = [personDoc];
					myOrgMembers = myOrgMembers.concat(personDoc.ancestors, descendants);
					res.send(JSON.stringify(myOrgMembers));
				}
			});
		});
};
