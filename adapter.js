const fs = require('fs');
const path = require('path');
const util = require('./util');

// Maps from typeName to class function
var subClasses = {}; // private static field

module.exports = (function(){
    // constructor
    function cls(){};

    // class public static method
    cls.register = function(typeName, clsFn){
        subClasses[typeName.toLowerCase()] = clsFn;
    };

    // class public static method
    cls.create = function(acct){
        var clsFn = subClasses[acct.getType().toLowerCase()];
        return new clsFn(acct);
    };

    var proto = cls.prototype;

    // instance method
    proto.send = function(probId, filePath){
        // suf includes the dot
        var suf = path.extname(filePath);
        if (suf.length <= 1)
            throw "Cannot auto-detect language";

        suf = suf.substring(1).toLowerCase();
        this._send(probId, filePath, suf);
    };

    return cls;
})();
