#!/bin/sh
spooktext=`emacs -Q --batch --eval '(with-temp-buffer (spook)(princ (buffer-string)))' 2>/dev/null|tail -n2`
printf '^Pspook^\n'
printf '%s\n' "$spooktext"
printf '^P'
