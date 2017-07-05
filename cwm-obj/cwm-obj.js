;(function(undefined) {

var cwmo = {};

  /////////////////////////////
 // Events
/////////////////////////////

cwmo.listen = function(fn) {
	cwmo.listener = fn;
};

cwmo.say = function(type) {
	if ( cwmo.listener ) {
		var args = [].slice.call(arguments);

		cwmo.listener.apply(window, args);
	}
};

  /////////////////////////////
 // Class creator
/////////////////////////////

cwmo.Class = function(params) {
	var base = params.extends || cwmo.__baseClass;
	var target = params.constructor;
	var attrs = params.has || [];

	// Actual class to be returned
	var fn = function(imports) {
		// call parent constructor
		base.apply(this, arguments);

		// Add attrs to object
		if ( !this.__attrsAdded ) {
			for ( var i = 0, attr; (attr = this.constructor.__has[i]); i++ ) {
				this.__hases.push(attr);

				if ( attr.alias ) {
					this.__hasesAtoN[attr.alias] = attr.name;
				}
			}

			this.__attrsAdded = true;
		}

		// Call object's constructor
		target.apply(this, arguments);

		// If this constructor was the one called, run the end-of-chain methods
		if ( this.constructor === fn ) {
			if ( imports ) {
				this.import(imports);
			}

			cwmo.say('add', this.__type, this.__id, this.serialize());
		}
	};

	// Add attributes
	fn.__has = base.__has || [];
	fn.__has.push.apply(fn.__has, attrs);

	// Set fn's prototype to base's prototype
	fn.prototype = Object.create(base.prototype);

	// Set constructor back to fn
	fn.prototype.constructor = fn;

	// Prototype attr functions
	// TODO: allow for custom get/set functions?
	for ( var i = 0, attr; (attr = attrs[i]); i++ ) {
		(function(name) {
			fn.prototype[name] = function(val, what) {
				if ( val === undefined ) {
					return this.__values[name];
				}

				this.__values[name] = val;

				cwmo.say('val', this.__id, name, val, what);

				return this.__values[name];
			};
		})(attr.name);
	}

	return fn;
};

  /////////////////////////////
 // Base class
/////////////////////////////

// To have a unique id on every object created
var idcur = Date.now();

cwmo.__baseClass = function() {
	this.__values = {};
	this.__hases = [];
	this.__hasesAtoN = {}; // alias to name lookup
	this.__id = idcur++;
	this.__attrsAdded = false;
};

// Serialize object data using names
cwmo.__baseClass.prototype.serialize = function() {
	var obj = {};
	for ( var i = 0, has; (has = this.__hases[i]); i++ ) {
		if ( this.__values[has.name] !== undefined ) {
			obj[has.name] = this.__values[has.name];
		}
	}

	return obj;
};

// Serialize object data using aliases
cwmo.__baseClass.prototype.export = function() {
	var obj = {};
	for ( var i = 0, has; (has = this.__hases[i]); i++ ) {
		if ( has.alias ) {
			if ( this.__values[has.name] !== undefined ) {
				obj[has.alias] = this.__values[has.name];
			}
		}
	}

	return obj;
};

// Import json data with aliases to object (do not fire hooks)
cwmo.__baseClass.prototype.import = function(obj) {
	for ( var prop in obj ) {
		if ( obj.hasOwnProperty(prop) ) {
			this.__values[this.__hasesAtoN[prop]] = obj[prop];
		}
	}
};

window.cwmo = cwmo;

})();