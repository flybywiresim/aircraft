'use strict';

const {
    Lexer,
    Token,
    TokenPrecedence,
} = require('./lexer');

class Parser extends Lexer {
    constructor(source, specifier) {
        super(source);
        this.specifier = specifier;
        this.insideMacro = false;
    }

    static parse(source, specifier) {
        const p = new Parser(source, specifier);
        return p.parseProgram();
    }

    raise(m, c = this.peek()) {
        let context = c;
        let message = m;

        if (context.type === Token.EOS && message === 'Unexpected token') {
            message = 'Unexpected end of source';
        }

        let startIndex;
        let endIndex;
        let line;
        let column;
        if (typeof context === 'number') {
            line = this.line;
            if (context === this.source.length) {
                while (this.source[context - 1] === '\n') {
                    line -= 1;
                    context -= 1;
                }
            }
            startIndex = context;
            endIndex = context + 1;
        } else if (context.type === Token.EOS) {
            line = this.line;
            startIndex = context.startIndex;
            while (this.source[startIndex - 1] === '\n') {
                line -= 1;
                startIndex -= 1;
            }
            endIndex = startIndex + 1;
        } else {
            if (context.location) {
                context = context.location;
            }
            ({
                startIndex,
                endIndex,
                start: {
                    line,
                    column,
                } = context,
            } = context);
        }

        let lineStart = startIndex;
        while (this.source[lineStart - 1] !== '\n' && this.source[lineStart - 1] !== undefined) {
            lineStart -= 1;
        }

        let lineEnd = startIndex;
        while (this.source[lineEnd] !== '\n' && this.source[lineEnd] !== undefined) {
            lineEnd += 1;
        }

        if (column === undefined) {
            column = startIndex - lineStart + 1;
        }

        const e = new SyntaxError(message);
        const oldPST = Error.prepareStackTrace;
        Error.prepareStackTrace = (error, trace) => `    at ${trace.join('\n    at ')}`;
        e.stack = `\
${e.name}: ${e.message}
${this.specifier ? `${this.specifier}:${line}:${column}\n` : ''}${this.source.slice(lineStart, lineEnd)}
${' '.repeat(startIndex - lineStart)}${'^'.repeat(Math.max(endIndex - startIndex, 1))}
${e.stack}`;
        Error.prepareStackTrace = oldPST;

        throw e;
    }

    unexpected(context) {
        this.raise('Unexpected token', context);
    }

    startNode(inheritStart = undefined) {
        this.peek();
        return {
            type: undefined,
            location: {
                startIndex: inheritStart
                    ? inheritStart.location.startIndex
                    : this.peekedToken.startIndex,
                endIndex: -1,
                start: inheritStart ? { ...inheritStart.location.start } : {
                    line: this.peekedToken.line,
                    column: this.peekedToken.column,
                },
                end: {
                    line: -1,
                    column: -1,
                },
            },
        };
    }

    finishNode(node, type) {
        // eslint-disable-next-line no-param-reassign
        node.type = type;
        // eslint-disable-next-line no-param-reassign
        node.location.endIndex = this.currentToken.endIndex;
        // eslint-disable-next-line no-param-reassign
        node.location.end.line = this.currentToken.line;
        // eslint-disable-next-line no-param-reassign
        node.location.end.column = this.currentToken.column;
        return node;
    }

    // Program :
    //   StatementList
    parseProgram() {
        const node = this.startNode();
        node.statements = this.parseStatementList(Token.EOS);
        return this.finishNode(node, 'Program');
    }

    // StatementList :
    //   Statement
    //   StatementList Statement
    parseStatementList(end) {
        const statements = [];
        while (!this.eat(end)) {
            statements.push(this.parseStatement(end));
        }
        return statements;
    }

    // Statement :
    //   LocalDeclaration
    //   MacroDeclaration
    //   Assignment
    //   Expression `;`
    parseStatement(end) {
        switch (this.peek().type) {
            case Token.LET:
                return this.parseLocalDeclaration();
            case Token.MACRO:
                if (this.insideMacro) {
                    this.raise('Cannot declare macro inside macro');
                }
                return this.parseMacroDeclaration();
            default: {
                const expr = this.parseExpression();
                if ((expr.type === 'SimVar' || expr.type === 'Identifier') && !this.test(Token.SEMICOLON) && this.test(Token.ASSIGN)) {
                    return this.parseAssignment(expr);
                }
                if (this.eat(Token.SEMICOLON)) {
                    const node = this.startNode();
                    node.expression = expr;
                    return this.finishNode(node, 'Drop');
                }
                if (expr.type === 'IfExpression') {
                    expr.statementWithoutSemicolon = true;
                } else if (!this.test(end)) {
                    this.expect(Token.SEMICOLON);
                }
                return expr;
            }
        }
    }

    // LocalDeclaration :
    //   `let` Identifier `=` Expression `;`
    parseLocalDeclaration() {
        const node = this.startNode();
        this.expect(Token.LET);
        node.name = this.parseIdentifier();
        this.expect(Token.ASSIGN);
        node.value = this.parseExpression();
        this.expect(Token.SEMICOLON);
        return this.finishNode(node, 'LocalDeclaration');
    }

    // MacroDeclaration :
    //   `macro` Identifier `(` Parameters `)` Block
    parseMacroDeclaration() {
        const node = this.startNode();
        this.expect(Token.MACRO);
        node.name = this.parseIdentifier();
        this.expect(Token.LPAREN);
        node.parameters = [];
        while (true) { // eslint-disable-line no-constant-condition
            if (this.eat(Token.RPAREN)) {
                break;
            }
            node.parameters.push(this.parseMacroIdentifier());
            if (this.eat(Token.RPAREN)) {
                break;
            }
            this.expect(Token.COMMA);
        }
        this.insideMacro = true;
        node.body = this.parseBlock();
        this.insideMacro = false;
        return this.finishNode(node, 'MacroDeclaration');
    }

    // Assignment :
    //   SimVar `=` Expression `;`
    //   Identifier `=` Expression `;`
    parseAssignment(left) {
        const node = this.startNode(left);
        node.left = left;
        this.expect(Token.ASSIGN);
        node.right = this.parseExpression();
        this.expect(Token.SEMICOLON);
        return this.finishNode(node, 'Assignment');
    }

    // Expression :
    //   AssignmentExpression
    parseExpression() {
        return this.parseBinaryExpression(TokenPrecedence.BIT_OR);
    }

    // BinaryExpression :
    //   a lot of rules ok
    parseBinaryExpression(precedence, initialX = this.parseUnaryExpression()) {
        let p = TokenPrecedence[this.peek().type];
        let x = initialX;
        if (p >= precedence) {
            do {
                while (TokenPrecedence[this.peek().type] === p) {
                    const node = this.startNode(x);
                    node.left = x;
                    node.operator = this.next().value;
                    node.right = this.parseBinaryExpression(p + 1);
                    x = this.finishNode(node, 'BinaryExpression');
                }
                p -= 1;
            } while (p >= precedence);
        }
        return x;
    }

    // UnaryExpression :
    //   UnaryExpression
    //   `!` UnaryExpression
    //   `~` UnaryExpression
    //   `-` UnaryExpression
    parseUnaryExpression() {
        const node = this.startNode();
        switch (this.peek().type) {
            case Token.NOT:
            case Token.BIT_NOT:
            case Token.SUB:
                node.operator = this.next().value;
                node.operand = this.parseUnaryExpression();
                return this.finishNode(node, 'UnaryExpression');
            default:
                return this.parseUpdateExpression();
        }
    }

    // TODO: should update expressions be supported?
    parseUpdateExpression() {
        return this.parseMacroExpansion();
    }

    // MacroExpansion :
    //   PrimaryExpression
    //   Identifier `(` Arguments `)`
    parseMacroExpansion() {
        const left = this.parsePrimaryExpression();
        if (left.type === 'Identifier' && this.eat(Token.LPAREN)) {
            const node = this.startNode(left);
            node.name = left;
            node.arguments = [];
            while (!this.eat(Token.RPAREN)) {
                node.arguments.push(this.parseExpression());
                if (this.eat(Token.RPAREN)) {
                    break;
                }
                this.expect(Token.COMMA);
            }
            return this.finishNode(node, 'MacroExpansion');
        }
        return left;
    }

    // PrimaryExpression :
    //   Identifier
    //   BooleanLiteral
    //   NumberLiteral
    //   StringLiteral
    //   `(` Expression `)`
    //   SimVar
    //   IfExpression
    //
    // SimVar :
    //   `(` any char `:` any chars `)`
    parsePrimaryExpression() {
        switch (this.peek().type) {
            case Token.IDENTIFIER:
                return this.parseIdentifier();
            case Token.MACRO_IDENTIFIER:
                if (!this.insideMacro) {
                    this.unexpected();
                }
                return this.parseMacroIdentifier();
            case Token.TRUE:
            case Token.FALSE: {
                const node = this.startNode();
                node.value = this.next().value === 'true';
                return this.finishNode(node, 'BooleanLiteral');
            }
            case Token.NUMBER: {
                const node = this.startNode();
                node.value = this.next().value;
                return this.finishNode(node, 'NumberLiteral');
            }
            case Token.STRING: {
                const node = this.startNode();
                node.value = this.next().value;
                return this.finishNode(node, 'StringLiteral');
            }
            case Token.LPAREN: {
                this.next();
                const node = this.parseExpression();
                this.expect(Token.RPAREN);
                return node;
            }
            case Token.SIMVAR: {
                const node = this.startNode();
                node.value = this.next().value;
                return this.finishNode(node, 'SimVar');
            }
            case Token.IF:
                return this.parseIfExpression();
            case Token.LBRACE:
                return this.parseBlock();
            default:
                return this.unexpected();
        }
    }

    // Identifier :
    //   ID_Start ID_Continue*
    parseIdentifier() {
        const node = this.startNode();
        node.value = this.expect(Token.IDENTIFIER).value;
        return this.finishNode(node, 'Identifier');
    }

    // MacroIdentifier :
    //   `$` ID_Continue*
    parseMacroIdentifier() {
        const node = this.startNode();
        node.value = this.expect(Token.MACRO_IDENTIFIER).value;
        return this.finishNode(node, 'MacroIdentifier');
    }

    // IfExpression :
    //   `if` Expression Block [lookahead != `else`]
    //   `if` Expression Block `else` Block
    //   `if` Expression Block IfExpression
    parseIfExpression() {
        const node = this.startNode();
        this.expect(Token.IF);
        node.statementWithoutSemicolon = false;
        node.test = this.parseExpression();
        node.consequent = this.parseBlock();
        if (this.eat(Token.ELSE)) {
            node.alternative = this.test(Token.IF) ? this.parseIfExpression() : this.parseBlock();
        } else {
            node.alternative = null;
        }
        return this.finishNode(node, 'IfExpression');
    }

    // Block :
    //   `{` StatementList `}`
    parseBlock() {
        const node = this.startNode();
        this.expect(Token.LBRACE);
        node.statements = this.parseStatementList(Token.RBRACE);
        return this.finishNode(node, 'Block');
    }
}

module.exports = { Parser };
