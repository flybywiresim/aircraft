'use strict';

const IDENT_START_RE = /\p{ID_Start}/u;
const IDENT_CONTINUE_RE = /\p{ID_Continue}/u;

const Token = {};
const TokenNames = {};
const TokenValues = {};
const TokenPrecedence = {};
const OperatorOverload = {};

const LexTree = {};

[
    ['ASSIGN', '=', 2],

    // Relational
    ['EQ', '==', 9],
    ['NE', '!=', 9],
    ['LT', '<', 10],
    ['GT', '>', 10],
    ['LTE', '<=', 10],
    ['GTE', '>=', 10],

    // Binop
    ['BIT_OR', '|', 6],
    ['BIT_XOR', '^', 7],
    ['BIT_AND', '&', 8],
    ['SHL', '<<', 11],
    ['SAR', '>>', 11],
    ['MUL', '*', 13],
    ['DIV', '/', 13],
    ['IDIV', '//', 13, 'div'],
    ['MOD', '%', 13],
    ['EXP', '**', 14, 'pow'],

    // Unop
    ['ADD', '+', 12],
    ['SUB', '-', 12],

    // Operators
    ['NOT', '!'],
    ['BIT_NOT', '~'],

    // Keywords
    ['IF', 'if'],
    ['ELSE', 'else'],
    ['LET', 'let'],
    ['MACRO', 'macro'],
    ['TRUE', 'true'],
    ['FALSE', 'false'],

    // Other
    ['NUMBER', null],
    ['STRING', null],
    ['IDENTIFIER', null],
    ['MACRO_IDENTIFIER', null],
    ['SIMVAR', null],
    ['EOS', null],

    ['COMMA', ','],
    ['SEMICOLON', ';'],
    ['LPAREN', '('],
    ['RPAREN', ')'],
    ['LBRACE', '{'],
    ['RBRACE', '}'],
].forEach(([name, v, prec, overload], i) => {
    Token[name] = i;
    TokenNames[i] = name;
    TokenValues[i] = v;
    TokenPrecedence[name] = prec || 0;
    TokenPrecedence[i] = TokenPrecedence[name];

    if (overload) {
        OperatorOverload[v] = overload;
    }

    if (v) {
        let t = LexTree;
        for (let n = 0; n < v.length; n += 1) {
            t[v[n]] = t[v[n]] || {};
            t = t[v[n]];
        }
        t.value = i;
    }
});

class Lexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.currentToken = undefined;
        this.peekedToken = undefined;
        this.scannedValue = undefined;
        this.line = 1;
        this.columnOffset = 0;
        this.positionForNextToken = 0;
        this.lineForNextToken = 0;
        this.columnForNextToken = 0;
    }

    next() {
        this.currentToken = this.peekedToken;
        this.peekedToken = this.advance();
        return this.currentToken;
    }

    peek() {
        if (this.peekedToken === undefined) {
            this.next();
        }
        return this.peekedToken;
    }

    test(t) {
        return this.peek().type === t;
    }

    eat(t) {
        if (this.test(t)) {
            this.next();
            return true;
        }
        return false;
    }

    expect(t) {
        if (this.test(t)) {
            return this.next();
        }
        return this.unexpected();
    }

    skipLineComment() {
        while (this.position < this.source.length) {
            this.position += 1;
            if (this.source[this.position] === '\n') {
                this.line += 1;
                this.columnOffset = this.position;
                return;
            }
        }
    }

    skipBlockComment() {
        let n = 0;
        do {
            if (this.position >= this.source.length) {
                this.raise('Unterminated block comment', this.position);
            }
            switch (this.source[this.position]) {
                case '(':
                    this.position += 1;
                    if (this.source[this.position] === '*') {
                        this.position += 1;
                        n += 1;
                    }
                    break;
                case '*':
                    this.position += 1;
                    if (this.source[this.position] === ')') {
                        this.position += 1;
                        n -= 1;
                    }
                    break;
                default:
                    if (this.source[this.position] === '\n') {
                        this.line += 1;
                        this.columnOffset = this.position;
                    }
                    this.position += 1;
                    break;
            }
        } while (n > 0);
    }

    skipWhitespace() {
        while (this.position < this.source.length) {
            switch (this.source[this.position]) {
                case ' ':
                case '\t':
                    this.position += 1;
                    break;
                case '\n':
                    this.position += 1;
                    this.line += 1;
                    this.columnOffset = this.position;
                    break;
                case '(':
                    switch (this.source[this.position + 1]) {
                        case '/':
                            this.skipLineComment();
                            break;
                        case '*':
                            this.skipBlockComment();
                            break;
                        default:
                            return;
                    }
                    break;
                default:
                    return;
            }
        }
    }

    advance() {
        const type = this.scan();
        const value = this.scannedValue;
        this.scannedValue = undefined;
        return {
            type,
            value,
            startIndex: this.positionForNextToken,
            endIndex: this.position,
            line: this.lineForNextToken,
            column: this.columnForNextToken,
        };
    }

    scan() {
        this.skipWhitespace();

        this.positionForNextToken = this.position;
        this.lineForNextToken = this.line;
        this.columnForNextToken = this.position - this.columnOffset + 1;

        if (this.position >= this.source.length) {
            return Token.EOS;
        }

        switch (this.source[this.position]) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                return this.scanNumber();
            case '\'':
                return this.scanString();
            case '(':
                this.position += 1;
                if (this.source[this.position + 1] === ':') {
                    return this.scanSimVar();
                }
                return Token.LPAREN;
            default: {
                let match = LexTree[this.source[this.position]];
                const start = this.position;
                if (match) {
                    this.position += 1;
                    while (match[this.source[this.position]]) {
                        match = match[this.source[this.position]];
                        this.position += 1;
                    }
                    if (match.value !== undefined) {
                        this.scannedValue = TokenValues[match.value];
                        return match.value;
                    }
                    this.position = start;
                }
                if (IDENT_START_RE.test(this.source[this.position]) || this.source[this.position] === '$') {
                    this.position += 1;
                    while (IDENT_CONTINUE_RE.test(this.source[this.position])) {
                        this.position += 1;
                    }
                    this.scannedValue = this.source.slice(start, this.position);
                    return this.scannedValue.startsWith('$')
                        ? Token.MACRO_IDENTIFIER
                        : Token.IDENTIFIER;
                }
                return this.unexpected(this.position);
            }
        }
    }

    scanNumber() {
        const start = this.position;
        let base = 10;
        if (this.source[this.position] === '0') {
            this.position += 1;
            switch (this.source[this.position]) {
                case 'x':
                    this.position += 1;
                    base = 16;
                    break;
                case 'o':
                    this.position += 1;
                    base = 8;
                    break;
                case 'b':
                    this.position += 1;
                    base = 2;
                    break;
                case '.':
                    break;
                default:
                    this.scannedValue = 0;
                    return Token.NUMBER;
            }
        }
        const check = {
            16: (c) => c && /[\da-f]/u.test(c),
            10: (c) => c && /\d/u.test(c),
            8: (c) => c && /[0-7]/u.test(c),
            2: (c) => c && /[01]/u.test(c),
        }[base];
        while (this.position < this.source.length) {
            if (check(this.source[this.position])) {
                this.position += 1;
            } else {
                break;
            }
        }
        if (base === 10 && this.source[this.position] === '.') {
            this.position += 1;
            while (this.position < this.source.length) {
                if (check(this.source[this.position])) {
                    this.position += 1;
                } else {
                    break;
                }
            }
        }
        const buffer = this.source.slice(base === 10 ? start : start + 2, this.position);
        this.scannedValue = base === 10
            ? Number.parseFloat(buffer, base)
            : Number.parseInt(buffer, base);
        return Token.NUMBER;
    }

    scanString() {
        this.position += 1;
        let buffer = '';
        while (true) { // eslint-disable-line no-constant-condition
            if (this.position >= this.source.length) {
                this.raise('Unterminated string', this.position);
            }
            const c = this.source[this.position];
            if (c === '\'') {
                this.position += 1;
                break;
            }
            if (c === '\n') {
                this.raise('Unterminated string', this.position);
            }
            this.position += 1;
            buffer += c;
        }
        this.scannedValue = buffer;
        return Token.STRING;
    }

    scanSimVar() {
        const nameStart = this.position;
        let typeStart = -1;
        while (true) { // eslint-disable-line no-constant-condition
            if (this.position >= this.source.length || this.source[this.position] === '\n') {
                this.raise('Unexpected end of simvar', this.position);
            }
            if (typeStart === -1 && this.source[this.position] === ',') {
                typeStart = this.position;
            }
            if (this.source[this.position] === ')') {
                break;
            }
            this.position += 1;
        }
        this.position += 1;
        const name = this.source
            .slice(nameStart, typeStart === -1 ? this.position - 1 : typeStart)
            .trim();
        const type = typeStart === -1
            ? null
            : this.source.slice(typeStart + 1, this.position - 1).trim();
        this.scannedValue = { name, type };
        return Token.SIMVAR;
    }
}

module.exports = {
    Lexer,
    Token,
    TokenPrecedence,
    TokenNames,
    OperatorOverload,
};
