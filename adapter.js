const fs = require('fs');
const path = require('path');
const util = require('./util');

// Maps from typeName to class function
var subClasses = {}; // private static field

module.exports = (function(){
    // constructor
    function cls(_acct)
    {
        // private instance fields
        var acct = _acct; 

        // public instance method
        this.send = function(probId, filePath){
            // suf includes the dot
            var suf = path.extname(filePath);
            if (suf.length <= 1)
                throw "Cannot auto-detect language";

            suf = suf.substring(1).toLowerCase();
            this._send(probId, filePath, suf);
        };

        this.account  = function(){
            return acct;
        };
    }

    // public static method
    cls.create = function(acct){
        var clsFn = subClasses[acct.type().toLowerCase()];
        if (clsFn) return new clsFn(acct);
        return null;
    };

    return cls;
})();

/*
 * Auto load the subclasses
 */
(function(){
    var files = fs.readdirSync(__dirname);
    for (var i=0; i < files.length; i++)
    {
        var match = /^adapter(\w+)/i.exec(files[i]);
        if (!match) continue;
        var modName = match[1];
        subClasses[modName.toLowerCase()] = require('./'+files[i]);
    }
})();
