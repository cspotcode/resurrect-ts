export type Options = {
    prefix?: string;
    cleanup?: boolean;
    revive?: boolean;
    resolver?: NamespaceResolver;
};
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
 * @typedef {{
 *   prefix?: string;
 *   cleanup?: boolean;
 *   revive?: boolean;
 *   resolver?: NamespaceResolver;
 * }} Options
 */
/**
 * @param {Options} [options] See options documentation.
 * @namespace
 * @constructor
 */
export function Resurrect(options?: Options): void;
export class Resurrect {
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
     * @typedef {{
     *   prefix?: string;
     *   cleanup?: boolean;
     *   revive?: boolean;
     *   resolver?: NamespaceResolver;
     * }} Options
     */
    /**
     * @param {Options} [options] See options documentation.
     * @namespace
     * @constructor
     */
    constructor(options?: Options);
    table: any;
    prefix: string;
    cleanup: boolean;
    revive: boolean;
    refcode: string;
    origcode: string;
    buildcode: string;
    valuecode: string;
    /**
     * @param {string} [message]
     * @constructor
     */
    Error(message?: string): void;
    message: string;
    stack: string;
    resolver: NamespaceResolver;
    /**
     * Create a reference (encoding) to an object.
     * @param {(Object|undefined)} object
     * @returns {Object}
     * @method
     */
    ref(object: (any | undefined)): any;
    /**
     * Lookup an object in the table by reference object.
     * @param {Object} ref
     * @returns {(Object|undefined)}
     * @method
     */
    deref(ref: any): (any | undefined);
    /**
     * Put a temporary identifier on an object and store it in the table.
     * @param {Object} object
     * @returns {number} The unique identifier number.
     * @method
     */
    tag(object: any): number;
    /**
     * Create a builder object (encoding) for serialization.
     * @param {string} name The name of the constructor.
     * @param value The value to pass to the constructor.
     * @returns {Object}
     * @method
     */
    builder(name: string, value: any): any;
    /**
     * Build a value from a deserialized builder.
     * @param {Object} ref
     * @returns {Object}
     * @method
     * @see http://stackoverflow.com/a/14378462
     * @see http://nullprogram.com/blog/2013/03/24/
     */
    build(ref: any): any;
    /**
     * Dereference or build an object or value from an encoding.
     * @param {Object} ref
     * @returns {(Object|undefined)}
     * @method
     */
    decode(ref: any): (any | undefined);
    /**
     * @param {Object} object
     * @returns {boolean} True if the provided object is tagged for serialization.
     * @method
     */
    isTagged(object: any): boolean;
    /**
     * Visit root and all its ancestors, visiting atoms with f.
     * @param {*} root
     * @param {Function} f
     * @param {Function} replacer
     * @returns {*} A fresh copy of root to be serialized.
     * @method
     */
    visit(root: any, f: Function, replacer: Function): any;
    /**
     * Manage special atom values, possibly returning an encoding.
     * @param {*} atom
     * @returns {*}
     * @method
     */
    handleAtom(atom: any): any;
    /**
     * Hides intrusive keys from a user-supplied replacer.
     * @param {Function} replacer function of two arguments (key, value)
     * @returns {Function} A function that skips the replacer for intrusive keys.
     * @method
     */
    replacerWrapper(replacer: Function): Function;
    /**
     * Serialize an arbitrary JavaScript object, carefully preserving it.
     * @param {*} object
     * @param {(Function|Array)} replacer
     * @param {string} space
     * @method
     */
    stringify(object: any, replacer: (Function | any[]), space: string): string;
    /**
     * Restore the __proto__ of the given object to the proper value.
     * @param {Object} object
     * @returns {Object} Its argument, or a copy, with the prototype restored.
     * @method
     */
    fixPrototype(object: any): any;
    /**
     * Deserialize an encoded object, restoring circularity and behavior.
     * @param {string} string
     * @returns {*} The decoded object or value.
     * @method
     */
    resurrect(string: string): any;
}
export namespace Resurrect {
    const GLOBAL: any;
    /**
     * Escape special regular expression characters in a string.
     * @param {string} string
     * @returns {string} The string escaped for exact matches.
     * @see http://stackoverflow.com/a/6969486
     */
    function escapeRegExp(string: string): string;
    namespace prototype {
        class Error {
            name: string;
        }
    }
    /**
     * Create a DOM node from HTML source; behaves like a constructor.
     * @param {string} html
     * @constructor
     */
    function Node(html: string): ChildNode;
    /**
     * @param {string} type
     * @returns {Function} A function that tests for type.
     */
    function is(type: string): Function;
    const isArray: Function;
    const isString: Function;
    const isBoolean: Function;
    const isNumber: Function;
    const isFunction: Function;
    const isDate: Function;
    const isRegExp: Function;
    const isObject: Function;
    function isAtom(object: any): boolean;
    /**
     * @param {*} object
     * @returns {boolean} True if object is a primitive or a primitive wrapper.
     */
    function isPrimitive(object: any): boolean;
}
/**
 * Resolves prototypes through the properties on an object and
 * constructor names.
 * @param {Object} scope
 * @constructor
 */
export function NamespaceResolver(scope: any): void;
export class NamespaceResolver {
    /**
     * Resolves prototypes through the properties on an object and
     * constructor names.
     * @param {Object} scope
     * @constructor
     */
    constructor(scope: any);
    scope: any;
    /**
     * Gets the prototype of the given property name from an object. If
     * not found, it throws an error.
     * @param {string} name
     * @returns {Object}
     * @method
     */
    getPrototype(name: string): any;
    /**
     * Get the prototype name for an object, to be fetched later with getPrototype.
     * @param {Object} object
     * @returns {?string} Null if the constructor is Object.
     * @method
     */
    getName(object: any): string | null;
}
