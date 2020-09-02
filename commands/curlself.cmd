#!/bin/sh
printf '^Pcurl --head https://stegard.net/autoterm/^\n'
/usr/bin/curl --head 'https://stegard.net/autoterm/' 2>/dev/null | tr -d '\r'
printf '^P^Z^TOh good, we are up.'
