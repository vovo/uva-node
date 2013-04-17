const readline = require('readline');
const fs = require('fs');
const path = require('path');
const util = require('./util');
const Account = require('./account');
const Adapter = require('./adapter');

const SETTING_FILE_NAME = ".uva-cli";
const SETTING_PATH = path.join(util.getUserHomePath(), SETTING_FILE_NAME);

function load(filePath)
{
    if (! fs.existsSync(filePath))
    {
        console.log('Setting file not found: '+filePath);
        console.log('A new one will be created after exiting the program');
        return null;
    }

    var contents;
    try
    {
        contents = fs.readFileSync(filePath, {encoding: 'utf8'});
    }
    catch (e)
    {
        console.log('Error reading setting file: '+filePath);
        return null;
    }

    return JSON.parse(contents);
}

function save(filePath, obj)
{
    var opts = {encoding: 'utf8', mode: 0600};
    fs.writeFileSync(filePath, JSON.stringify(obj), opts);
}

var settings = load(SETTING_PATH);
if (!settings)
    settings = {};

rl = readline.createInterface(process.stdin, process.stdout);

rl.on('line', function(line) {
    var toks = line.split(/\s+/g);
    var action = toks[0].toLowerCase();

    switch(action) 
    {
    case 'exit':
    case 'quit':
        save(SETTING_PATH, settings);
        rl.close();
        break;

    case 'send':

        break;

    case 'use':

        break;


    case 'add':


        break;

    case 'remove':

        break;

    case 'stat':
    case 'status':

        break;

    default:
        console.log('Unrecognized action');
        break;
    }

    console.log();
    rl.prompt();

}).on('close', function() {
    console.log('Have a great day!');
    process.exit(0);
});

rl.setPrompt('> ');
rl.prompt();

