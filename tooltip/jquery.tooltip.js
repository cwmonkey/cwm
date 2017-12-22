/*

Add accessible tooltips.

Example: $.tooltip('[title]');

TODO:
  Allow for delegates other than body.
  Add previous selectors to a single delegate bind.
  Param class/id names.
  Find highest zIndex?

*/

;(function($, undefined) {
'use strict';

var $body = $('body');
var $window = $(window);
var $current;
var id_name = 'tooltip';
var class_name = 'tooltip';
var show_class = 'tooltipShown';

var $tooltip = $('<span/>')
  .addClass(class_name)
  .attr('id', id_name)
  .css({
    position: 'absolute',
    zIndex: 100000 // TODO: Figure this out programmatically?
  })
  ;

var $tooltip_inner = $('<span/>')
  .addClass(class_name + '-inner')
  .appendTo($tooltip)
  ;

var observerConfig = {
  attributes: true,
  childList: true,
  characterData: true
};

// Update the tooltip if something attempts to modify the title
var observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if ( mutation.attributeName == 'title' ) {
      show_tooltip.call(mutation.target);
    }
  });
});

var reset_node = function($el) {
  $el
    .attr({
      'aria-describedby': '',
      title: $el.data('title')
    })
    ;
};

var adjust_timeout;
var show_tooltip = function() {
  var orientation_class = '';
  var $this = $(this);

  var title = this.title || $this.data('title');

  if ( !title ) {
    hide_tooltip();
    return;
  }

  if ( $current && $this[0] === $current[0] ) {
    if ( $tooltip_inner.html() !== title ) {
      $tooltip_inner.html(title);
    } else {
      observer.disconnect();
      $this.attr({'title': ''});
      observer.observe(this, observerConfig);

      return;
    }
  } else if ( $current ) {
    reset_node($current);
  }

  $current = $this;

  clearTimeout(hide_timeout);

  $tooltip_inner.html(title);

  var tooltip_top = $this.data('tooltip-placement');

  observer.disconnect();

  $this
    .data('title', title)
    .attr({
      'title': '',
      'aria-describedby': id_name
    })
    ;

  observer.observe(this, observerConfig);

  var offset = $this.offset();
  var this_width = $this.outerWidth();
  var this_height = $this.outerHeight();

  $tooltip
    .appendTo($body)
    .css({width: '', left: '', top: ''})
    .removeClass('top');

  $tooltip_inner.css({left: '', width: ''});

  var tooltip_width = $tooltip.outerWidth();
  var tooltip_height = $tooltip.outerHeight();
  var left_offset = offset.left + this_width / 2 - tooltip_width / 2;
  var top_offset = tooltip_top ? offset.top - tooltip_height : offset.top + this_height;

  var window_height = $window.height();

  // Protect against tooltips falling off the bottom of the screen

  if ( top_offset + tooltip_height > window_height ) {
    top_offset = offset.top - tooltip_height;
    tooltip_top = true;
  }

  if ( tooltip_top ) orientation_class = 'top';

  var window_width = $window.width();

  // Protect against tooltips falling off the right side of the screen
  // TODO: bottom and left
  if ( left_offset + tooltip_width > window_width ) {
    var reduce = left_offset + tooltip_width - window_width;
    $tooltip.css({width: tooltip_width - reduce * 2});
    left_offset = left_offset + reduce;
    $tooltip_inner.css({left: -2 * reduce, position: 'relative', width: tooltip_width});
  }

  $tooltip.css({ left: left_offset, top: top_offset }).addClass(show_class).addClass(orientation_class);
};

var hide_timeout;
var hide_tooltip = function() {
  var $this = $(this);
  clearTimeout(hide_timeout);
  hide_timeout = setTimeout(function() {
    observer.disconnect();

    reset_node($this);

    $tooltip.removeClass(show_class);
    $current = null;
  }, 0);
};

// Plugin
$.tooltip = function(selector) {
  var init = function() {
    $body
      .delegate(selector, 'mouseenter focus', show_tooltip)
      .delegate(selector, 'mouseleave blur', hide_tooltip)
      .delegate(selector, 'touchstart', function(e) {
        if ( $tooltip.hasClass(show_class) ) {
          hide_tooltip.apply(this, arguments);
          return false;
        } else {
          show_tooltip.apply(this, arguments);
        }
      })
      ;
  };

  // In case this was called before the end of the document
  if ( !$body.length ) {
    $(function() {
      init();
    });
  } else {
    init();
  }

  return this;
};

})(window.jQuery);