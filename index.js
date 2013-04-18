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
        if (toks.length != argsCount+1)
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
        console.log("SubId     | Prob # |      Verdict     |  Lang  | Runtime | ");
        //           123456789---123456---1234567890123456---123456---1234567---

        var iterLen = Math.min(10, subs.length);
        for (var i = 0; i < iterLen;i++)
        {
            var sub = subs[i];
            var subId = sub[0];
            var probId = sub[1];
            var verdict = sub[2];
            var runtime = sub[3];
            var time = sub[4];
            var lang = sub[5];
            var rank = sub[6];

            console.log(sprintf("%9d   %6d   %16s   %6s   %3d.%03d", 
                subId, probId, verdict,
                lang, Math.floor(runtime/1000), runtime%1000));
        }
    }

    switch(action) 
    {
    case 'exit':
    case 'quit':
        app.save(SETTING_PATH);
        rl.close();
        break;

    case 'send':
        if (!checkToks(2, 'send <prob#> <fileName>')) break;

        try
        {
            console.log('Logging in...');
            var ok = app.login(function(e){
                if (e)
                {
                    console.log('Login error: '+e.message);
                    return prompt();
                }

                console.log('Sending code...');
                app.send(toks[1], toks[2], function(e){
                    if (e)
                        console.log('send failed: '+e.message);
                    else
                        console.log('Send ok');
                    prompt();
                });    
            });

            if (ok) return;
            else console.log('No current account selected');
        }
        catch (e)
        {
            console.log('Send error: '+e);
        }
        break;

    case 'use':
        if (toks.length == 3)
        {
            var ok = app.use(toks[1], toks[2]);
            if (ok)
                console.log('Account set as current');
            else
                console.log('No such account');
        }
        else if (toks.length == 1)
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
            console.log('Account is current');
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
        console.log('Getting status...');
        var ok = app.fetchStatus(function(e, subs){
            if (e)
                console.log('Status error: '+e.message);
            else
                printStatus(subs);
            prompt();
        });

        if (ok) return;

        console.log('No current account selected');
        break;

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

