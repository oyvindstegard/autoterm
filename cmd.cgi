#!/bin/sh
printf 'Content-Type: text/plain; charset=utf-8\r\n'
printf '\r\n'

print_fortune() {
    printf '^Pfortune^\n'
    /usr/games/fortune
    printf '^P'
}

print_random_command() {
    local cmd
    cmd=`/bin/ls commands/*.cmd 2>/dev/null | /usr/bin/sort -R | /usr/bin/head -n1`
    [ -z "$cmd" ] && return 1

    if [ -x "$cmd" ]; then
        $cmd
    else
        cat $cmd
    fi
}

case $QUERY_STRING in
    *fortune*)
        print_fortune ;;
    *)
        print_random_command ;;
esac

# cmd=commands/manyou.cmd
# if [ -x "$cmd" ]; then
#     $cmd
# else
#     cat $cmd
# fi

exit 0
