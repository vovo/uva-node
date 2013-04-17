const cryptoUtil = require('./cryptoUtil');

module.exports = (function(){
    // constructor
    function cls(data)
    {
        // private instance fields
        var type = data.type;
        var user = data.user;
        var passIv = data.passIv;
        
        // if pass is encrypted, it will be decrypted later on
        var pass = data.pass;

        // Object that stores encrypted password, to be stringified
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
        else
        {
            var r = cryptoUtil.encrypt(new Buffer(pass, 'utf8'));
            obj.pass = r.buf.toString('hex');
            obj.passIv = passIv = r.iv.toString('hex');
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

