// - The Autonomous Terminal emulator. -
// JavaScript player for simple autonomous
// text terminal interaction language.
// Copyright 2003,2010 Øyvind Stegard.

// Works only with elements supporting pre-formatted text.
function AutoTerm(element) {
    if (!element) return null;
    this.elem = element;

    // Take over element contents
    if (this.elem.hasChildNodes()) {
        while (this.elem.childNodes.length > 0) {
            this.elem.removeChild(this.elem.firstChild);
        }
    }

    // Set up main contents text node
    this.text = this.elem.ownerDocument.createTextNode('');
    this.elem.appendChild(this.text);

    // Set up a blinking cursor text node
    this.cursorText = this.elem.ownerDocument.createTextNode('|');
    this.elem.appendChild(this.cursorText);

    // Set up "thought bubble" text node
    var bubbleSpan = this.elem.ownerDocument.createElement('span');
    bubbleSpan.setAttribute('class', 'bubble');
    this.bubbleText = this.elem.ownerDocument.createTextNode('');
    this.elem.appendChild(bubbleSpan);
    bubbleSpan.appendChild(this.bubbleText);

    // Execute command script in string arg 'commands'
    this.exec = function(commands, prompt, pause) {
        // Should probably tokenize input script into array, but .. couldn't be bothered.
        this.commands = commands;
        this.prompt = prompt;
        this.pause = pause;
        this.typingSpeed = 50;

        if (this.contentEndsWithPrompt(this.prompt)
            && this.commands.indexOf('^P') == 0) {
            this.commands = this.commands.substring(2);
        }

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.stopCursorBlink();
        this.busy = true;
        this.process(true);
    }

    // Clears terminal contents and aborts any ongoing execution.
    this.clear = function() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.startCursorBlink();
        this.text.nodeValue = '';
        this.busy = false;
    }

    // Returns number of lines in current terminal contents
    this.lines = function() {
        return this.text.nodeValue.replace(/[^\n]/g, '').length;
    }

    // Internal
    this.process = function(init) {
        if (init) {
            this.cursor = 0;
            this.result = false;
        }
        
        var cmd = this.commands;

        while (this.cursor < cmd.length) {
            if (this.result) {
                var end = cmd.indexOf('^', this.cursor);
                if (end == -1) end = cmd.length;
                this.put(cmd.substring(this.cursor, end));
                
                if (end < cmd.length - 1) {
                    var cmdChar = cmd.charAt(end+1);
                    if (cmdChar == 'Z') {
                        // Handle in-result ^Z random sleeping (shorter timeouts)
                        this.cursor = end + 2; this.result = true;
                        return this.timeout(150, 100);
                    }
                    
                    if (cmdChar == 'L') {
                        // Handle in-result clear screen
                        this.clearScreenInstruction();
                        this.cursor = end + 2; this.result = true;
                        continue;
                    }
                }

                this.cursor = end; this.result = false;
                return this.timeout(100, 0);
            } else {
                if (cmd.charAt(this.cursor) == '^' && this.cursor < cmd.length - 1) {
                    switch (cmd.charAt(this.cursor + 1)) {
                    case '\n':
                        // Result instruction
                        this.put('\n');
                        this.cursor += 2; this.result = true;
                        return this.timeout(500, 200);

                    case 'P':
                        // Prompt instruction
                        this.put(this.prompt);
                        this.cursor += 2; this.result = false;
                        continue;
                        
                    case 'B':
                        // Backspace instruction
                        this.backspaceInstruction(1);
                        this.cursor += 2; this.result = false;
                        return this.timeout(0, 100);
                        
                    case 'L':
                        // Clear screen instruction
                        this.clearScreenInstruction();
                        this.cursor += 2; this.result = false;
                        continue;

                    case 'T':
                        // Thought bubble instruction
                        this.cursor = this.bubbleInstruction(cmd, this.cursor);
                        this.result = false;
                        continue;

                    case 'S':
                        // Set typing speed instruction
                        if (this.cursor < cmd.length - 2) {
                            var num = parseInt(cmd.charAt(this.cursor + 2), 10);
                            if (num == NaN) {
                                this.cursor += 2; this.result = false;
                                continue;
                            }
                            if (num == 9)
                                this.typingSpeed = 0; // max speed
                            else this.typingSpeed = 100 - (num*10);
                                
                            this.cursor += 3; this.result = false;
                            continue
                        } else {
                            this.cursor += 2; this.result = false;
                            continue;
                        }
                        
                    case 'N':
                        // No-op instruction.
                        this.cursor += 2; this.result = false;
                        continue;
                        
                    case 'Z':
                        // Random nap time instruction
                        this.cursor += 2; this.result = false;
                        return this.timeout(2000, 300);

                    case '^':
                        ++this.cursor;
                        
                    default:
                    }
                }
                
                this.put(cmd.charAt(this.cursor));
                this.cursor += 1; this.result = false;
                return this.ttimeout();
            }
        }

        // Finished processing
        this.startCursorBlink();

        // Check for final pause after processing.
        if (this.pause && this.pause > 0) {
            var pause = this.pause;
            this.pause = null;
            return this.timeout(0, pause);
        }

        this.busy = false;
        return false;
    }
    
    // Internal
    this.timeout = function(rwait, cwait) {
        var self = this;
        var tmout = Math.floor(Math.random()*rwait) + cwait;
        this.timer = setTimeout(function() { self.process(false); }, tmout);
        return true;
    }

    // Internal
    this.ttimeout = function() {
        var typeTimeout = Math.random()*(this.typingSpeed + 80) + this.typingSpeed;
        var seed = Math.random();
        if (seed <= 0.10) typeTimeout *= 1.50;
        if (seed > 0.10 && seed <= 0.15) typeTimeout *= 0.70;
        if (typeTimeout < 0) typeTimeout = 10;
        else typeTimeout = Math.floor(typeTimeout);

        return this.timeout(0, typeTimeout);
    }

    // Internal
    this.put = function(str) {
        this.text.nodeValue += str;
    }

    // Internal
    this.clearScreenInstruction = function() {
        this.text.nodeValue = '';
        this.clearBubble();
    }

    // Internal
    this.backspaceInstruction = function(n) {
        if (n > this.text.nodeValue.length) {
            this.text.nodeValue = '';
        } else {
            this.text.nodeValue = this.text.nodeValue.substring(0, this.text.nodeValue.length - n);
        }
    }

    // Internal
    this.bubbleInstruction = function(cmd, cursor) {
        var end = cmd.indexOf('^', cursor + 2);
        if (end == -1) end = cmd.length;
        if (cmd.charAt(end-1) == '\n')
            this.setBubble(cmd.substring(cursor + 2, end-1), 5000);
        else
            this.setBubble(cmd.substring(cursor + 2, end), 5000);

        return end;
    }

    // Internal
    this.setBubble = function(text, timeout) {
        this.bubbleText.nodeValue = '\t\t\t . o O (( ' + text + ' ))';
        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
        var self = this;
        this.bubbleTimeout = setTimeout(function() { self.clearBubble(); }, timeout);
    }

    // Internal
    this.clearBubble = function() {
        this.bubbleText.nodeValue = '';
        if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
    }

    // Internal
    this.contentEndsWithPrompt = function(prompt) {
        var last = this.text.nodeValue.lastIndexOf(prompt);
        return (last != -1) && (last + prompt.length == this.text.nodeValue.length);
    }

    // Internal
    this.startCursorBlink = function() {
        if (this.cursorBlinkTimer) return false;
        var self = this;
        this.cursorBlinkTimer = setInterval(function() { self.toggleCursor(); }, 1000);
        return true;
    }

    // Internal
    this.stopCursorBlink = function() {
        if (! this.cursorBlinkTimer) return false;
        clearInterval(this.cursorBlinkTimer);
        this.cursorBlinkTimer = null;
        this.cursorText.nodeValue = '|';
        return true;
    }

    // Internal
    this.toggleCursor = function() {
        this.cursorText.nodeValue = (this.cursorText.nodeValue != '|') ? '|' : ' ';
    }

    // Start blinking cursor at end of terminal object construction
    this.startCursorBlink();

} // ctor AutoTerm
