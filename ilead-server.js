
/**
 * Module dependencies.
 */

var express = require("express");
var resource = require("express-resource");
var doT = require("express-dot");
var routes = require("./routes");
//var user = require("./routes/user");
var http = require("http");
var path = require("path");
var mongoose = require("mongoose");

var app = express();

// connect to mongodb
mongoose.connect("mongodb://localhost/test");
var db = mongoose.connection;

// all environments
app.set("port", process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "dot");
app.set("view options", { layout: false });
app.engine("dot", doT.__express);
//doT.templateSettings = { // how to set these options for doT???
	//strip: false,
	//append: false,
//	varname: "vars"
//};

app.use(express.favicon());
app.use(express.logger("dev"));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.cookieParser("my secret here")); // look into this
app.use(express.session());
/*app.use(express.session({ // and look into this
	secret: "my secret here",
	store: MemStore({
		reapInterval: 60000 * 10
	})
}));*/
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});
app.use(app.router);
/*app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, "Sum Ting Wong!");
});*/

// development only
if (app.get("env") === "development") {
	app.use(express.errorHandler());
}

// set up resources
//var customers = app.resource("customers", require("./resources/customers"));

var organizations = app.resource("organizations", require("./resources/organizations"));
//customers.add(organizations);

var departments = app.resource("departments", require("./resources/departments"));
organizations.add(departments);

var PersonResource = require("./resources/people");
var people = app.resource("people", PersonResource);
people.map("get", "orgchart", PersonResource.orgchart); // route = /people/:id/orgchart

var questions = app.resource("questions", require("./resources/questions"));
//app.resource({ model: require("./models/question") });


http.createServer(app).listen(app.get("port"), function(){
	console.log("Express server listening on port " + app.get("port"));
});
