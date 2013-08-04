(function($) {

// Define regexes for variable replacement
var search_class = /{c=([a-zA-Z][a-zA-Z0-9\-_]*)}/g;
var search_class_alt = /{!c=([a-zA-Z][a-zA-Z0-9\-_]*)}( ([^{]*) )?{\/c}/g;
var search_attr = /{([a-zA-Z][a-zA-Z0-9\-_]*)="[^"]*{([a-zA-Z][a-zA-Z0-9\-_]*)}[^"]*"}/;
var search_bind = /{#([a-zA-Z][a-zA-Z0-9\-_]*)}/;
var search = /{([a-zA-Z][a-zA-Z0-9\-_]*)}/;

// Regex for code parsing
var split_reg = /({%=)|({%)|(%})/;

// Template class
var Tpl = function(html, values) {
	html = this.parseJs(html, values);
	html = this.parseVars(html, values);

	this.$node = $('<div class="tpl">' + html + '</div>');
};

// Parse the {} style vars
Tpl.prototype.parseVars = function(html, values) {
	var match;
	var me = this;

	while ( (match = search_bind.exec(html)) ) {
		var $node = $('<span/>')
			.addClass('Template_' + match[1]);
		if ( typeof values[match[1]] != 'undefined' ) $node.html(values[match[1]]);

		html = html.replace(match[0], $('<div/>').append($node.eq(0).clone()).html());
	}

	while ( (match = search_attr.exec(html)) ) {
		var replace = match[1] + '="';

		if ( typeof values[match[2]] != 'undefined' ) replace += values[match[2]];
		replace += '" data-tpl-' + match[2] + '="' + match[1] + '" ';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class.exec(html)) ) {
		var replace = '{!c=' + match[1] + '} ';

		if ( typeof values[match[1]] != 'undefined' ) replace += values[match[1]];
		replace += ' {/c}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search_class_alt.exec(html)) ) {
		var replace = '{!c=' + match[1] + '} ';

		if ( typeof values[match[1]] != 'undefined' ) replace += values[match[1]];
		replace += ' {/c}';

		html = html.replace(match[0], replace);
	}

	while ( (match = search.exec(html)) ) {
		var value = '';
		if ( typeof values[match[1]] != 'undefined' ) value = values[match[1]];

		html = html.replace(match[0], value);
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
	var $els = this.$node.find('.\\{\\!c\\=' + name + '\\}, .\\{\\!c\\=' + name + '\\}\\{\\/c\\}');

	$els.each(function() {
		var className = this.className;
		while ( (match = search_class_alt.exec(className)) ) {
			if ( match[1] != name ) continue;
			var replace = '{!c=' + match[1] + '} ';

			if ( typeof val != 'undefined' ) replace += val;
			replace += ' {/c}';

			var newClassName = className.replace(match[0], replace);
			if ( newClassName != className ) this.className = newClassName;
		}
	});
};

// Parse javascript in template
Tpl.prototype.parseJs = function(html, values) {
	var parts = html.split(split_reg);
	var code = '';

	for ( var i = 0; i < parts.length; i++ ) {
		if ( typeof parts[i] == 'undefined' ) {         
			parts.splice(i, 1);
			i--;
		}
	}

	for ( var i=0, part; i < parts.length; i++ ) {
		part = parts[i];
		if ( part == '{%' ) {
			i++;
			code += parts[i];
		} else if ( part == '{%=' ) {
			i++;
			code += '\ntt += ' + parts[i] + ';\n';
		} else if ( part == '%}' ) {
			
		} else {
			code += '\ntt += parts[' + i + '];\n';
		}
	}

	var do_tpl;

	code = 'do_tpl = function() {\nvar tt="";\n' + code + '\nreturn tt;\n};';

	eval(code);

	html = do_tpl.call(values);

	return html;
};

// Store html for reuse
var tpls = {};

$.tpl = {
	load: function(params) {
		// Load multiple templates
		if ( toString.call(params) === '[object Array]' ) {
			for ( var i in params ) {
				$.tpl.load(params[i]);
			}
			return;
		}

		tpls[params.name] = params.html;
	},
	make: function(name, obj) {
		return new Tpl(tpls[name], obj);
	}
};

})(jQuery);