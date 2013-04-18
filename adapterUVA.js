const fs = require('fs');
const path = require('path');
const util = require('./util');
const Adapter = require('./adapter');

const UVA_HOST = "uva.onlinejudge.org";
const SUBMIT_PAGE_PATH = "/index.php?option=com_onlinejudge&Itemid=25";
const SUBMIT_PATH = "/index.php?option=com_onlinejudge&Itemid=25&page=save_submission";

const UHUNT_HOST = 'uhunt.felix-halim.net';

const LOGIN_FORM_PATTERN =
    // group 1: form attribs
    // group 2: form HTML contents 
    /<form([^>]+?id\s*=\s*["']?\w*login[^>]*)>((?:.|\n)*?)<\/form>/gi;

const INPUT_PATTERN =
    // group 1: attribs 
    /<input([^>]+?)\/?>/gi;

module.exports = (function(parentCls){
    // constructor
    function cls(app, acct)
    {
        // super constructor call
        parentCls.call(this, app, acct);

        // private instance fields
        var acctData = acct.getAdapterData();
        var adapData = app.getAdapterData('uva');
        var cookies = '';

        // private instance method
        function fetchUserId(callback)
        {
            acctData.userId > 0 ? 
                callback(null, acctData.userId) : 
                util.createReq(
                    'GET', 
                    UHUNT_HOST, 
                    '/api/uname2uid/'+acct.user(),
                    util.createEndCallback(function(buf){
                        callback(null, acctData.userId = parseInt(buf));
                    })
                ).on('error', callback)
                 .end();
        };

        function fetchProbs(callback)
        {
            adapData.probs ? 
                callback(null, adapData.probs) :
                util.createReq(
                    'GET',
                    UHUNT_HOST,
                    '/api/p',
                    util.createEndCallback(function(buf){
                        var p = JSON.parse(buf);
                        p.map = {}; // maps prob ID to array index
                        for (var i=0;i < p.length; i++)
                        {
                            p.map[p[i][0]+''] = i; 
                        }
                        callback(null, adapData.probs = p);
                    })
                ).on('error', callback)
                 .end(); 
        }

        // public instance method
        this.login = function(callback){
            var callback2 = util.createEndCallback(function(_, inMsg){    
                cookies = util.getCookies(inMsg);
                callback();
            });

            var callback1 = util.createEndCallback(function(html, inMsg){
                var f = cls.parseForm(LOGIN_FORM_PATTERN, html);
                var err= null;
                if (!f)
                    err = ("cannot find HTML form");
                else if (!f.userField)
                    err = ("cannot find user field");
                else if (!f.passField)
                    err = ("cannot find pass field");
                else if (!f.action)
                    err = ("cannot find action");

                if (err)
                {
                    callback({message: err});
                    return;
                }

                var cookies = util.getCookies(inMsg);
                f.data[f.userField] = acct.user();
                f.data[f.passField] = acct.pass();

                var req = util.createReq(
                        'POST', UVA_HOST, f.action, callback2
                    );
                req.on('error', callback);
                req.setHeader('Cookie', cookies);
                util.writePostData(req, f.data);
            });

            util.createReq('GET', UVA_HOST, '/', callback1)
                .on('error', callback)
                .end();            
        };

        this._send = function(probNum, filePath, lang, callback){
            var callback10 = util.createEndCallback(function(html){
                console.log(html);
                callback(null);
            });

            var langVal;
            switch (lang)
            {
            case 'c': langVal = 1; break;
            case 'java': langVal = 2; break;
            case 'cpp': langVal = 3; break;
            case 'p':
            case 'pascal':
            case 'pas': langVal = 4; break;
            default:
                callback({message:'unacceptable programming lang'});
                return;
            }

            var data = {
                localid: probNum,
                code: '',
                language: langVal,
                codeupl: {filePath: filePath},
                problemid: '',
                category: ''
            };
            
            var req = util.createReq('POST', UVA_HOST, SUBMIT_PATH, callback10);
            req.on('error', callback);
            req.setHeader('Cookie', cookies);
            try
            {
                util.writeFormData(req, data);        
            }
            catch(e)
            {
                callback(typeof e =='string' ? {message: e} : e);
            }
        };

        this.fetchStatus = function(callback){
            var callback10 = util.createEndCallback(new (function(){
                var tries = 0;
        
                function process(buf)
                {
                    var obj = JSON.parse(buf);
                    var subs = obj.subs; 
                    if (typeof(subs) == 'string')
                        subs = JSON.parse(subs);

                    // latest at 0th elem.
                    subs.sort(function(a,b){return b[0] - a[0];});

                    /*
                    subs[i] is an array with fields in this order:
                    0: Submission ID
                    1: Problem ID
                    2: Verdict ID
                    3: Runtime
                    4: Submission Time (unix timestamp)
                    5: Language ID (1=ANSI C, 2=Java, 3=C++, 4=Pascal)
                    6: Submission Rank
                    */

                    var p = adapData.probs;
                    var outdated = false;
                    for (var i=0;i < subs.length; i++)
                    {
                        var cur = subs[i];
                        var idx = p.map[cur[1]]+'';
                        if (p[idx])
                            cur[1] = p[idx][1];
                        else
                        {
                            cur[1] = -1;
                            outdated = true;
                            // don't break
                        }

                        cur[2] = cls.getVerdict(cur[2]);
                        cur[5] = cls.getLang(cur[5]);
                    }

                    if (outdated && tries++ < 1) 
                    {
                        // retry
                        adapData.probs = null;
                        return fetchProbs(function(){
                            process(buf);
                        });
                    }

                    callback(null, subs);
                }

                return process;
            })());

            function callback05(e)
            {
                if (e) callback(e);
                else
                    fetchUserId(function(e2, userId){
                        if (e2) callback(e2);
                        else
                            util.createReq(
                                'GET', 
                                UHUNT_HOST, 
                                '/api/subs/'+userId, 
                                callback10).on('error', callback).end();
                    });
            }

            fetchProbs(callback05);
        };
    }

    cls.parseForm = function(formPat, html){
        var match = formPat.exec(html);
        if (! match) return null;

        var attribs = match[1];
        var contents = match[2];
        var atts = util.parseAttribs(attribs);
        var r = {contents: contents, data: {}};

        for (var key in atts)
        {
            if (key.toLowerCase() == 'action')
            {
                r.action = util.htmlDecodeSimple(atts[key]);
                break;
            }
        }

        while(match = INPUT_PATTERN.exec(contents))
        {
            atts = util.parseAttribs(match[1]);
            var value = null, name = null, isText = false;

            for (var key in atts)
            {
                var val = util.htmlDecodeSimple(atts[key]);
                var keyLower = key.toLowerCase();
                var valLower = val.toLowerCase();

                switch(keyLower)
                {
                case 'type':
                    isText = (valLower == 'password' || valLower == 'text');
                    break;
                case 'name':
                    name = val;
                    break;
                case 'value':
                    value = val;
                    break; 
                }
            }
            
            if (name !== null && isText)
            {
                var nameLower = name.toLowerCase();
                if (nameLower.indexOf("user") >= 0)
                    r.userField = name;
                else if (nameLower.indexOf("pass")>=0)
                    r.passField = name;
            }
            else if (value !== null && name !== null)
            {
                r.data[name] = value; 
            }
        }

        return r;
    };

    cls.getVerdict = function(ver)
    {
        switch(ver)
        {
        case 10: return "Subm Error";
        case 15: return "Can't queue";
        case 20: return "In queue";
        case 30: return "Compile Err";
        case 35: return "Restricted func";
        case 40: return "Runtime Err";
        case 45: return "output limit";
        case 50: return "time limit";
        case 60: return "mem limit";
        case 70: return "wrong ans";
        case 80: return "presentation";
        case 90: return "accepted";
        }

        return "?";
    };

    cls.getLang = function(id)
    {
        switch(id)
        {
        case 1: return "C";
        case 2: return "Java";
        case 3: return "C++";
        case 4: return "Pascal";
        }

        return "?";
    };

    return cls;
})(Adapter);
