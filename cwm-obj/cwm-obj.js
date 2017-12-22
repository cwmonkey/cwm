;(function(undefined) {
'use strict';

var cwmo = {};
cwmo.objs = {};

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
 // Export
/////////////////////////////

cwmo.export = function() {
	var obj = {};

	for ( var id in cwmo.objs ) {
		if ( cwmo.objs.hasOwnProperty(id) ) {
			obj[id] = cwmo.objs[id].export();
		}
	}

	return obj;
};

  /////////////////////////////
 // Util
/////////////////////////////

// https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
var str = '';
for ( var i = 33; i <= 126; i++ ) {
	str += String.fromCharCode(i);
}

for ( i = 160; i <= 255; i++ ) { // 767
	str += String.fromCharCode(i);
}

var lim = str.length;

cwmo.encode = function(number) {
  if (isNaN(Number(number)) || number === null ||
    number === Number.POSITIVE_INFINITY)
    throw "The input is not valid";
  if (number < 0)
    throw "Can't represent negative numbers now";

  var rixit; // like 'digit', only in some non-decimal radix 
  var residual = Math.floor(number);
  var result = '';
  while (true) {
    rixit = residual % lim;
    // console.log("rixit : " + rixit);
    // console.log("result before : " + result);
    result = str.charAt(rixit) + result;
    // console.log("result after : " + result);
    // console.log("residual before : " + residual);
    residual = Math.floor(residual / lim);
    // console.log("residual after : " + residual);

    if (residual === 0)
      break;
    }
  return result;
};

cwmo.decode = function(rixits) {
  var result = 0;
  // console.log("rixits : " + rixits);
  // console.log("rixits.split('') : " + rixits.split(''));
  rixits = rixits.split('');
  for (var e = 0; e < rixits.length; e++) {
    // console.log("_Rixits.indexOf(" + rixits[e] + ") : " + 
        // this._Rixits.indexOf(rixits[e]));
    // console.log("result before : " + result);
    result = (result * lim) + str.indexOf(rixits[e]);
    // console.log("result after : " + result);
  }
  return result;
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

				this.__hasesN[attr.name] = attr;

				if ( attr.alias ) {
					if ( this.__hasesAtoN[attr.alias] ) throw 'Error: Already has attr alias';
					this.__hasesAtoN[attr.alias] = attr.name;
				}
			}

			this.__attrsAdded = true;
		}

		// If this constructor was the one called, run the end-of-chain methods
		if ( this.constructor === fn ) {
			for ( var i = 0, attr; (attr = attrs[i]); i++ ) {
				if ( typeof attr === 'string' ) {
					attr = {name: attr};
				}

				this.__values[attr.name] = attr.default;
			}

			if ( imports ) {
				this.import(imports);
			}
		}

		// Call object's constructor
		target.apply(this, arguments);

		if ( this.constructor === fn ) {
			cwmo.say('add', this.__type, this.__id, this.serialize());
		}
	};

	// Set fn's prototype to base's prototype
	fn.prototype = Object.create(base.prototype);

	// Set constructor back to fn
	fn.prototype.constructor = fn;

	fn.__has = base.__has || [];

	for ( var i = 0, attr; (attr = attrs[i]); i++ ) {
		// Add attributes
		if ( typeof attr === 'string' ) {
			attr = {name: attr};
		}

		fn.__has.push(attr);

		// Prototype attr functions
		// TODO: allow for custom get/set functions?
		(function(name) {
			fn.prototype[name] = function(val, what, why) {
				if ( val === undefined ) {
					return this.__values[name];
				}

				this.__values[name] = val;

				what = what ? what.__id : undefined;

				cwmo.say('val', this.__id, name, val, what, why);

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
cwmo.idCur = 1;

cwmo.__baseClass = function(params) {
	this.__isCwmo = true;
	this.__values = {};
	this.__hases = [];
	this.__hasesAtoN = {}; // alias to name lookup
	this.__hasesN = {}; // to see if name exists
	this.__attrsAdded = false;

	if ( params && params.__id ) {
		this.__id = params.__id;
	} else {
		this.__id = cwmo.idCur++;
	}

	if ( cwmo.objs[this.__id] ) throw 'Error: Object ID exists';

	cwmo.objs[this.__id] = this;
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
	var val;
	var j, jl, jv;

	for ( var i = 0, has; (has = this.__hases[i]); i++ ) {
		if ( has.alias ) {
			val = this.__values[has.name]; 
			if ( val !== undefined ) {
				if ( Array.isArray(val) ) {
					obj[has.alias] = [];

					for ( j = 0, jl = val.length; j < jl; j++ ) {
						jv = val[j];

						if ( jv.__isCwmo ) {
							obj[has.alias].push(jv.__id);
						} else {
							obj[has.alias].push(jv);
						}
					}
				} else if ( val.__isCwmo ) {
					obj[has.alias] = val.__id;
				} else {
					obj[has.alias] = val;
				}
			}
		}
	}

	if ( this.__type ) {
		obj._t = this.__type;
	}

	return obj;
};

// Import json data with aliases to object (do not fire hooks)
cwmo.__baseClass.prototype.import = function(obj) {
	var name;
	for ( var prop in obj ) {
		if ( obj.hasOwnProperty(prop) ) {
			name = null;

			if ( this.__hasesAtoN[prop] ) {
				name = this.__hasesAtoN[prop];
			} else if ( this.__hasesN[prop] ) {
				name = prop;
			}

			if ( name ) {
				this.__values[name] = obj[prop];
			}
		}
	}
};

/*// Replace cwmo references with actual objects
cwmo.__baseClass.prototype.init = function(obj) {
	var name;
	for ( var prop in obj ) {
		if ( obj.hasOwnProperty(prop) ) {
			name = null;

			if ( this.__hasesAtoN[prop] ) {
				name = this.__hasesAtoN[prop];
			} else if ( this.__hasesN[prop] ) {
				name = prop;
			}

			if ( name ) {
				if ( this.__hasesN[name].type === 'cwma' ) {
					for ( var i = 0, id; (id = this.__values[name][i]); i++ ) {
						this.__values[name][i] = cwmo.objs[id];
					}
				} else if ( this.__hasesN[name].type === 'cwmo' ) {
					this.__values[name] = cwmo.objs[this.__values[name]];
				}
			}
		}
	}
};*/

window.cwmo = cwmo;

})();