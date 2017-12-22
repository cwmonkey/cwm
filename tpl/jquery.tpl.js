/*

Example:

// Create tpl object
	var tpl = $.tpl.compile(html);

// Set/bind values
	var test_tpl = tpl(values);

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
var search_class = /{:([a-zA-Z_][a-zA-Z0-9\-_]*)}/g;
// longhand class: {!:varName} varValue varName-varValue {/:}
var search_class_alt = /{!:([a-zA-Z_][a-zA-Z0-9\-_]*)}( ([^{]*) )?{\/:}/g;
// attributes: {attr="{varName}"}
var search_attr = /{(([a-zA-Z_][a-zA-Z0-9\-_]*)="([^"]*{([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z][a-zA-Z0-9\-_]+))?}[^"]*)")}/;
var search_attr_var = /{([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;
// bound text: {varName}
var search_bind = /{([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;
// unbound text (one time replace): {=varName}
var search_unbound = /{=([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;
// attributes: attr="Blah {@varName} blah {@varName2} blah"
var search_attr2 = /@([a-zA-Z_][a-zA-Z0-9\-_]*)="([^"]*)"/;
var search_attr2_bind = /{([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;
//var search_attr_var2 = /{([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;
var search_tag_bind = /{@([a-zA-Z_][a-zA-Z0-9\-_]*)(\s*\|\s*([a-zA-Z_][a-zA-Z0-9\-_]+))?}/;

// Template class
var Tpl = function(html) {
	this.html = html;
	this.$node = null;
	this.values = {};
};

Tpl.prototype.UpdateNodeHtml = function($node) {
	var html = $node.html();
	var text = $node.data('Template-template');
	var match2;
	var values = this.values;

	// TODO: DRY
	while ( (match2 = search_tag_bind.exec(text)) ) {
		var value = '';

		if ( values && typeof values[match2[1]] != 'undefined' ) {
			value = values[match2[1]];
		}

		if ( typeof value === 'function' ) {
			value = value();
		}

		if ( match2[2] && this.filters[match2[3]] ) {
			value = this.filters[match2[3]](value);
		}

		text = text.replace(match2[0], value);
	}

	if ( html !== text ) {
		$node.html(text);
	}
};

// Make the dom node
Tpl.prototype.make = function(vals) {
	var values = $.extend({}, vals);
	var html = this.parseVars(this.html, values);
	var me = this;

	this.$node = $(html);

	this.$node.find('[data-Template]').each(function() {
		var $this = $(this);
		var html = $this.html();
		$this.data('Template-template', html);
		me.UpdateNodeHtml($this);
	});

	this.$node.data({tpl: this});
	this.$node.data({tpl_values: values});
	this.$node.addClass('tpl-node');

	return this;
};

// Parse the {} style vars
Tpl.prototype.parseVars = function(html, values) {
	var match;
	var match2;
	var me = this;
	var value;
	var replace;
	var replace2;
	var text;
	this.values = values;

	// Attributes 2
	// TODO: Make this work for multiple attributes having the same variable bound
	while ( (match = search_attr2.exec(html)) ) {
		replace = match[1] + '="';

		text = match[2];

		// TODO: DRY
		while ( (match2 = search_attr2_bind.exec(text)) ) {
			value = '';

			if ( values && typeof values[match2[1]] != 'undefined' ) {
				value = values[match2[1]];
			}

			if ( typeof value === 'function' ) {
				value = value();
			}

			if ( match2[2] && this.filters[match2[3]] ) {
				value = this.filters[match2[3]](value);
			}

			text = text.replace(match2[0], value);

			replace = 'data-tpl-attr-' + match2[1] + '="' + match[1] + '" ' + replace;
		}

		replace += text + '"';
		replace += ' data-tpl-' + match[1] + '-template="' + encodeURIComponent(match[2]) + '" ';
		html = html.replace(match[0], replace);
	}

	// Attributes
	while ( (match = search_attr.exec(html)) ) {
		replace = match[2] + '="';
		value = '';

		if ( values && typeof values[match[4]] != 'undefined' ) {
			value = values[match[4]];
		}

		if ( typeof value === 'function' ) {
			value = value();
		}

		if ( match[5] && this.filters[match[6]] ) {
			value = this.filters[match[6]](value);
		}

		replace += match[3].replace(search_attr_var, value);
		replace += '" data-tpl-' + match[4] + '="' + match[2];
		replace += '" data-tpl-' + match[4] + '-tpl="' + encodeURIComponent(match[3]) + '" ';

		html = html.replace(match[0], replace);
	}

	// Class
	while ( (match = search_class.exec(html)) ) {
		replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			value = values[match[1]];

			if ( typeof value === 'function' ) {
				value = value();
			}

			replace += values[match[1]] + ' ' + match[1] + '-' + value;
		}

		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	// Other class search
	while ( (match = search_class_alt.exec(html)) ) {
		replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			value = values[match[1]];

			if ( typeof value === 'function' ) {
				value = value();
			}

			replace += values[match[1]] + ' ' + match[1] + '-' + value;
		}
		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	// Single replace
	while ( (match = search_unbound.exec(html)) ) {
		value = '';

		if ( values && typeof values[match[1]] != 'undefined' ) {
			value = values[match[1]];
		}

		if ( typeof value === 'function' ) {
			value = value();
		}

		if ( match[2] && this.filters[match[3]] ) {
			value = this.filters[match[3]](value);
		}

		html = html.replace(match[0], value);
	}

	// Replace and bind
	while ( (match = search_bind.exec(html)) ) {
		var $node = $('<span/>')
			.addClass('Template-bind-value Template-' + match[1])
			;

		if ( values && typeof values[match[1]] != 'undefined' ) {
			value = values[match[1]];

			if ( typeof value === 'function' ) {
				value = value();
			}

			if ( match[2] && this.filters[match[3]] ) {
				value = this.filters[match[3]](value);
				$node
					.attr('data-__tpl_filter', match[3]);
			}

			$node.html(value);
		}

		html = html.replace(match[0], $('<div/>').append($node.eq(0).clone()).html());
	}

	return html;
};

// Update value in rendered template
Tpl.prototype.set = function(name, val) {
	if ( this.values[name] === val ) {
		return;
	}

	var match;
	var me = this;


	if ( typeof name == 'object' ) {
		for ( var i in name ) {
			if ( name.hasOwnProperty(i) ) {
				this.set(i, name[i]);
			}
		}
		return;
	}

	this.values[name] = val;

	var filter;

	// Tags
	this.$node.find('[data-Template]').each(function() {
		me.UpdateNodeHtml($(this));
	});

	// Bind vars
	var $el = this.$node.find('.Template-' + name + ':not(.Template-skip)');
	var filter_val;

	if ( $el.length ) {
		if ( (filter = $el.data('__tpl_filter')) && this.filters[filter] ) {
			if ( filter_val !== $el[0].textContent ) {
				$el[0].textContent = this.filters[filter](val);
			}
		} else {
			if ( val !== $el[0].textContent ) {
				$el[0].textContent = val;
			}
		}
	}

	// Attr vars 2
	$el = this.$node.find('[data-tpl-attr-' + name + ']:not(.Template-skip)');

	if ( $el.length ) {
		var attr = $el.data('tpl-attr-' + name.toLowerCase());
		var tpl = decodeURIComponent($el.data('tpl-' + attr + '-template'));
		var text = tpl;
		filter_val = val;
		match = search_attr_var.exec(tpl);

		while ( (match = search_attr2_bind.exec(text)) ) {
			var value = '';

			if ( this.values && typeof this.values[match[1]] != 'undefined' ) {
				value = this.values[match[1]];
			}

			if ( typeof value === 'function' ) {
				value = value();
			}

			if ( match[2] && this.filters[match[3]] ) {
				value = this.filters[match[3]](value);
			}

			text = text.replace(match[0], value);
		}

		$el.attr(attr, text);
	}

	// Attr vars
	$el = this.$node.find('[data-tpl-' + name + ']:not(.Template-skip)');

	if ( $el.length ) {
		var tpl = decodeURIComponent($el.data('tpl-' + name.toLowerCase() + '-tpl'));
		filter_val = val;
		match = search_attr_var.exec(tpl);

		if ( match[0] && this.filters[match[3]] ) {
			filter_val = this.filters[match[3]](filter_val);
		}

		$el.attr(
			$el.data('tpl-' + name.toLowerCase()),
			decodeURIComponent($el.data('tpl-' + name.toLowerCase() + '-tpl'))
				.replace(search_attr_var, filter_val)
		);
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

	return this;
};

Tpl.prototype.get = function(name) {
	return this.values[name];
};

Tpl.prototype.run = function(name) {
	for ( var i = 1, args = [], arg, len = arguments.length; i < len; i++ ) {
		args.push(arguments[i]);
	}

	return this.values[name].apply(this.values, args);
};

Tpl.prototype.filters = {};

// Store html for reuse
var tpls = {};

$.tpl = {
	compile: function(html) {
		return (function(html) {
			return function(values) {
				return (new Tpl(html)).make(values);
			};
		})(html);
	},
	addFilter: function(name, fn) {
		Tpl.prototype.filters[name] = fn;
	}
};

})(window.jQuery);