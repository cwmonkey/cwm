(function(window, $, undefined) {

var $window = $(window);

$.message = function(args) {
	var defaults = {
		message: '&nbsp;',
		node: window,
		container: 'body',
		prefix: 'message_',
		activeTime: 3000,
		removeAfter: 1000,
		addClass: ''
	};

	if ( typeof args == 'string' || typeof args == 'number' ) {
		args = {message: args};
	}

	var opts = $.extend(defaults, args);

	var msg = opts.message;
console.log(msg);
	var $node = $(opts.node);
	if ( !$node[0] ) return;

	var $container = $(opts.container);
	if ( !$container[0] ) return;

	var prefix = opts.prefix;

	var messages = $node.data('messages') || [];
	var hide = function($message) {
		var $m;
		for ( var i = 0; i < messages.length; i++ ) {
			var m = messages[i];
			if ( m == $message[0] ) {
				messages.splice(i, 1);
				break;
			}
		}
		$message.removeClass(prefix + 'active').addClass(prefix + 'inactive');
		if ( opts.removeAfter ) {
			setTimeout(function() { /*$message.remove(); delete $message;*/ }, opts.removeAfter);
		}
	};

	var $p = $('<div/>').addClass(prefix + 'message').addClass(opts.addClass).append('<p>' + msg + '</p>');
	$container.append($p);

	var show_delay = opts.activeTime * messages.length;
	messages.push($p[0]);
	$node.data('messages', messages);

	setTimeout(function() {
		var node_is_window = $node[0] === window;
		var message_height = $p.height();
		var message_width = $p.width();
		var top;
		var left;

		if ( node_is_window ) {
			top = $window.height() / 2 - message_height / 2;
			left = $window.width() / 2 - message_width / 2;
		} else {
			var offset = $node.offset();
			top = offset.top + $node.height() / 2 - message_height / 2 - $window.scrollTop();
			left = offset.left + $node.width() / 2 - message_width / 2 - $window.scrollLeft();
		}

		$p
			.css({
				top: top,
				left: left
			})
			.addClass(prefix + 'active')
			;

		setTimeout(function() {
			hide($p);
		}, opts.activeTime);
	}, show_delay);
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

})(window, jQuery);