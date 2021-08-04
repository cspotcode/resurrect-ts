/**
 * # ResurrectJS
 * @version 1.0.3
 * @license Public Domain
 *
 * ResurrectJS preserves object behavior (prototypes) and reference
 * circularity with a special JSON encoding. Unlike regular JSON,
 * Date, RegExp, DOM objects, and `undefined` are also properly
 * preserved.
 *
 * ## Examples
 *
 * function Foo() {}
 * Foo.prototype.greet = function() { return "hello"; };
 *
 * // Behavior is preserved:
 * var necromancer = new Resurrect();
 * var json = necromancer.stringify(new Foo());
 * var foo = necromancer.resurrect(json);
 * foo.greet();  // => "hello"
 *
 * // References to the same object are preserved:
 * json = necromancer.stringify([foo, foo]);
 * var array = necromancer.resurrect(json);
 * array[0] === array[1];  // => true
 * array[1].greet();  // => "hello"
 *
 * // Dates are restored properly
 * json = necromancer.stringify(new Date());
 * var date = necromancer.resurrect(json);
 * Object.prototype.toString.call(date);  // => "[object Date]"
 *
 * ## Options
 *
 * Options are provided to the constructor as an object with these
 * properties:
 *
 *   prefix ('#'): A prefix string used for temporary properties added
 *     to objects during serialization and deserialization. It is
 *     important that you don't use any properties beginning with this
 *     string. This option must be consistent between both
 *     serialization and deserialization.
 *
 *   cleanup (false): Perform full property cleanup after both
 *     serialization and deserialization using the `delete`
 *     operator. This may cause performance penalties (breaking hidden
 *     classes in V8) on objects that ResurrectJS touches, so enable
 *     with care.
 *
 *   revive (true): Restore behavior (__proto__) to objects that have
 *     been resurrected. If this is set to false during serialization,
 *     resurrection information will not be encoded. You still get
 *     circularity and Date support.
 *
 *   resolver (NamespaceResolver(window)): Converts between
 *     a name and a prototype. Create a custom resolver if your
 *     constructors are not stored in global variables. The resolver
 *     has two methods: getName(object) and getPrototype(string).
 *
 * For example,
 *
 * var necromancer = new Resurrect({
 *     prefix: '__#',
 *     cleanup: true
 * });
 *
 * ## Caveats
 *
 *   * With the default resolver, all constructors must be named and
 *   stored in the global variable under that name. This is required
 *   so that the prototypes can be looked up and reconnected at
 *   resurrection time.
 *
 *   * The wrapper objects Boolean, String, and Number will be
 *   unwrapped. This means extra properties added to these objects
 *   will not be preserved.
 *
 *   * Functions cannot ever be serialized. Resurrect will throw an
 *   error if a function is found when traversing a data structure.
 *
 * @see http://nullprogram.com/blog/2013/03/28/
 */

/**
 * @exports @typedef {(this: any, key: string, value: any) => any} ReplacerFn */
/**
 * @exports @typedef {ReplacerFn | (number | string)[] | null} Replacer */

/**
 * Resolves prototypes through the properties on an object and
 * constructor names.
 * @param {Object} scope
 * @constructor
 */
 class NamespaceResolver {
    constructor(scope) {
        this.scope = scope;
    }
    /**
     * Gets the prototype of the given property name from an object. If
     * not found, it throws an error.
     * @param {string} name
     * @returns {Object}
     * @method
     */
    getPrototype(name) {
        var constructor = this.scope[name];
        if (constructor) {
            return constructor.prototype;
        } else {
            throw new ResurrectError('Unknown constructor: ' + name);
        }
    }
    /**
     * Get the prototype name for an object, to be fetched later with getPrototype.
     * @param {Object} object
     * @returns {?string} Null if the constructor is Object.
     * @method
     */
    getName(object) {
        var constructor = object.constructor.name;
        if (constructor == null) { // IE
            var funcPattern = /^\s*function\s*([A-Za-z0-9_$]*)/;
            constructor = funcPattern.exec(object.constructor)[1];
        }

        if (constructor === '') {
            var msg = "Can't serialize objects with anonymous constructors.";
            throw new ResurrectError(msg);
        } else if (constructor === 'Object' || constructor === 'Array') {
            return null;
        } else {
            return constructor;
        }
    }
};

/**
 * @typedef {{
 *   prefix?: string;
 *   cleanup?: boolean;
 *   revive?: boolean;
 *   resolver?: NamespaceResolver;
 * }} Options
 */

/** */
class Resurrect {
    /** @param {Options} [options] See options documentation. */
    constructor(options) {
        this.table = null;
        this.prefix = '#';
        this.cleanup = false;
        this.revive = true;
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                this[option] = options[option];
            }
        }
        this.refcode = this.prefix + 'id';
        this.origcode = this.prefix + 'original';
        this.buildcode = this.prefix + '.';
        this.valuecode = this.prefix + 'v';
    }
    
    /* Methods */
    /**
     * Create a reference (encoding) to an object.
     * @param {(Object|undefined)} object
     * @returns {Object}
     * @method
     */
    ref(object) {
        var ref = {};
        if (object === undefined) {
            this._setTag(ref, -1);
        } else {
            this._setTag(ref, this._getRefcode(object));
        }
        return ref;
    }
    /**
     * Lookup an object in the table by reference object.
     * @param {Object} ref
     * @returns {(Object|undefined)}
     * @method
     */
    deref(ref) {
        return this.table[this._getTag(ref)];
    }
    /**
     * Put a temporary identifier on an object and store it in the table.
     * @param {Object} object
     * @returns {number} The unique identifier number.
     * @method
     */
    tag(object) {
        if (this.revive) {
            var constructor = this.resolver.getName(object);
            if (constructor) {
                var proto = Object.getPrototypeOf(object);
                if (this.resolver.getPrototype(constructor) !== proto) {
                    throw new ResurrectError('Constructor mismatch!');
                } else {
                    this._setTag(object, constructor);
                }
            }
        }
        const refcode = this._setRefcode(object, this.table.length);
        this.table.push(object);
        return refcode;
    }
    tagMap = new WeakMap();
    refcodeMap = new WeakMap();
    _hasTag(object) {
        return this.prefix in object;
        // return this.tagMap.has(object) || this.prefix in object;
    }
    _getTag(object) {
        return object[this.prefix];
        // return this.tagMap.has(object) ? this.tagMap.get(object) : object[this.prefix];
    }
    _setTag(object, value) {
        object[this.prefix] = value;
        // this.tagMap.set(object, value);
        return value;
    }
    _deleteTag(object) {
        // delete object[this.prefix];
        this.tagMap.delete(object);
    }
    _getRefcode(object) {
        return object[this.refcode];
        // return this.refcodeMap.get(object);
    }
    _setRefcode(object, value) {
        object[this.refcode] = value;
        // this.refcodeMap.set(object, value);
        return value;
    }
    _deleteRefcode(object) {
        delete object[this.refcode];
        // this.refcodeMap.delete(object);
    }
    _setRefcodeNull(object) {
        object[this.refcode] = null;
        // this.refcodeMap.set(object, null);
        return null;
    }
    /**
     * Create a builder object (encoding) for serialization.
     * @param {string} name The name of the constructor.
     * @param value The value to pass to the constructor.
     * @returns {Object}
     * @method
     */
    builder(name, value) {
        var builder = {};
        builder[this.buildcode] = name;
        builder[this.valuecode] = value;
        return builder;
    }
    /**
     * Build a value from a deserialized builder.
     * @param {Object} ref
     * @returns {Object}
     * @method
     * @see http://stackoverflow.com/a/14378462
     * @see http://nullprogram.com/blog/2013/03/24/
     */
    build(ref) {
        var type = ref[this.buildcode].split(/\./).reduce(function (object, name) {
            return object[name];
        }, Resurrect.GLOBAL);
        /* Brilliant hack by kybernetikos: */
        var args = [null].concat(ref[this.valuecode]);
        var factory = type.bind.apply(type, args);
        var result;
        if(type === BigInt) {
            result = factory();
        } else {
            result = new factory();
        }
        if (Resurrect.isPrimitive(result)) {
            return result.valueOf(); // unwrap
        } else {
            return result;
        }
    }
    /**
     * Dereference or build an object or value from an encoding.
     * @param {Object} ref
     * @returns {(Object|undefined)}
     * @method
     */
    decode(ref) {
        if (this._hasTag(ref)) {
            return this.deref(ref);
        } else if (this.buildcode in ref) {
            return this.build(ref);
        } else {
            console.log(ref);
            throw new ResurrectError('Unknown encoding.');
        }
    }
    /**
     * @param {Object} object
     * @returns {boolean} True if the provided object is tagged for serialization.
     * @method
     */
    isTagged(object) {
        return this._getRefcode(object) != null;
    }
    /**
     * Visit root and all its ancestors, visiting atoms with f.
     * @param {*} root
     * @param {Function} f
     * @param {Replacer} replacer
     * @returns {*} A fresh copy of root to be serialized.
     * @method
     */
    visit(root, f, replacer) {
        if (Resurrect.isAtom(root)) {
            return f(root);
        } else if (!this.isTagged(root)) {
            var copy = null;
            if (Resurrect.isArray(root)) {
                copy = [];
                this._setRefcode(root, this.tag(copy));
                for (var i = 0; i < root.length; i++) {
                    copy.push(this.visit(root[i], f, replacer));
                }
            } else { /* Object */
                copy = Object.create(Object.getPrototypeOf(root));
                this._setRefcode(root, this.tag(copy));
                for (var key in root) {
                    var value = root[key];
                    if (root.hasOwnProperty(key)) {
                        if (replacer && value !== undefined) {
                            // Call replacer like JSON.stringify's replacer
                            value = replacer.call(root, key, root[key]);
                            if (value === undefined) {
                                continue; // Omit from result
                            }
                        }
                        copy[key] = this.visit(value, f, replacer);
                    }
                }
            }
            copy[this.origcode] = root;
            return this.ref(copy);
        } else {
            return this.ref(root);
        }
    }
    /**
     * Manage special atom values, possibly returning an encoding.
     * @param {*} atom
     * @returns {*}
     * @method
     */
    handleAtom(atom) {
        var Node = Resurrect.GLOBAL.Node || function () { };
        if (Resurrect.isFunction(atom)) {
            throw new ResurrectError("Can't serialize functions.");
        } else if (atom instanceof Node) {
            var xmls = new XMLSerializer();
            return this.builder('Resurrect.Node', [xmls.serializeToString(atom)]);
        } else if (Resurrect.isDate(atom)) {
            return this.builder('Date', [atom.toISOString()]);
        } else if (Resurrect.isRegExp(atom)) {
            var args = atom.toString().match(/\/(.+)\/([gimy]*)/).slice(1);
            return this.builder('RegExp', args);
        } else if (atom === undefined) {
            return this.ref(undefined);
        } else if (Resurrect.isNumber(atom) && (isNaN(atom) || !isFinite(atom))) {
            return this.builder('Number', [atom.toString()]);
        } else if (Resurrect.isBigInt(atom)) {
            return this.builder('BigInt', [atom.toString()]);
        } else {
            return atom;
        }
    }
    /**
     * Hides intrusive keys from a user-supplied replacer.
     * @param {ReplacerFn} replacer function of two arguments (key, value)
     * @returns {ReplacerFn} A function that skips the replacer for intrusive keys.
     * @method
     */
    replacerWrapper(replacer) {
        var skip = new RegExp('^' + Resurrect.escapeRegExp(this.prefix));
        return function (k, v) {
            if (skip.test(k)) {
                return v;
            } else {
                return replacer.call(this, k, v);
            }
        };
    }
    /**
     * Serialize an arbitrary JavaScript object, carefully preserving it.
     *
     * The `replacer` and `space`
     * arguments are the same as [JSON.stringify][json-mdn], being
     * passed through to this method. Note that the replacer will *not*
     * be called for ResurrectJS's intrusive keys.
     *
     * @param {*} object
     * @param {Replacer} replacer
     * @param {string} space
     * @method
     */
    stringify(object, replacer, space) {
        if (Resurrect.isFunction(replacer)) {
            replacer = this.replacerWrapper(replacer);
        } else if (Resurrect.isArray(replacer)) {
            var acceptKeys = replacer;
            replacer = function (k, v) {
                return acceptKeys.indexOf(k) >= 0 ? v : undefined;
            };
        }
        if (Resurrect.isAtom(object)) {
            return JSON.stringify(this.handleAtom(object), replacer, space);
        } else {
            this.table = [];
            this.visit(object, this.handleAtom.bind(this), replacer);
            for (var i = 0; i < this.table.length; i++) {
                if (this.cleanup) {
                    this._deleteRefcode(this.table[i][this.origcode]);
                } else {
                    this._setRefcodeNull(this.table[i][this.origcode]);
                }
                this._deleteRefcode(this.table[i]);
                delete this.table[i][this.origcode];
            }
            var table = this.table;
            this.table = null;
            return JSON.stringify(table, null, space);
        }
    }
    /**
     * Restore the __proto__ of the given object to the proper value.
     * @param {Object} object
     * @returns {Object} Its argument, or a copy, with the prototype restored.
     * @method
     */
    fixPrototype(object) {
        if (this._hasTag(object)) {
            var name = this._getTag(object);
            var prototype = this.resolver.getPrototype(name);
            if ('__proto__' in object) {
                object.__proto__ = prototype;
                if (this.cleanup) {
                    this._deleteTag(object);
                }
                return object;
            } else { // IE
                var copy = Object.create(prototype);
                for (var key in object) {
                    if (object.hasOwnProperty(key) && key !== this.prefix) {
                        copy[key] = object[key];
                    }
                }
                return copy;
            }
        } else {
            return object;
        }
    }
    /**
     * Deserializes an object stored in a string by
     * a previous call to `.stringify()`. Circularity and, optionally,
     * behavior (prototype chain) will be restored.
     *
     * @param {string} string
     * @returns {*} The decoded object or value.
     * @method
     */
    resurrect(string) {
        var result = null;
        var data = JSON.parse(string);
        if (Resurrect.isArray(data)) {
            this.table = data;
            /* Restore __proto__. */
            if (this.revive) {
                for (var i = 0; i < this.table.length; i++) {
                    this.table[i] = this.fixPrototype(this.table[i]);
                }
            }
            /* Re-establish object references and construct atoms. */
            for (i = 0; i < this.table.length; i++) {
                var object = this.table[i];
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        if (!(Resurrect.isAtom(object[key]))) {
                            object[key] = this.decode(object[key]);
                        }
                    }
                }
            }
            result = this.table[0];
        } else if (Resurrect.isObject(data)) {
            this.table = [];
            result = this.decode(data);
        } else {
            result = data;
        }
        this.table = null;
        return result;
    }
    /**
     * Escape special regular expression characters in a string.
     * @param {string} string
     * @returns {string} The string escaped for exact matches.
     * @see http://stackoverflow.com/a/6969486
     */
    static escapeRegExp(string) {
        return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    /**
     * Create a DOM node from HTML source; behaves like a constructor.
     * @param {string} html
     * @returns {any}
     * @constructor
     */
    static Node(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    }
    /* Type Tests */
    /**
     * @param {string} type
     * @returns {Function} A function that tests for type.
     */
    static is(type) {
        var string = '[object ' + type + ']';
        return function (object) {
            return Object.prototype.toString.call(object) === string;
        };
    }
    static isAtom(object) {
        return !Resurrect.isObject(object) && !Resurrect.isArray(object);
    }
    /**
     * @param {*} object
     * @returns {boolean} True if object is a primitive or a primitive wrapper.
     */
    static isPrimitive(object) {
        return object == null ||
            Resurrect.isNumber(object) ||
            Resurrect.isString(object) ||
            Resurrect.isBoolean(object);
    }
}
/* Set the default resolver searches the global object. */
Resurrect.prototype.resolver =
    new NamespaceResolver(Resurrect.GLOBAL);

/**
 * Portable access to the global object (window, global).
 * Uses indirect eval.
 * @constant
 */
Resurrect.GLOBAL = (0, eval)('this');

/**
 * @param {string} [message]
 * @constructor
 */
class ResurrectError extends Error {
    constructor(message) {
        super(message || '');
        // this.message = message || '';
        // this.stack = new Error().stack;
    }
}
ResurrectError.prototype.name = 'ResurrectError';

Resurrect.isArray = Resurrect.is('Array');
Resurrect.isString = Resurrect.is('String');
Resurrect.isBoolean = Resurrect.is('Boolean');
Resurrect.isNumber = Resurrect.is('Number');
Resurrect.isBigInt = Resurrect.is('BigInt');
Resurrect.isFunction = Resurrect.is('Function');
Resurrect.isDate = Resurrect.is('Date');
Resurrect.isRegExp = Resurrect.is('RegExp');
Resurrect.isObject = Resurrect.is('Object');

exports.Resurrect = Resurrect;
exports.NamespaceResolver = NamespaceResolver;
