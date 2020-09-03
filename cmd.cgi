#!/bin/sh
printf 'Content-Type: text/plain; charset=utf-8\r\n'
printf '\r\n'

print_command_exit() {
    if [ -x "$1" ]; then
        exec "$1"
    else
        exec cat "$1"
    fi
}

print_random_command_exit() {
    local cmd
    cmd=`/bin/ls commands/*.cmd 2>/dev/null | /usr/bin/sort -R | /usr/bin/head -n1`
    [ -z "$cmd" ] && exit 1
    print_command_exit "$cmd"
}


cmdparam="${QUERY_STRING%%&*}"
if echo "$cmdparam"|/bin/grep -Eq '^[a-zA-Z0-9_-]+$'; then
    if [ -f "commands/${cmdparam}.cmd" ]; then
        print_command_exit "commands/${cmdparam}.cmd"
    fi
fi

print_random_command_exit
