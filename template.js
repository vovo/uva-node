const fs = require('fs');
const path = require('path');
const util = require('./util');

const CARET_START = /\$caret_start\$/i;

module.exports = (function(){

    // tpl add <fileName>
    // tpl remove <lang>
    // tpl show

    var app;
    var tpls;

    function cls(_app, _tpls)
    {
        app = _app;
        tpls = _tpls;

        /**
         * Adds or replaces an existing template.
         * @param filePath The caller must check whether the path exists.
         * @return boolean whether ok.
         */
        this.add = function(filePath){
            var fileExt = util.getFileExt(filePath);
            var lang = util.getLang(fileExt.toLowerCase());
            if (lang < 0)
                return false;

            // check whether exists until we have to open the file
            tpls[lang+''] = filePath;
            return true;
        };

        /**
         * @param lang LANG_* constant
         */
        this.remove = function(lang){
            tpls[lang+''] = null; 
        };

        this.getAll = function(){
            return tpls;
        };

        this.spawn = function(lang, destFilePath){
            var contents = '';
            var srcFilePath = tpls[lang+''];
            if (srcFilePath)
            {
                contents = fs.readFileSync(srcFilePath, {encoding: 'utf8'});    
            }

            var opts = {
                encoding: 'utf8',  
                mode: 0666,        // all R/W 
                flag: 'w'          // create if not exist, truncate otherwise
            };

            var lineNum = 1;
            var writer = fs.createWriteStream(destFilePath, opts);
            var lines = contents.split(/\r\n|\n|\r/g);
            for (var i=0;i < lines.length; i++)
            {
                var line = lines[i];
                if (lineNum === 1 && CARET_START.test(line))
                {
                    lineNum = i+1;
                    writer.write('', 'ascii');
                }
                else
                {
                    writer.write(line, 'utf8');
                }

                writer.write('\n', 'ascii');
            }

            writer.end();

            return {lineNum: lineNum};
        };
    }

    return cls;
})();