/*

Example:

// Create tpl object
	var tpl = $.tpl.compile(html);

// Set/bind values
	var test_tpl = tpl(values)

// Access the bound template's jQuery node:
	test_tpl.$node;

// Updating bound variables:
	test_tpl.set('name', 'value');

	test_tpl.set({
		name1: 'value1',
		name2: 'value2',
		name3: 'value3'
	});


// For the following, assume values = {varName: 'varValue'};

// Simple one-time search/replace
	{=varName}

	becomes

	varValue

// Binding values
	// Binding a value in plain text
		Some text {varName}

		becomes

		Some text <span class="Template-varName">varValue</span>

	// Binding a class:
		<span class="{:varName}">

		becomes

		<span class="{!:varName} varValue varName-varValue {/:}">

	// Binding attributes:
		<span {title="{varName}"}>

		becomes

		<span title="varValue" data-tpl-varName="title">

*/

;(function($, undefined) {
'use strict';

// Define regexes for variable replacement
// shorthand class: {:className}
var search_class = /{:([a-zA-Z][a-zA-Z0-9\-_]*)}/g;
// longhand class: {!:varName} varValue varName-varValue {/:}
var search_class_alt = /{!:([a-zA-Z][a-zA-Z0-9\-_]*)}( ([^{]*) )?{\/:}/g;
// attributes: {attr="{varName}"}
var search_attr = /{([a-zA-Z][a-zA-Z0-9\-_]*)="[^"]*{([a-zA-Z][a-zA-Z0-9\-_]*)}[^"]*"}/;
// bound text: {varName}
var search_bind = /{([a-zA-Z][a-zA-Z0-9\-_]*)}/;
// unbound text (one time replace): {=varName}
var search_unbound = /{=([a-zA-Z][a-zA-Z0-9\-_]*)}/;

// Template class
var Tpl = function(html) {
	this.html = html;
	this.$node = null;
	this.values = {};

	this.make = (function(me) {
		return function(values) {
			var html = me.parseVars(me.html, values);
			me.$node = $(html);
			me.$node.data({tpl: me});
			me.$node.data({tpl_values: values});
			return me;
		};
	})(this);
};

// Parse the {} style vars
Tpl.prototype.parseVars = function(html, values) {
	var match;
	var me = this;
	this.values = values;

	while ( (match = search_attr.exec(html)) ) {
		var replace = match[1] + '="';

		if ( values && typeof values[match[2]] != 'undefined' ) {
			replace += values[match[2]];
		}
		replace += '" data-tpl-' + match[2] + '="' + match[1] + '" ';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class.exec(html)) ) {
		var replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			replace += values[match[1]] + ' ' + match[1] + '-' + values[match[1]];
		}
		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class_alt.exec(html)) ) {
		var replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			replace += values[match[1]] + ' ' + match[1] + '-' + values[match[1]];
		}
		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_unbound.exec(html)) ) {
		var value = '';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			value = values[match[1]];
		}

		html = html.replace(match[0], value);
	}

	while ( (match = search_bind.exec(html)) ) {
		var $node = $('<span/>')
			.addClass('Template-' + match[1])
			;

		if ( values && typeof values[match[1]] != 'undefined' ) {
			$node.html(values[match[1]]);
		}

		html = html.replace(match[0], $('<div/>').append($node.eq(0).clone()).html());
	}

	return html;
}

// Update value in rendered template
Tpl.prototype.set = function(name, val) {
	var match;

	if ( typeof name == 'object' ) {
		for ( var i in name ) {
			if ( name.hasOwnProperty(i) ) {
				this.set(i, name[i]);
			}
		}
		return;
	}

	this.values[name] = val;

	// Bind vars
	var $el = this.$node.find('.Template-' + name);
	$el.html(val);

	// Attr vars
	$el = this.$node.find('[data-tpl-' + name + ']');
	if ( $el.length ) {
		$el.attr($el.data('tpl-' + name), val);
	}

	// Class vars
	var selectors = '.\\{\\!\\:' + name + '\\}, .\\{\\!\\:' + name + '\\}\\{\\/\\:\\}';
	var $els = this.$node.find(selectors);

	if ( this.$node.is(selectors) ) {
		$els = $els.add(this.$node);
	}

	$els.each(function() {
		var className = this.className;
		while ( (match = search_class_alt.exec(className)) ) {
			if ( match[1] != name ) {
				continue;
			}
			var replace = '{!:' + match[1] + '} ';

			if ( typeof val != 'undefined' ) {
				replace += val + ' ' + match[1] + '-' + val;
			}
			replace += ' {/:}';

			var newClassName = className.replace(match[0], replace);
			if ( newClassName != className ) {
				this.className = newClassName;
			}
		}
	});
};

Tpl.prototype.get = function(name) {
	return this.values[name];
}

// Store html for reuse
var tpls = {};

$.tpl = {
	compile: function(html) {
		var tpl = new Tpl(html)
		return tpl.make;
	}
};

})(window.jQuery);