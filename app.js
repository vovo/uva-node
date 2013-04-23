const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const tty = require('tty');
const util = require('./util');
const errors = require('./errors');
const Account = require('./account');
const Adapter = require('./adapter');
const TemplateManager = require('./template');

module.exports = (function(){
    function cls()
    {
        /** Current account object */
        var curAcct = null;
        
        /** Current adapter object */
        var curAdap = null;
        
        /** Adapter specific data.
         *  E.g., adapData['uva'] is the UVA adapter specific data.
         */
        var adapData = {};

        /** All accounts. */
        var accts = []; 

        var tpls = {};
        var tplMgr = new TemplateManager(this, tpls);

        var editor;

        function findAcct(type, user)
        {
            for (var i=0; i < accts.length; i++)
            {
                if (accts[i].match(type, user))
                    return i;
            }

            return -1;
        }

        this.load = function(filePath){
            var settings = JSON.parse(fs.readFileSync(filePath, {encoding: 'utf8'}));
            adapData = settings.adapData;
            accts = settings.accts;
        
            for (var i=0; i < accts.length; i++)
            {
                accts[i] = new Account(accts[i]);
            }

            editor = settings.editor;
            tplMgr = new TemplateManager(this, tpls = settings.tpls || {});

            curAcct = null;
            curAdap = null;
            if (settings.curAcct && settings.curAcct.length === 2)
            {
                try
                {
                    this.use(settings.curAcct[0], settings.curAcct[1]);
                }
                catch (e){/*ignore*/}
            }
        };

        this.save = function(filePath){
            var settings = {
                curAcct: curAcct ? [curAcct.type(), curAcct.user()] : null,
                adapData : adapData,
                accts: accts,
                tpls: tpls,
                editor: editor
            };

            var opts = {encoding: 'utf8', mode: 0600};
            fs.writeFileSync(filePath, JSON.stringify(settings), opts);
        };

        this.setEditor = function(path){
            editor = path;
        };

        this.getTemplateManager = function(){
            return tplMgr;
        };

        this.edit = function(filePath, callback){
            if (!editor)
            {
                return callback(new errors.NoEditor());
            }
            
            function setRaw (mode) {
                process.stdin.setRawMode ? process.stdin.setRawMode(mode) : tty.setRawMode(mode);
            }

            try{
                var args  = [filePath];
                var isVim = /^(vi|vim)$/i.test(path.basename(editor));

                if (isVim)
                    args.unshift('-c','startinsert');

                if (!fs.existsSync(filePath))
                {
                    var fileExt = util.getFileExt(filePath).toLowerCase();
                    var lang = util.getLang(fileExt);
                    if (lang < 0) throw new errors.UnknownLang();

                    var r = tplMgr.spawn(lang, filePath);
                    if (r.lineNum && isVim)
                        args.unshift('+'+r.lineNum);
                }

                process.stdin.pause();
                setRaw(true);
                var ps = spawn(editor, args, {customFds:[0,1,2]});
                ps.on('exit', function(code,sig){
                    setRaw(false);
                    process.stdin.resume();
                    callback();
                }).on('error', function(e){
                    callback(e);
                });
            }
            catch(e){
                callback(e);
            }
        };

        this.getAdapterData = function(type){
            type = type.toLowerCase();
            return adapData[type] || (adapData[type] = {});
        };

        /**
         * Adds a new account, or replaces an existing one.
         * Replacing the current account is not an error.
         * @return boolean true if account was replaced; false if added
         */
        this.add = function(acct){
            var idx = findAcct(acct.type(), acct.user());
            if (idx >= 0)
            {
                accts[idx] = acct;
                if (curAcct && curAcct.match(acct.type(), acct.user()))
                {
                    curAcct = acct;
                    curAdap = Adapter.create(this, acct);
                }
                return true;
            }

            accts.push(acct);
            return false;
        };

        /**
         * Removes an existing account which must not be the current account.
         * @exception IsCurrent trying to remove a current account.
         * @exception NotExist
         * @return void
         */
        this.remove = function(type, user){
            if (curAcct && curAcct.match(type, user))
                throw new errors.IsCurrent();

            var idx = findAcct(type, user);
            if (idx < 0) throw new errors.NotExist();

            accts.splice(idx, 1);
        };

        this.getCurrent = function(){
            return curAcct;
        };

        this.getCurrentAdapter = function(){
            return curAdap;
        };

        this.useNone = function(){
            curAdap = curAcct = null;
        };

        /**
         * Sets an account as current.
         * @exception NotExist
         * @return void
         */
        this.use = function(type, user){
            var idx = findAcct(type, user);
            if (idx < 0) throw new errors.NotExist();
            
            var a = Adapter.create(this, accts[idx]);
            if (!a) throw new errors.NotExist();

            curAcct = accts[idx];
            curAdap = a;
        };

        this.get = function(idx){
            return accts[idx];
        };

        this.size = function(){
            return accts.length;
        };
    }

    return cls;
})();
