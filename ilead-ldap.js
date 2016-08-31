// Modules

var Q = require("q");
var ldap = require("ldapjs");
var assert = require("assert");
var mongoose = require("mongoose");
var events = require("events");
var models = require("./models.js");
var Schema = mongoose.Schema;

Q.longStackSupport = true;

// Functions

/**
 * the process will exit when SIGTERM is handled
 */
process.on("SIGTERM", function () {
		console.log("terminating... hasta la vista, baby!");
		process.exit(1);
	});

/**
 * connect to the customer and sys mongodb databases
 */
function connectToDb() {
	var deferred1 = Q.defer(),
		deferred2 = Q.defer();
	
	var opts = { db: { native_parser: true }};
	var sysDb  = mongoose.createConnection("mongodb://localhost/sys",  opts); // system database
	var custDb = mongoose.createConnection("mongodb://localhost/test", opts); // customer database
	
	sysDb.on("error", function () {
			deferred1.reject(new Error("connection error: sys"));
		});
		
	sysDb.once("open", function () {
			console.log("database connected: sys");
			models.setSysConnection(sysDb);
			deferred1.resolve(sysDb);
		});
	
	custDb.on("error", function () {
			deferred2.reject(new Error("connection error: test"));
		});
		
	custDb.once("open", function () {
			console.log("database connected: test");
			models.setCustomerConnection(custDb);
			deferred2.resolve(custDb);
		});
	
	return Q.all([deferred1.promise, deferred2.promise]);
}

/**
 * disconnect all mongodb connections
 */
function disconnectDb() {
	var deferred = Q.defer();
	mongoose.disconnect(function (err) {
			if (err) {
				deferred.reject(new Error("database disconnect error"));
			} else {
				console.log("database disconnected");
				deferred.resolve();
			}
		});
	return deferred.promise;
};

/**
 * bind to customer's ldap directory
 */
function bindToLDAP() {
	var deferred = Q.defer();
	
	var client = ldap.createClient({
		url: "ldap://your.company.com:1389/dc=company,dc=com"
	});
				
	client.bind("orclApplicationCommonName=user,cn=Applications,dc=company,dc=com",
		"password",
		function (err) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				console.log("ldap bind complete");
				deferred.resolve(client);
			}
		});
		
	return deferred.promise;
}

/**
 * unbind from customer's ldap directory
 */
function unbindLDAP(client) {
	var deferred = Q.defer();
	
	client.unbind(function (err) {
			if (err) {
				deferred.reject(new Error("ldap unbind error"));
			} else {
				console.log("ldap unbind complete");
				deferred.resolve();
			}
		});
	
	return deferred.promise;
}

/**
 * @entryCallback "optional function called for each entry found, may return a value or a promise"
 */
function performSearch(searchBase, filter, attributes, scope, Model, entryCallback, client) {
	var searchOpts = {
		filter: filter,
		attributes: attributes,
		scope: scope
	};
	var deferred = Q.defer();
	
	var entriesCount = 0;	// count of entries retrieved from ldap search
	var savedCount = 0;		// count of successful saves to the database
	var handledCount = 0;	// count of attempted saves, check for finished condition
	var ended = false;		// flag set when end event has been handled
	var endStatus = 0;		// status returned by the end event
	
	client.search(searchBase, searchOpts,
		function (err, res) {
			if (err) {
				deferred.reject(new Error(err));
			}
			
			process.stdout.write("\nSTART SEARCH");
			
			// this is a custom event I added, emitted after end and
			// all searched records have been saved to the database
			res.on("finished", function () {
					console.log("\nstatus: %d\nsaved: %d\nunsaved: %d", endStatus, savedCount, handledCount-savedCount);
					deferred.resolve(endStatus);
				});
				
			res.on("error", function (err) {
					deferred.reject(new Error(err));
				});
				
			res.on("searchEntry", function (entry) {
					process.stdout.write("*");
					entriesCount += 1;
					
					Q.when(((typeof entryCallback === "function")
								? entryCallback(Model, entry.object)
								: true))
					.then(function () {
							savedCount += 1;
						})
					.catch(function (err) {
							console.error("\nerror: " + err.message);
						})
					.finally(function () {
							process.stdout.write("+");
							handledCount += 1;
							if (ended && handledCount === entriesCount) {
								res.emit("finished");
							}
						})
					.done();
				});
				
			res.on("searchReference", function (referral) {
					console.log("referral: " + referral.uris.join());
				});
				
			res.on("end", function (result) {
					ended = true;
					endStatus = result.status;
					process.stdout.write("END SEARCH");
				});
		});
			
	return deferred.promise;
}

/**
 * use the provided data mapping structure to upsert an ldap entry into
 * the customer database
 */
function saveEntry(dataMapping, entry) {
	var deferred = Q.defer();
	
	assert.strictEqual(typeof dataMapping.model, "string", "dataMapping.model is undefined, expect string");
	assert.strictEqual(typeof dataMapping.getMatchParams, "function", "dataMapping.getMatchParams is undefined, expect function");
	assert.strictEqual(typeof dataMapping.getData, "function", "dataMapping.getData is undefined, expect function");
	
	var Model = models[dataMapping.model];
	
	var match = dataMapping.getMatchParams(entry);
	var data = dataMapping.getData(entry);
	
	Model.update(match, data, { upsert: true },
		function (err, numberAffected, raw) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				//console.log("%s entries affected was %d", dataMapping.model, numberAffected);
				//console.log("The raw response from Mongo was ", raw);
				deferred.resolve(numberAffected);
			}
		});
		
	return deferred.promise;
}


/**
 * do a search to import departments
 */
function doDepartmentImport(ldapClient) {
	var dataMapping = {
		model: "Department",
		getMatchParams: function (entry) {
				return {
					"orgUnitLDAP.dn": entry.dn
				};
			},
		getData: function (data) {
				return {
					name:	data.ou || "",
					orgUnitLDAP: {
						dn:	data.dn,
						o:	data.o  || "",
						ou:	data.ou || ""
					}
				};
			}
	};
	
	return performSearch(
		"o=company,cn=Orgs,dc=company,dc=com",// searchbase
		"(objectClass=*)",				// filter
		[ "dn", "o", "ou" ],			// attributes
		"sub",							// scope
		dataMapping,					// data mapping
		saveEntry,						// callback
		ldapClient);					// ldap client
		
	// track department changes as events
}


/**
 * do a search to import people
 */
function doPersonImport(ldapClient, searchBase, filter, scope) {
	var personDataMapping = {
		model: "Person",
		getMatchParams: function (entry) {
				return {
					"personLDAP.dn": entry.dn
				};
			},
		getData: function (data) {
				var displayName = data.sn + ", " + data.givenname;
				return {
					firstName:		data.givenname		|| "",
					lastName:		data.sn				|| "",
					middleName:		data.middlename 	|| "",
					displayName:	displayName			|| "",
					uid:			data.uid			|| "",
					emplid:			data.erauid			|| "",
					title:			data.title			|| "",
					location:		data.l				|| "",
					gender:			data.orclgender		|| "",
					employeetype:	data.employeetype	|| "",
					email:			data.mail			|| "",
					phone:			data.telephonenumber || "",
					inactive:		false,
					personLDAP: {
						dn:				data.dn,
						cn:				data.cn,
						o:				data.o			|| "",
						ou:				data.ou			|| "",
						l:				data.l			|| "",
						emplid:			data.erauid		|| "",
						uid:			data.uid		|| "",
						title:			data.title		|| "",
						givenname:		data.givenname	|| "",
						middlename:		data.middlename	|| "",
						sn:				data.sn			|| "",
						gender:			data.orclgender	|| "",
						manager:		data.manager	|| "",
						employeetype:	data.employeetype || "",
						mail:			data.mail		|| "",
						phone:			data.telephonenumber || "",
						affiliation:	data.edupersonaffiliation || [],
						primaryaffiliation:	data.edupersonprimaryaffiliation || "",
						chgTimestamp:	Date.now()
					}
				};
			}
		
		// track personnel changes as change events
	};
	
	var userAttribs = [ "dn","cn","erauid","o","ou","l","mail","givenname","middlename","sn","manager","edupersonprimaryaffiliation",
						"edupersonaffiliation","employeetype","orclgender","uid","title","telephonenumber" ];
	
	return performSearch(searchBase, filter, userAttribs, scope, personDataMapping, saveEntry, ldapClient);
}


/**
 * do all search / imports
 */
function doSearches(ldapClient) {
	var promises = [];
	
	promises.push(
		function () {
			return doDepartmentImport(ldapClient);
		});
	
	promises.push(
		function () {
			return doPersonImport(
				ldapClient,
				"cn=Users,dc=company,dc=com",
				"(&(edupersonaffiliation=staff)(orclisenabled=ENABLED))",
				"one");
		});
					
	promises.push(
		function () {
			return doPersonImport(
				ldapClient,
				"cn=Users,dc=company,dc=com",
				"(&(edupersonaffiliation=faculty)(orclisenabled=ENABLED))",
				"one");
		});
	
	return promises.reduce(Q.when, Q()); // run the searches in series
	//return Q.allSettled(promises); // run the searches in parallel
}


/**
 * Sets people inactive if they were not found in this import. Also
 * removes the inactives from subordinate, manager, and ancestor
 * properties of other people. Moves manager and subordinates into the
 * previous"" properties for new inactives, and sets the manager and
 * subordinates fields null.
 */
function setInactive(startTime) {
	var findInactives = function () {
		var deferred = Q.defer();
		
		models.Person.find({
				$and:  [{ "personLDAP.chgTimestamp": { $lt: startTime } },
						{ inactive: false }]
			})
		.populate("manager subordinates")
		.exec(deferred.makeNodeResolver());
		
		return deferred.promise;
	};
	
	return findInactives()
		.then(function (inactivePeople) {
			var promises = [];
			
			inactivePeople.forEach(function (pers) {
				if (pers.manager) {
					// remove the inactive person from the manager's subordinates
					pers.manager.subordinates.pull(pers.id);
					promises.push(Q.ninvoke(pers.manager, "save"));
				}
			});
			
			return Q.allSettled(promises)
				.then(function (pers) {
					var promises = [];
					
					inactivePeople.forEach(function (pers) {
						// clear inactive persons org structure properties
						pers.inactive = true;
						pers.inactiveDate = startTime;
						if (pers.manager) {
							pers.previousManagers.push({ person: pers.manager.id, endDate: startTime });
						}
						if (Array.isArray(pers.subordinates)) {
							pers.subordinates.forEach(function (subordinate) {
								pers.previousSubordinates.push({ person: subordinate.id, endDate: startTime });
							});
						}
						pers.manager = null;
						pers.subordinates = null;
						pers.ancestors = null;
						console.log("setting %s - %s inactive", pers.emplid, pers.displayName);
						promises.push(Q.ninvoke(pers, "save"));
					});
					
					return Q.allSettled(promises);
				})
				.then(function () {
					console.log("set %d person(s) inactive", inactivePeople.length);
				});
		});
}

/**
 * Set the manager and subordinate properties for all active people.
 * Also adds to previousManagers and previousSubordinates when a manager
 * change occurs.
 */
function buildOrgTree() {
	var deferred = Q.defer();
	
	console.log("building org tree, managers and subordinates");
	
	var stream = models.Person.find({ inactive: false })
		.populate("manager").stream();
	
	stream.on("data", function (pers) {
		var managerDn = pers.personLDAP.manager;
		
		if (managerDn) {
			stream.pause();
			
			models.Person.findOne({ "personLDAP.dn": managerDn },
				function (err, newManager) {
					var tstamp = Date.now();
					
					// there is no manager set and a manager was found
					if (newManager && !pers.manager) {
						console.log("manager set for %s - %s, manager=%s",
							pers.emplid, pers.displayName, newManager.displayName);
						
						Q.ninvoke(pers, "update", { manager: newManager })
						.then(function () {
								newManager.subordinates.addToSet(pers);
								return Q.ninvoke(newManager, "save");
							})
						.catch(function (err) {
								console.log(err);
							})
						.finally(function () {
								stream.resume();
							})
						.done();
					
					// there is a new manager and a previous manager was set
					} else if (newManager && newManager.id !== pers.manager.id) {
						console.log("manager changed for %s - %s, from=%s, to=%s",
							pers.emplid, pers.displayName, pers.manager.displayName, newManager.displayName);
						
						pers.manager.subordinates.pull(pers);
						pers.manager.previousSubordinates.push({ person: pers, endDate: tstamp });
						newManager.subordinates.addToSet(pers);
						
						Q.ninvoke(pers.manager, "save")
						.then(function () {
								return Q.ninvoke(pers.manager, "populate");
							})
						.then(function () {
								pers.previousManagers.push({ person: pers.manager, endDate: tstamp });
								pers.manager = newManager;
								return Q.ninvoke(pers, "save");
							})
						.then(function () {
								return Q.ninvoke(newManager, "save");
							})
						.catch(function (err) {
								console.log(err);
							})
						.finally(function () {
								stream.resume();
							})
						.done();
						
					} else {
						stream.resume();
						//console.log("could not find manager for %s - %s, %s, dn=%s",
						//	pers.emplid, pers.lastName, pers.firstName, managerDn);
					}
				});
		}
		
	}).on("error", function (err) {
		stream.destroy();
		deferred.reject(new Error(err));
		
	}).on("close", function () {
		deferred.resolve();
	});
	
	return deferred.promise;
}

/**
 * Starts at the top level manager(s) and progresses down the hierarchy,
 * setting the ancestor array of each active person along the way.
 */
function buildAncestors() {
	var deferred = Q.defer();
	var savedCount = 0;
	
	console.log("building ancestor lists");
	
	var stream = models.Person.find({
				$and:  [{ "personLDAP.manager": "" },			// find top level (root)
						{ "subordinates.0": { $exists: true } },// find all with at least a first subordinate array element (not empty)
						{ inactive: false }]
			})
		.stream();
	
	stream.on("data", function (pers) {
		stream.pause();
		
		function setAncestors(thisPersId, thisManager) {
			var rootToLeafDeferred = Q.defer();
			
			Q.ninvoke(models.Person, "findById", thisPersId)
			.then(function (thisPers) {
				// set ancestors to a copy of manager's ancestors plus the manager
				var ancestors = [];
				if (thisManager && thisManager.ancestors) {
					ancestors = thisManager.ancestors.slice(0);
					ancestors.push(thisManager.id);
				}
				thisPers.ancestors = ancestors;
				
				return Q.ninvoke(thisPers, "save")
				.then(function () {
					var childPromises = [];
					process.stdout.write("*");
					savedCount += 1;
					
					if (Array.isArray(thisPers.subordinates)) {
						thisPers.subordinates.forEach(function (childPersId) {
							childPromises.push(setAncestors(childPersId, thisPers));
						});
					}
					
					return Q.allSettled(childPromises);
				});
			})
			.finally(rootToLeafDeferred.resolve)
			.done();
						
			return rootToLeafDeferred.promise;
		}
		
		// kick off the promise chain at the root level
		setAncestors(pers.id, null)
		.catch(function (err) {
				console.log(err);
			})
		.finally(function () {
				stream.resume();
			})
		.done();
		
	}).on("error", function (err) {
		stream.destroy();
		deferred.reject(new Error(err));
		
	}).on("close", function () {
		console.log("\nsaved: %d", savedCount);
		deferred.resolve();
	});
	
	return deferred.promise;
}


/**
 * Define and start the high level chain of tasks
 */
connectToDb()
.then(bindToLDAP)
.then(function (ldapClient) {
		var startTime = Date.now();
		return doSearches(ldapClient)
			.then(function () {
					return setInactive(startTime);
				})
			.catch(function (err) {
					console.error("error: " + err.message);
					console.error(err.stack);
				})
			.finally(function () {
					return unbindLDAP(ldapClient);
				});
	})
.then(buildOrgTree)
.then(buildAncestors)
.then(disconnectDb)
.catch(function (err) {
		console.error("error: " + err.message);
		console.error(err.stack);
	})
.finally(function () {
		process.kill(process.pid, "SIGTERM");
	})
.done();
