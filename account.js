const cryptoUtil = require('./cryptoUtil');

module.exports = (function(){
    // constructor
    function cls(data)
    {
        // private instance fields
        var type = data.type;
        var user = data.user;
        var passIv = data.passIv;
        
        // might be encrypted
        var pass = data.pass;

        var obj = {
            type: type,
            user: user,
            pass: pass,
            passIv: passIv
        };

        // encrypted?
        if (passIv)
        {
            var buf = cryptoUtil.decrypt(
                        new Buffer(pass, 'hex'), 
                        new Buffer(passIv, 'hex'));
            pass = buf.toString('utf8');
        }

        /**
         * Gets the JSON object to be stringified.
         */
        this.toJson = function(){
            return obj;
        };

        this.user = function(){return user;};
        this.pass = function(){return pass;};
        this.type = function(){return type;};
    }

    return cls;
})();

