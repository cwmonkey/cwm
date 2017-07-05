(function(cwmo) {

var MyBaseThing = cwmo.Class({
	has: [
		{name: 'name', alias: 'n'},
		{name: 'age', alias: 'a'}
	],
	constructor: function() {
	}
});

var MyThing = cwmo.Class({
	extends: MyBaseThing,
	has: [
		{name: 'size', alias: 's'}
	],
	constructor: function() {
		this.__type = 'my_thing';
	}
});

$('#small').on('click', function() {
	thing.size('S');
});

var objs = {};
var card_tpl = $.tpl.compile($('#card').html());

cwmo.listen(function(type) {
	console.log(arguments);

	if ( type === 'val' ) {
		objs[arguments[1]].set(arguments[2], arguments[3]);
	} else if ( type === 'add' && arguments[1] === 'my_thing' ) {
		var card = card_tpl(arguments[3]);
		objs[arguments[2]] = card;
		card.$node.appendTo(document.body);
	}
});

var thing = new MyThing({
	a: 13,
	s: 'M'
});

thing.name('Sucka');

console.log(thing);

console.log(thing, thing.constructor.name, thing.serialize());

})(window.cwmo);