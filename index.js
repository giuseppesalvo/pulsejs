'use strict';

const LibraryName = "pulse"

class Component {

	constructor(element, options = {}) {
		this._libraryname = LibraryName
		this._cachedElements = {};
		this.element = element;
		this.nestedAttribute = LibraryName
		this._options = options
		this._addOptions()
		this._rootEl();
	}

	get options() {
		return this._options;
	}

	mount() {
		return Mount(...arguments)
	}

	get container() {
		return this.element;
	}

	template( name, model, stringify ) {
		let temp = this.templates[name];
		
		if ( !temp ) return null;

		for ( let k in model ) {
			temp = temp.replace(new RegExp(`{{${k}}}`, 'g'), model[k] )
		}

		if ( !stringify ) {
			return new DOMParser().parseFromString(temp, "text/html").body
		} else 
			return temp
	}

	get templates() {
		return this._getTemplates();
	}

	_getTemplates() {
		if ( !this.templatesObject || this.needsUpdate ) {

			const templates = this.element.querySelectorAll('template');
			let result = this.templatesObject || {}

			Array.from(templates).forEach( v => {

				// Check if it's an element of other components
				if ( this._isNested(v) ) return;				

				result[v.getAttribute('name')] = v.innerHTML.replace(/[\t\n]/g, '');
				v.parentNode.removeChild(v);
			});
		
			this.templatesObject = result;
		}

		return this.templatesObject;
	}

	// Check if element is part of a nested component
	_isNested(element) {

		let parent   = element
		  , isNested = false
		
		const attribute = this.nestedAttribute

		while ( parent !== this.container && isNested === false ) {
			parent = parent.parentNode

			if ( parent.hasAttribute(attribute) && parent !== this.container )
				isNested = true;
		}

		return isNested
	}
	
	_rootEl() {
		if ( !this.elementsInRoot || this.needsUpdate ) {
			this.elementsInRoot = this.element.querySelectorAll('[ref], [root]')
			this.elementsObject = {}

			Array.from(this.elementsInRoot).forEach( v => {

				// Check if it's an element of other components
				if ( this._isNested(v) ) return;

				const key = v.getAttribute('ref') || v.getAttribute('root');

				if ( !this.elementsObject[key] ) {
					this.elementsObject[key] = v 
				} else {
					if ( this.elementsObject[key].length && this.elementsObject[key].length >= 1 ) {
						this.elementsObject[key].push(v)
					} else {
						this.elementsObject[key] = [ this.elementsObject[key] ];
						this.elementsObject[key].push(v);
					}
				}
			});
		}
		
		return this.elementsObject;
	}

	_addOptions() {
		const blacklist  = [ "class", "id", "ref", "root", this.nestedAttribute ]
			, attributes = this.container.attributes

		for ( let i = 0; i < attributes.length ; i++ ) {
			let attribute = attributes[i]
			if ( blacklist.indexOf(attribute.nodeName) < 0 ) {
				this._options[attribute.nodeName.replace(/\s/g,'')] = attribute.nodeValue
			}
		}
		return true;
	}

	new(el) {
		return document.createElement(el)
	}

	_addBindings() {
		function bindSelector(ev) {
			Array.from(this.element.querySelectorAll(`[${ev}]`)).forEach( v => {

				// Check if it's an element of other components
				if ( this._isNested(v) ) return;

				const funcname = v.getAttribute(ev)
					, func 	   = this[funcname]

				if ( typeof func === "function" ) {
					v.addEventListener(ev.replace(/^on/, ''), (e) => func.call(this, e, v) )
				} else {
					console.warn(`'${funcname}' ${ev} function not defined for`, v)
				}
				v.removeAttribute(ev)
			})
		}
		const bindings = ['onclick', 'onchange', 'oninput', 'onmouseenter', 'onmouseleave']
		bindings.forEach( bindSelector.bind(this) )
	}

	el(selector, update) {
		if ( ! this._cachedElements[selector] || update === true ) {
			const el = this.element.querySelectorAll(selector)
			this._cachedElements[selector] = el.length > 1 ? el : el[0] || null
		}
		return this._cachedElements[selector];
	}
	
	get root() {
		return this._rootEl(); 
	}
	
	update() {
		this.needsUpdate = true;
		this._addOptions();
		this._addBindings();
		this._rootEl();
		this._getTemplates();
		this.needsUpdate = false;
		return true;
	}
}

function clone (obj) {
	let t = {}
	for ( let k of Object.getOwnPropertyNames(obj) ) {
		t[k] = obj[k];
	}
	return t;
}

function extend(ChildClass, ParentClass, dependency, proto, options ) {
	ChildClass.prototype = new ParentClass(dependency, options);
	Object.assign( ChildClass.prototype, proto );
	ChildClass.prototype.constructor = ChildClass;
}

function checkReservedProperties(object) {
	const reserved = [ "update", "container", "root", "el", "new", "template", "mount", "options" ]
	for ( let key in object ) {
		if ( obj.hasOwnProperty(key) ) {
			throw new Error(`${LibraryName}: ${key} property is reserved`)
		}	
	}
}

export default function Mount ( selector, Tag, options = {} ) {

	const element = document.querySelectorAll(`[${LibraryName}="${selector}"`);

	if ( element ) {
		const result = []
			, old 	 = clone(Tag.prototype)

		checkReservedProperties( old )

		for ( let i = 0; i < element.length ; i++ ) {
			extend( Tag, Component, element[i], old, options )
			const instance = new Tag(options)
			instance.update();
			result.push(instance);
			Tag.prototype = old;
		}

		return result.length > 1 ? result : result[0] || null ;

	} else {
		console.warn("Elements with specified selector: ${selector} not found")
		return null;
	}

}