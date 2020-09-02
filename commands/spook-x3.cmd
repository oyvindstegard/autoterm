#!/bin/sh
spooktext1=`/usr/local/bin/emacs -Q --batch --eval '(with-temp-buffer (spook)(princ (buffer-string)))' 2>/dev/null|tail -n2`
spooktext2=`/usr/local/bin/emacs -Q --batch --eval '(with-temp-buffer (spook)(princ (buffer-string)))' 2>/dev/null|tail -n2`
spooktext3=`/usr/local/bin/emacs -Q --batch --eval '(with-temp-buffer (spook)(princ (buffer-string)))' 2>/dev/null|tail -n2`
printf '^Pspook; spook; spook^\n'
printf '%s\n%s\n%s\n' "$spooktext1" "$spooktext2" "$spooktext3"
printf '^P'
