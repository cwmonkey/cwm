(function($) {

// Define regexes for variable replacement
var search_class = /{:([a-zA-Z][a-zA-Z0-9\-_]*)}/g;
var search_class_alt = /{!:([a-zA-Z][a-zA-Z0-9\-_]*)}( ([^{]*) )?{\/:}/g;
var search_attr = /{([a-zA-Z][a-zA-Z0-9\-_]*)="[^"]*{([a-zA-Z][a-zA-Z0-9\-_]*)}[^"]*"}/;
var search_bind = /{([a-zA-Z][a-zA-Z0-9\-_]*)}/;
var search_unbound = /{=([a-zA-Z][a-zA-Z0-9\-_]*)}/;

// Regex for code parsing
var split_reg = /({%=)|({%)|(%})/;

// Template class
var Tpl = function(html, values) {
	this.html = html;
	this.$node = null;

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

	while ( (match = search_attr.exec(html)) ) {
		var replace = match[1] + '="';

		if ( values && typeof values[match[2]] != 'undefined' ) replace += values[match[2]];
		replace += '" data-tpl-' + match[2] + '="' + match[1] + '" ';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class.exec(html)) ) {
		var replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) replace += values[match[1]];
		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class_alt.exec(html)) ) {
		var replace = '{!:' + match[1] + '} ';

		if ( values && typeof values[match[1]] != 'undefined' ) replace += values[match[1]];
		replace += ' {/:}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_unbound.exec(html)) ) {
		var value = '';
		if ( values && typeof values[match[1]] != 'undefined' ) value = values[match[1]];

		html = html.replace(match[0], value);
	}

	while ( (match = search_bind.exec(html)) ) {
		var $node = $('<span/>')
			.addClass('Template_' + match[1]);
		if ( values && typeof values[match[1]] != 'undefined' ) $node.html(values[match[1]]);

		html = html.replace(match[0], $('<div/>').append($node.eq(0).clone()).html());
	}

	return html;
}

// Update value in rendered template
Tpl.prototype.set = function(name, val) {
	if ( typeof name == 'object' ) {
		for ( var i in name ) {
			if ( name.hasOwnProperty(i) ) {
				this.set(i, name[i]);
			}
		}
		return;
	}

	// Bind vars
	var $el = this.$node.find('.Template_' + name);
	$el.html(val);

	// Attr vars
	$el = this.$node.find('[data-tpl-' + name + ']');
	if ( $el.length ) {
		$el.attr($el.data('tpl-' + name), val);
	}

	// Class vars
	var $els = this.$node.find('.\\{\\!\\:' + name + '\\}, .\\{\\!\\:' + name + '\\}\\{\\/\\:\\}');

	$els.each(function() {
		var className = this.className;
		while ( (match = search_class_alt.exec(className)) ) {
			if ( match[1] != name ) continue;
			var replace = '{!:' + match[1] + '} ';

			if ( typeof val != 'undefined' ) replace += val;
			replace += ' {/:}';

			var newClassName = className.replace(match[0], replace);
			if ( newClassName != className ) this.className = newClassName;
		}
	});
};

// Store html for reuse
var tpls = {};

$.tpl = {
	compile: function(html) {
		var tpl = new Tpl(html)
		return tpl.make;
	}
};

})(jQuery);