// - The Autonomous Terminal emulator. -
// JavaScript player for simple autonomous
// text terminal interaction language.
// Copyright 2003,2010,2020 Øyvind Stegard.

'use strict';

/* Autoterm script tokenizer */
function Token(text) {
    this.text = text;
}
Token.prototype.toString = function() { return 'Token{'+this.text+'}'; }

function IToken(text) {
    Token.call(this, text);
    this.instruction = text.charAt(1);
}
IToken.prototype = Object.create(Token.prototype);
IToken.prototype.toString = function() { return 'IToken{'+this.instruction+'}'; }
IToken.prototype.constructor = IToken;

function tokenize(s) {

    const nodes = [];
    
    var i = 0;
    while (i < s.length) {
        if (s.charAt(i) === '^') {
            if (s.charAt(i+1)) {
                nodes.push(new IToken(s.substring(i,i+2)));
                switch (s.charAt(i+1)) {
                    // Some instructions have a one char operand which must be its own token.
                case 'W':
                case 'S':
                    nodes.push(new Token(s.substring(i+2,i+3)));
                    i += 3;
                    break;
                default:
                    i += 2;
                }
            } else {
                i += 1;
            }
        } else {
            var n = s.indexOf('^', i);
            if (n === -1) {
                n = s.length;
            }
            var text = s.substring(i,n);
            if (text) {
                nodes.push(new Token(text));
            }
            i = n;
        }
    }

    return nodes;
}

/* Autoterm object: Requires an element to render inside. */
function AutoTerm(element) {
    if (!element) return null;
    this.elem = element;

    const self = this;

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
    this.exec = function(autotermScript, prompt, pause) {

        this.tokens = tokenize(autotermScript);
        this.prompt = prompt;
        this.pause = pause;
        this.typingSpeed = 50;

        if (contentEndsWithPrompt(this.prompt)
            && this.tokens[0] && this.tokens[0].text.indexOf('^P') === 0) {
            this.tokens.shift();
        }

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.busy = true;
        processUsingTokens(true);
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

    const setTypingSpeedInstruction = function(operand) {
        var num = parseInt(operand, 10);
        if (isNaN(num)) {
            return false;
        }
        self.typingSpeed = (num == 9) ? 0 : 100 - (num*10);
        return true;
    }

    const typeOut = function(text, index) {
        if (index === undefined) {
            index = 0;
        }
        var typeTimeout = Math.random()*(self.typingSpeed + 80) + self.typingSpeed;
        var seed = Math.random();
        if (seed <= 0.10) typeTimeout *= 1.50;
        if (seed > 0.10 && seed <= 0.15) typeTimeout *= 0.70;
        if (typeTimeout < 0) typeTimeout = 10;
        else typeTimeout = Math.floor(typeTimeout);

        if (text.charAt(index)) {
            put(text.charAt(index));
            return timeout(0, typeTimeout, function() { typeOut(text, index+1) });
        } else {
            return timeout(0, typeTimeout);
        }
    }

    const timeout = function(rwait, cwait, callbackFn) {
        const tmout = Math.floor(Math.random()*rwait) + cwait;
        const callback = callbackFn ? callbackFn : function() { processUsingTokens(false); };
        self.timer = setTimeout(callback, tmout);
        return true;
    }
        
    const startCursorBlink = function() {
        if (self.cursorBlinkTimer) return false;
        self.cursorBlinkTimer = setInterval(toggleCursor, 1000);
        return true;
    }

    const stopCursorBlink = function() {
        if (! self.cursorBlinkTimer) return false;
        clearInterval(self.cursorBlinkTimer);
        self.cursorBlinkTimer = null;
        self.cursorText.nodeValue = '|';
        return true;
    }

    const toggleCursor = function() {
        self.cursorText.nodeValue = (self.cursorText.nodeValue != '|') ? '|' : ' ';
    }

    // Internal
    const put = function(str) {
        stopCursorBlink();
        self.text.nodeValue += str;
        startCursorBlink();
    }

    // Internal
    const setBubble = function(text, timeout) {
        if (self.bubbleTimeout) clearTimeout(self.bubbleTimeout);
        text = text.replace(/(?:\r\n|\r|\n)/g, '');
        self.bubbleText.nodeValue = '\t\t\t . o O (( ' + text + ' ))';
        self.bubbleTimeout = setTimeout(clearBubble, timeout);
    }

    const clearBubble = function() {
        self.bubbleText.nodeValue = '';
        clearTimeout(self.bubbleTimeout);
    }

    // Internal
    const contentEndsWithPrompt = function(prompt) {
        var last = self.text.nodeValue.lastIndexOf(prompt);
        return (last != -1) && (last + prompt.length == self.text.nodeValue.length);
    }
    
    // Internal
    const clearScreenInstruction = function() {
        self.text.nodeValue = '';
        clearBubble();
    }

    // Internal
    const backspaceInstruction = function(n) {
        if (n > self.text.nodeValue.length) {
            self.text.nodeValue = '';
        } else {
            self.text.nodeValue = self.text.nodeValue.substring(0, self.text.nodeValue.length - n);
        }
    }
    
    const processUsingTokens = function(init) {
        if (init) {
            self.result = false;
            self.busy = true;
        }

        var token;
        while ((token = self.tokens.shift())) {
            if (token instanceof IToken) {
                switch (token.instruction) {
                case '\n':  // Result instruction
                    put('\n');
                    self.result = true;
                    return timeout(500, 200);

                case 'P':   // Prompt instruction
                    put(self.prompt);
                    self.result = false;
                    continue;

                case 'B':   // Backspace instruction
                    backspaceInstruction(1);
                    self.result = false;
                    return timeout(5, 100);

                case 'T':   // Thought bubble instruction
                    if (self.tokens[0] && ! (self.tokens[0] instanceof IToken)) {
                        setBubble(self.tokens.shift().text, 5000);
                    }
                    self.result = false;
                    continue;

                case 'S':
                    // Set typing speed instruction
                    if (setTypingSpeedInstruction(self.tokens[0].text)) {
                        self.tokens.shift();
                    }
                    self.result = false;
                    continue;
                    
                case 'N':
                    // No-op instruction.
                    self.result = false;
                    continue;
                    
                case 'L':   // Clear screen instruction
                    clearScreenInstruction();
                    continue;

                case 'Z':
                    // Random nap time instruction
                    return timeout(self.result ? 150 : 2000, self.result ? 100 : 300);

                case 'W':
                    // Wait for 0 to 9 seconds instruction
                    const seconds = parseInt(self.tokens[0].text, 10);
                    if (isNaN(seconds)) {
                        continue;
                    }
                    self.tokens.shift();
                    return timeout(0, seconds*1000);
                    
                case '^':
                    put('^');
                    continue;
                    
                default:
                }
            } else {
                if (self.result) {
                    put(token.text);
                } else {
                    return typeOut(token.text);
                }
            }
        }

        // Check for final pause after processing.
        if (self.pause && self.pause > 0) {
            var pause = self.pause;
            self.pause = null;
            return timeout(0, pause);
        }
        
        self.busy = false;
        return false;
    }


} // ctor AutoTerm
