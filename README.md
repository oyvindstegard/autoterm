# The Autonomous Terminal - Commands of wisdom and nonsense

A JavaScript webapp of a terminal emulator that runs on its own. It prints
things, and pretends it is something special. Which it isn't. Sometimes it is
funny. There is a user involved as well, but we do not know its identity, maybe
it is the terminal itself.

## About the app

A terminal emulator is rendered inside an HTML `pre` tag. It executes "scripts"
of terminal commands which emulate typing, results and thought bubbles. Those
are located in the `commands/` subdirectory, selected by random at a regular
interval. Some of the scripts execute actual commands on the web server it is
running on, if the script file is executable. (This may be a bad idea, but
produces dynamic output.) Which is why Linux is required, and the commands
themselves require other Linux commands to be installed. You'll need to figure
out the rest for yourself. And take responsibility for the security of your own
web.

## About the code

The code was written *many years ago* and is old in style, but should work in most
browsies.

## Requirements

Requires Apache running on a Linux server. And some commands available at common
paths. And CGI script support. Yeah, did I mention, it is old.
