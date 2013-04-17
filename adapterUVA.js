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
    function cls(_acct)
    {
        // super constructor call
        parentCls.call(this, _acct);

        // private instance fields
        var acct = this.account();
        var userId = -1;
        var cookies = '';

        // private instance method
        function fetchUserId(callback)
        {
            userId > 0 ? 
                callback(userId) : 
                util.createReq(
                    'GET', 
                    UHUNT_HOST, 
                    '/api/uname2uid/'+acct.user(),
                    new (function(){
                        var buf = '';
                        return function(inMsg){
                            inMsg.setEncoding('utf8');
                            inMsg.on('end', function(){
                                callback(userId = parseInt(buf));
                            });
                            inMsg.on('readable', function(){
                                buf += inMsg.read() || '';
                            });
                        };
                    })()
                ).end();
        };

        // public instance method
        this.login = function(callback){
            function callback2(inMsg)
            {
                inMsg.setEncoding('utf8');
                inMsg.on('readable', function(){inMsg.read();});
                inMsg.on('end', function(){
                    cookies = util.getCookies(inMsg);
                    callback();
                });
            }

            var callback1 = new (function(){
                var html = '';
                return function(inMsg){
                    inMsg.setEncoding('utf8');
                    inMsg.on('end', function(){
                        var f = cls.parseForm(LOGIN_FORM_PATTERN, html);
                        if (!f)
                            throw ("cannot find HTML form");
                        if (!f.userField)
                            throw ("cannot find user field");
                        if (!f.passField)
                            throw ("cannot find pass field");
                        if (!f.action)
                            throw ("cannot find action");

                        var cookies = util.getCookies(inMsg);
                        f.data[f.userField] = acct.user();
                        f.data[f.passField] = acct.pass();

                        var req = util.createReq(
                                'POST', UVA_HOST, f.action, callback2
                            );
                        req.setHeader('Cookie', cookies);
                        util.writePostData(req, f.data);
                    });
                    inMsg.on('readable', function(){
                        html += inMsg.read() || '';
                    });
                };
            })();

            util.createReq('GET', UVA_HOST, '/', callback1).end();
        };

        this._send = function(probId, filePath, lang){
            // TODO
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



/*
    @Override
   
    @Override
    protected void send(String probId, Lang lang, File  contents)
        throws IOException
    {
        HttpURLConnection conn = Util.createConnection(
                SUBMIT_PAGE_URL, false
            );

        conn.setRequestProperty("Cookie", this.cookies);
        Util.readAll(conn);

        conn = Util.createConnection(
                SUBMIT_URL, false
            );

        conn.setRequestProperty("Referer", SUBMIT_PAGE_URL.toString());
        conn.setRequestProperty("Cookie", this.cookies);

        String langVal = null;

        if (lang.equals(Lang.C)) langVal = "1";
        else if (lang.equals(Lang.JAVA)) langVal = "2";
        else if (lang.equals(Lang.CPP)) langVal = "3";
        else if (lang.equals(Lang.PASCAL)) langVal = "4";
        else throw new RuntimeException("unacceptable programming lang");

        Map<String,Object> data = new HashMap<String,Object>();        
        data.put("localid", probId);
        data.put("code", "");
        data.put("language", langVal);
        data.put("codeupl", contents);
        data.put("problemid", "");
        data.put("category", "");

        // Because UVA will redirect 
        conn.setInstanceFollowRedirects(false);
        
        Util.writeFormData(conn, data);
        Util.readAll(conn);

    }


    @Override
    public void printStatus()
        throws Exception
    {
        final int userId = this.fetchUserId();

        HttpURLConnection conn = Util.createConnection(
                new URL("http://uhunt.felix-halim.net/api/subs/"+userId), false
            );

        String all  = Util.readAll(conn);
        JSONObject obj = new JSONObject(all);
        Object subStr = obj.get("subs");
        JSONArray subs = null;
        if (subStr instanceof String)
        {
            String str = (String) subStr;
            subs = new JSONArray(str);
        }
        else
        {
            subs = (JSONArray) subStr;
        }

        int len = subs.length();

        List<JSONArray> list = new ArrayList<JSONArray>();
        for (int i = 0; i < len;i++)
        {
            list.add(subs.getJSONArray(i));            
        }

        // sort by subm id. Latest will be at 0th elem.
        Collections.sort(list, new Comparator<JSONArray>(){
            @Override
            public int compare(JSONArray a1, JSONArray a2)
            {
                try
                {
                    long k = a2.getLong(0) - a1.getLong(0);
                    if (k < 0) return -1;
                    if (k > 0) return 1;
                    return 0;
                }
                catch(Exception e)
                {
                    // omg so fcking annoying with exceptions.
                    throw new RuntimeException(e);
                }
            }
        });

        System.out.println("SubId     | ProbId |      Verdict     |  Lang  | Runtime | ");
        //                  123456789---123456---1234567890123456---123456---1234567---

        int iterLen = Math.min(10, list.size());
        for (int i = 0; i < iterLen;i++)
        {
            JSONArray sub = list.get(i);

            /*
            Format:
            Submission ID
            Problem ID
            Verdict ID
            Runtime
            Submission Time (unix timestamp)
            Language ID (1=ANSI C, 2=Java, 3=C++, 4=Pascal)
            Submission Rank
            

            long subId = sub.getInt(0);
            int probId = sub.getInt(1);
            int verdictId = sub.getInt(2);
            int runtime = sub.getInt(3);
            long time = sub.getLong(4);
            int langId = sub.getInt(5);
            int rank = sub.getInt(6);

            System.out.format("% 9d   % 6d   %16s   %6s   % 3d.%03d\n", 
                subId, probId, getVerdict(verdictId),
                getLang(langId), runtime/1000, runtime%1000);
        }
    }
}
*/