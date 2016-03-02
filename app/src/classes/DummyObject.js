"use strict";

class DummyObject {

    constructor(opts = null) {
        this.el = opts.el;
    }
    sayHello(str){
    	this.el.html(str);
    }
    
}