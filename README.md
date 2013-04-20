Command line tool for the UVa Online Judge website

UVA-NODE is an interactive shell where you can type commands to submit
and check your submissions.

Features
========
- Remembers your account info and encrypts your passwords.
- Password-less submission.
- Check most recent submission status.

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
    or download the source.
3.  `node uva-node`

The program will generate a settings file and a random key the first 
time it is run, and will use the key to encrypt all your account passwords.
The key is stored at `~/.ssh/uva-node.key`. You don't have to generate 
an SSH key nor will the program use your SSH key.

To upgrade to the latest version, simply do `git pull` in the uva-node dir!

There is an older version (uva-cli) written in Java at uva-cli.git, 
but only this node.js version will be actively maintained. 

Usage
=====
UVA-NODE is an interactive shell which you can type commands.
Commands are of the syntax: `<action> <arg1> <arg2> ...`

Settings are saved in the JSON format at `~/.uva-node`
where ~ is your home directory. Please do not modify manually.
All passwords are encrypted.

The following are possible actions:

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

The program will auto-detect the language using the file name extension:
- .java  : Java
- .cpp   : C++
- .c     : C
- .pascal / .pas / .p : Pascal 

status / stat
-------------
Syntax: status/stat {count}

Prints out the latest {count} submissions for the current account.
{count} defaults to 10 if omitted.

quit / exit
-----------
Saves all settings including account info and exits the program.

Example usage
=============
<pre>
> add uva john_doe 12345
Account added

> use uva john_doe

> send 123 code.cpp
Logging in...
Sending code...
Sent OK

> status
Getting status...
SubId     | ProbId |      Verdict     |  Lang  | Runtime | 
11605207      757           accepted      C++     0.020
11605200      757           accepted      C++     0.024
...
</pre>


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

Disclaimer
==========
While every effort has been made to ensure this software is free of defects, 
this software comes with ABSOLUTELY NO WARRANTY to the maximum extent 
permitted by the law.

License
=======
I have yet to decide on a license to apply to the source code.
Meanwhile, I reserve all copyrights.


Please let me know if there is any problem!

