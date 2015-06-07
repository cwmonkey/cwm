/*

Add accessible tooltips.

Example: $('[title]').tooltip();

TODO:
  Allow for delegates other than body.
  Add previous selectors to a single delegate bind.
  Param class/id names.
  Find highest zIndex?

*/

;(function($, undefined) {

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
    position: 'absolute'
  })
  ;

var $tooltip_text = $('<span/>')
  .addClass(class_name + '-text')
  .appendTo($tooltip)
  ;

var $tooltip_arrow = $('<span/>')
  .addClass(class_name + '-arrow')
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
  var $this = $(this);

  var title = this.title || $this.data('title');

  if ( !title ) {
    return;
  }

  if ( $current && $this[0] === $current[0] ) {
    return;
  } else if ( $current ) {
    reset_node($current);
  }

console.log('show');

  $current = $this;

  clearTimeout(hide_timeout);

  $tooltip_text.html(title);

  $this
    .data('title', title)
    .attr({
      'title': '',
      'aria-describedby': id_name
    })
    ;

  observer.disconnect();
  observer.observe(this, observerConfig);

  $tooltip
    .css({
      left: '',
      width: ''
    })
    ;

  var offset = $this.offset();
  var this_width = $this.outerWidth();
  var this_height = $this.outerHeight();

  $tooltip
    .appendTo($body);

  var tooltip_width = $tooltip.outerWidth();
  $tooltip.css('width', tooltip_width);

  var left = offset.left + this_width / 2 - tooltip_width / 2;
  if ( left < 0 ) {
    $tooltip_arrow.css('left', left);
    left = 0;
  } else {
    $tooltip_arrow.css('left', 0);
  }

  $tooltip
    .css({
      left: left,
      top: offset.top + this_height
    })
    .addClass(show_class)
    ;


  if ( left + $tooltip.outerWidth() > $window.width() ) {
    var off = (left + $tooltip.outerWidth()) - $window.width();
    $tooltip.css('left', left - off);
    $tooltip_arrow.css('left', off);
  }
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
$.fn.tooltip = function() {
  var selector = this.selector;
  var init = function() {
    var ignore_next = false;
    $body
      /*.delegate(selector, 'mouseenter focus', show_tooltip)
      .delegate(selector, 'mouseleave blur click mousedown mouseup', hide_tooltip)*/
      .bind('mousemove', function(e) {
        if ( ignore_next ) {
          ignore_next = false;
          return;
        }

        var $closest = $(e.target).closest(selector);
        if ( !$closest.length ) {
          hide_tooltip();
        } else {
          show_tooltip.call($closest[0]);
        }
      })
      .bind('mousedown mouseup', function() {
        ignore_next = true;
        hide_tooltip();
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