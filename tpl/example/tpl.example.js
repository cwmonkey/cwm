(function($) {
$(function() {
	var source   = $('#test-tpl').html();
	var template = Handlebars.compile(source);
	var vals = {
		name: 'Name',
		title: 'My New Post',
		body: 'This is my first post!'
	};
	var html    = template(vals);

	var tpl = $.tpl.compile(html);

	var test_tpl = tpl(vals);

	$('#tplarea').append(test_tpl.$node);

	$('.set_test a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('name', 'Sucka');
	});

	$('.set_test1 a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('test1', 'test1 val');
	});

	$('.set_test1-2 a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('test1', 'test1 new val');
	});

	$('.set_test2 a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('test2', 'border');
	});

	$('.set_test3 a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('test3', 'background');
	});

	$('.set_test4 a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set('test4', 'color');
	});

	$('.set_test234-none a').bind('click', function(e) {
		e.preventDefault();
		test_tpl.set({
			test2: '',
			test3: '',
			test4: ''
		});
	});
});
})(jQuery);