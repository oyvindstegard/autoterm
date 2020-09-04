#!/bin/sh
spooktext=`emacs -Q --batch --eval '(with-temp-buffer (spook)(spook)(spook)(princ (buffer-string)))' 2>/dev/null|tail -n8`
printf '^Pspook; spook; spook^\n'
printf '%s\n' "$spooktext"
printf '^P'
