const readline = require('readline');
const fs = require('fs');
const path = require('path');
const sprintf = require('sprintf').sprintf;
const util = require('./util');
const Account = require('./account');
const Adapter = require('./adapter');
const App = require('./app');

const SETTING_FILE_NAME = ".uva-node";
const SETTING_PATH = path.join(util.getUserHomePath(), SETTING_FILE_NAME);

var app = new App();

if (fs.existsSync(SETTING_PATH))
{
    app.load(SETTING_PATH);
}
else
{
    console.log('Setting file not found: %s', SETTING_PATH);
    console.log('A new one will be created after exiting the program');
}

rl = readline.createInterface(process.stdin, process.stdout);

rl.on('line', function(line) {
    var toks = line.trim().split(/\s+/g);
    var action = toks[0].toLowerCase();

    function checkToks(argsCount, syntax)
    {
        if (toks.length !== argsCount+1)
        {
            console.log('Syntax: %s', syntax);
            return false;
        }

        return true;
    }

    function prompt()
    {    
        console.log();
        rl.prompt();
    }

    function printStatus(subs)
    {
        console.log("Sub Id    | Prob # |      Verdict     |  Lang  | Runtime |  Rank |      Sub Time");
        //           123456789---123456---1234567890123456---123456---1234567---12345---yyyy-mm-dd hh:mm:ss

        var date = new Date();
        for (var i = 0; i < subs.length;i++)
        {
            var sub = subs[i];
            var subId = sub[0];
            var probId = sub[1];
            var verdict = sub[2];
            var runtime = sub[3];
            var time = sub[4]; // in millisec
            var lang = sub[5];
            var rank = sub[6];

            date.setTime(time);
            console.log(sprintf("%9d   %6d   %16s   %6s   %3d.%03d   %5s   %4d-%02d-%02d %02d:%02d:%02d", 
                subId, probId, verdict,
                lang, Math.floor(runtime/1000), runtime%1000,
                rank < 0 ? '-' : rank > 9999 ? '>9999' : rank,
                date.getFullYear(), date.getMonth()+1, date.getDate(),
                date.getHours(), date.getMinutes(), date.getSeconds()));
        }
    }

    function getCurrentAdapter()
    { 
        var curAdap = app.getCurrentAdapter();
        if (curAdap) return curAdap;

        console.log('No current account selected');
    }

    switch(action) 
    {
    case 'exit':
    case 'quit':
        app.save(SETTING_PATH);
        rl.close();
        break;

    case 'send':
        var curAdap = getCurrentAdapter();
        if (!curAdap) break;
        
        if (!checkToks(2, 'send <prob#> <fileName>')) break;

        try
        {
            console.log('Logging in...');
            curAdap.login(function(e){
                if (e)
                {
                    console.log('Login error: '+e.message);
                    prompt();
                    return;
                }

                console.log('Sending code...');
                curAdap.send(toks[1], toks[2], function(e){
                    if (e)
                        console.log('send failed: '+e.message);
                    else
                        console.log('Send ok');
                    prompt();
                });    
            });

            return;
        }
        catch (e)
        {
            console.log('Send error: '+e);
        }
        break;

    case 'use':
        if (toks.length === 3)
        {
            var ok = app.use(toks[1], toks[2]);
            if (ok)
                console.log('Account set as current');
            else
                console.log('No such account');
        }
        else if (toks.length === 1)
        {
            app.useNone();
            console.log('Current account set to none');
        }
        else
            checkToks(2, 'use <type> <userName> OR use');

        break;

    case 'add':
        if (! checkToks(3, 'add <type> <userName> <password>')) break;
        
        var normType = Adapter.normalizeType(toks[1]);
        if (!normType)
        {
            console.log('invalid type');
            break;
        }

        var acct = new Account({type: toks[1], user: toks[2], pass: toks[3]});

        var ok = app.add(acct);
        if (!ok)
            console.log('Error: trying to replace current account with new one');
        else
            console.log('Account added successfully');
        
        break;

    case 'remove':
        if (!checkToks(2, 'remove <type> <userName>')) break;

        var cur = app.getCurrent();
        if (cur && cur.match(toks[1], toks[2]))
        {
            console.log('Account is current. Cannot remove');
            break;
        }

        var ok = app.remove(toks[1], toks[2]);
        if (ok)
            console.log('Account removed');
        else
            console.log('No such account');

        break;

    case 'show':
        var accts = app.getAll();
        
        console.log('      type     | user');
        //           12345678901234---1234

        for (var i=0;i < accts.length; i++)
        {
            console.log(sprintf("%-14s   %s", accts[i].type(), accts[i].user()));
        }

        break;

    case 'stat':
    case 'status':
        var curAdap = getCurrentAdapter();
        if (!curAdap) break;
        
        var num = 10;
        if (toks.length == 2) 
        {
            num = parseInt(toks[1]);
            if (num <= 0 || isNaN(num))
            {
                console.log('must be positive integer');
                break;
            }
        }
        else if (toks.length != 1)
        {
            console.log('Syntax: stat/status <count>');
            break;
        }

        console.log('Getting status...');
        curAdap.fetchStatus(num, function(e, subs){
            if (e)
                console.log('Status error: '+e.message);
            else
                printStatus(subs);
            prompt();
        });

        return;

    default:
        console.log('Unrecognized action');
        break;
    }

    prompt();

}).on('close', function() {
    console.log('Have a great day!');
    process.exit(0);
});

rl.setPrompt('> ');
rl.prompt();

