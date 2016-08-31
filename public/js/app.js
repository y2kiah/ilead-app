$(function () {
	// ajax prefilter if restful API is hosted separate from app server
	/*$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
		options.url = "http://my.apiserver.com" + options.url;
	});*/
	
	// create Model/Collection types
	var Employees = Backbone.Collection.extend({
		url: "/employees"
	});
	
	// create view types
	var TopNav = Backbone.View.extend({
		currentPath: "",
		menuItems: [
			{ href:"#",				path:"home",		title: "Home" },
			{ href:"#okrs",			path:"okrs",		title: "OKRs" },
			{ href:"#organization",	path:"organization",title: "Organization" },
			{ href:"#culture",		path:"culture",		title: "Culture" },
			{ href:"#performance",	path:"performance",	title: "Performance" },
			{ href:"#employees",	path:"employees",	title: "Employees" }
		],
		
		initialize: function () {
			this.template = doT.template('{{~it.items :item}}<li class="{{?it.currentPath===item.path}}active{{?}}"><a href="{{=item.href}}">{{=item.title}}</a></li>{{~}}');
			
			// on route event, render this view
			Backbone.history.on("route", function (source, path) {
				this.currentPath = path;
				this.render();
			}, this);
			
			// render self
			this.render();
		},
		render: function () {
			this.$el.html(this.template({ items: this.menuItems, currentPath: this.currentPath }));
		},
		events:{
			"click a": function (source) {
				var href = source.target.getAttribute("href");
				Backbone.history.navigate(href, { trigger: true });
				
				return false; // cancel regular event handling, backbone handles routing
			}
		}
	});
	
	var Page = Backbone.View.extend({
		initialize: function () {
			this.template = doT.template('<div id="pageContent"><div class="page-header"><h1>{{=it.title}}</h1></div></div>');
			
			// render self
			this.render();
		},
		render: function () {
			this.$el.html(this.template({ title: "ILEAD Page" }));
		}
	});
	
	var EmployeeList = Backbone.View.extend({
		el: "#pageContent",
		initialize: function () {
			this.template = doT.template("<span>Here is a sample template {{=it.employees}}</span>");
		},
		render: function () {
			var that = this;
			var employees = new Employees();
			employees.fetch({
				success: function () {
					var html = template({ employees: employees.models });
					that.$el.html(html);
				}
			});
		}
	});
	
	// create router types
	var Router = Backbone.Router.extend({
		routes: {
			""				: "home",
			"okrs"			: "okrs",
			"organization"	: "organization",
			"culture"		: "culture",
			"performance"	: "performance",
			"employees"		: "employees"
		}
	});
	
	// create view instances
	var topNav = new TopNav({ el: "#topNav" });
	var page = new Page({ el: "#page" });
	
	// create router instance
	var router = new Router();
	
	// route event handlers
	router.on("route:home", function () {
		page.render();
	});
	
	router.on("route:employees", function () {
		page.render();
	});
	
	Backbone.history.start();
});
