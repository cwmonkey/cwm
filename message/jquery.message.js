(function($) {

var defaults = {
	message: '&nbsp;',
	node: 'body',
	prefix: 'message_'
};

$.message = function(args) {
	if ( typeof args == 'string' ) {
		args = {message: args};
	}

	var opts = $.extend(defaults, args);

	var msg = opts.message;
console.log(msg);
	var $node = opts.node;
	if ( !$node.jQuery ) $node = $($node);
	if ( !$node[0] ) return;

	var prefix = opts.prefix;

	var adjust_margins = function($nodes) {
		var margin = 0;
		$node.find('.' + prefix + 'message.' + prefix + 'active').each(function() {
			var $this = $(this);
			$this.css('margin-top', margin);
			margin += $this.outerHeight();
		});
	};

	var hide = function($message) {
		$message.removeClass(prefix + 'active').addClass(prefix + 'inactive');
		setTimeout(function() { /*$message.remove();*/ }, 1000);
		adjust_margins();
	};

	var get_heights = function() {
		var margin = 0;
		$node.find('.' + prefix + 'message.' + prefix + 'active').each(function() {
			var $this = $(this);
			margin += $this.outerHeight();
		});
		return margin;
	};

	var $p = $('<p>' + msg + '</p>').addClass(prefix + 'message');
	$node.append($p);

	setTimeout(function() {
		$p
			.height($p.height())
			.width($p.width())
			.css({
				marginTop: get_heights(),
				marginLeft: -1 * $p.outerWidth() / 2
			})
			.addClass(prefix + 'active')
			;
	}, 0);

	setTimeout(function() {
		hide($p);
	}, 3000);
};

$.fn.message = function(args) {
	return this.each(function() {
		var params = {};
		if ( typeof args == 'string' ) {
			params.message = args;
		} else {
			params = args;
		}

		params.node = this;
		$.message(params);
	});
};

})(jQuery);