Command line tool for the UVa Online Judge website

UVA-NODE is an interactive shell where you can type commands to submit
and check your submissions.

Features
========
- Remembers your account info and encrypts your passwords.
- Password-less submissions.
- Checks most recent submission status.
- Template Support! *new*
- Cross-platform: Linux, Mac OS X, Windows or whatever node.js runs on

Sample session for using templates:
<pre>
> tpl add path/to/template.cpp

> tpl show
lang     | file path
C++        path/to/template.cpp

> set-editor vim

> edit problem-123.cpp

.... launch vim ....

Edit done
</pre>

Sample session for submitting code:
<pre>
> add uva john.doe my-secret-password
Account added

> use uva john.doe

> send 123 problem-123.cpp
Logging in...
Sending code...
Sent OK

> stat
Getting status...
Sub Id    | Prob # |      Verdict     |  Lang  | Runtime |  Rank |      Sub Time
 11638387      123           accepted      C++     0.008     519   2013-04-20 13:35:04
 11629565      123           accepted      C++     0.016     900   2013-04-19 00:16:01
...
</pre>

Requirements
============
To run, you'd need node.js v0.10.0 and above. An older version might work
although it has been tested only with v0.10.0

To check your node.js version, do `node --version` at the command line.

Running
=======
3 simple steps! No building required!

1.  Install node.js if you haven't: http://nodejs.org
2. `git clone https://github.com/lucastan/uva-node.git` (recommended) 
    or download the source https://github.com/lucastan/uva-node/archive/master.zip
3.  `node uva-node`

The program will generate a settings file and a random key the first 
time it is run, and will use the key to encrypt all your account passwords.
The key is stored at `~/.ssh/uva-node.key`. You don't have to generate 
an SSH key nor will the program use your SSH key.

Settings are saved in the JSON format at `~/.uva-node`
where ~ is your home directory. Please do not modify manually.

To upgrade to the latest version, simply do `git pull` in the uva-node dir!

There is an older version (uva-cli) written in Java at uva-cli.git, 
but only this node.js version will be actively maintained. 

Usage
=====
UVA-NODE is an interactive shell in which you can type commands.
Commands are of the syntax: `<action> <arg1> <arg2> ...`

The program will auto-detect language based on file name extension in many cases:

| Ext.        | Lang |
| ---         | ---  |
| .java       | Java |
| .cpp / .cc  | C++  |
| .c          | C    |
| .pascal / .pas / .p |  Pascal |

The following are possible actions:

tpl
---
Syntax: 
- tpl add {filePath} 
- tpl remove {lang}
- tpl show

tpl add {filePath}: 
- Adds or replaces an existing template. The program will merely store the file path,
and will *not* copy the template file to another place.
- Recommended that filePath is absolute, instead of relative, to avoid path issues,
  and make it independent of where you launch the editor.
- Will detect language based on file extension.
- The file must be in the UTF-8 or ASCII encoding. If you use pure English, you're fine, don't worry about it :)
- Put the string `$caret_start$` in the template file at where you want to start typing the code.   

tpl remove {lang}: 
- Removes the template setting but will *not* delete the template file.
- {lang} is cpp / c / java / pascal / pas / p.

tpl show: 
- Shows all template settings.

set-editor
----------
Syntax: set-editor {path to editor}

Sets editor command. Usually `vim` or `vi`. Actually any editor will do.
Try experimenting on your own. Only `vi` / `vim` is tested with.

If the command is relative, it must exist on the $PATH environment variable.


edit
----
Syntax: edit {srcFilePath}

Creates {srcFilePath} using an existing template if {srcFilePath} does *not* exist,
and launches the editor.

Otherwise, if {srcFilePath} exists, launch the editor only.

add
----
Syntax: add {type} {username} {password}

Adds a new user account, or replace an existing one 
with the same type and username. The replacing behavior is useful for updating
password.

All accounts will be preserved even after you quit the program.

Currently uva is the only supported type.

remove
------
Syntax: remove {type} {username}

Removes a user account. You cannot remove an account that is set as current.

use
---
Syntax: use {type} {username} OR use

Sets a user account as current.
If both {type} and {username} are omitted, sets the current account to none.
The current account setting will be preserved even after you quit the program.

show
----
Syntax: show 

Shows all user accounts

send
----
Syntax: send {problem #} {fileName}

Sends a code file using the current account. 
{fileName} is relative to the current directory, which
is where you ran the `node ...` command to start uva-node

The program will auto-detect the language using the file name extension.

status / stat
-------------
Syntax: status/stat {count}

Prints out the latest {count} submissions for the current account.
{count} defaults to 10 if omitted.

quit / exit
-----------
Saves all settings including account info and exits the program.

More features coming soon
==========================
- Log in only once instead of logging in on every send
- Supports more coding websites
- Auto-retry submitting the solution (when UVA is down)
- Connects to UVAtoolkit
- Get statistics on a problem

Credits
=======
- UVA website
- uHunt API
- node.js

License
=======
I have yet to decide on a license to apply to the source code.
Meanwhile, I reserve all copyrights.


Please let me know if there is any problem!

