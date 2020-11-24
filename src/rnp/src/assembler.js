'use strict';

const { OperatorOverload } = require('./lexer');

class Type {
    constructor(name) {
        this.name = name.toLowerCase();
    }

    toString() {
        return this.name;
    }
}

[
    'ANY',
    'BOOLEAN',
    'NUMBER',
    'STRING',
    'VOID',
].forEach((t) => {
    Type[t] = new Type(t);
});

const SimVarTypes = {
    boolean: Type.BOOLEAN,
    number: Type.NUMBER,
    string: Type.STRING,
};

const OpTypes = {
    '+': [Type.NUMBER, Type.NUMBER],
    '-': [Type.NUMBER, Type.NUMBER],
    '/': [Type.NUMBER, Type.NUMBER],
    '//': [Type.NUMBER, Type.NUMBER],
    '*': [Type.NUMBER, Type.NUMBER],
    '%': [Type.NUMBER, Type.NUMBER],
    '**': [Type.NUMBER, Type.NUMBER],
    // == and != can be applied to number and string
    // '==': [Type.NUMBER, Type.BOOLEAN],
    // '!=': [Type.NUMBER, Type.BOOLEAN],
    '>': [Type.NUMBER, Type.BOOLEAN],
    '<': [Type.NUMBER, Type.BOOLEAN],
    '>=': [Type.NUMBER, Type.BOOLEAN],
    '<=': [Type.NUMBER, Type.BOOLEAN],
    '&': [Type.NUMBER, Type.NUMBER],
    '|': [Type.NUMBER, Type.NUMBER],
    '^': [Type.NUMBER, Type.NUMBER],
    '~': [Type.NUMBER, Type.NUMBER],
    '>>': [Type.NUMBER, Type.NUMBER],
    '<<': [Type.NUMBER, Type.NUMBER],
    '!': [Type.BOOLEAN, Type.BOOLEAN],
    '&&': [Type.BOOLEAN, Type.BOOLEAN],
    '||': [Type.BOOLEAN, Type.BOOLEAN],
};

const formatSimVar = (s) => {
    if (s.type) {
        return `${s.name},${s.type}`;
    }
    return `${s.name}`;
};

const REGISTER_MAX = 50;

class Assembler {
    constructor(source, specifier) {
        this.source = source;
        this.specifier = specifier;
        this.output = [];
        this.stack = [];
        this.scopes = [];
        this.registerIndex = 0;
    }

    static assemble(ast, source, specifier) {
        const a = new Assembler(source, specifier);
        a.visit(ast);
        return a.output.join(' ');
    }

    raise(T, message, node) {
        const {
            startIndex,
            endIndex,
            start: {
                line,
                column,
            },
        } = node.location;

        let lineStart = startIndex;
        while (this.source[lineStart - 1] !== '\n' && this.source[lineStart - 1] !== undefined) {
            lineStart -= 1;
        }

        let lineEnd = startIndex;
        while (this.source[lineEnd] !== '\n' && this.source[lineEnd] !== undefined) {
            lineEnd += 1;
        }

        const e = new T(message);
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

    emit(s) {
        this.output.push(s);
    }

    pushScope() {
        const scope = new Map();
        scope.startIndex = this.registerIndex;
        this.scopes.push(scope);
    }

    popScope() {
        const scope = this.scopes.pop();
        this.registerIndex = scope.startIndex;
    }

    push(t) {
        if (t !== Type.VOID) {
            this.stack.push(t);
        }
    }

    pop() {
        return this.stack.pop() || Type.VOID;
    }

    declare(name, data) {
        this.scopes.forEach((s) => {
            if (s.has(name)) {
                throw new SyntaxError(`Cannot shadow or redeclare ${name}`);
            }
        });
        this.scopes[this.scopes.length - 1].set(name, data);
    }

    resolve(name) {
        for (const scope of this.scopes) {
            if (scope.has(name)) {
                return scope.get(name);
            }
        }
        return null;
    }

    visit(node) {
        this[`visit${node.type}`](node);
    }

    visitStatementList(statements) {
        statements.forEach((s) => {
            this.visit(s);
        });
    }

    visitProgram(node) {
        this.pushScope();
        this.visitStatementList(node.statements);
        this.popScope();
    }

    visitLocalDeclaration(node) {
        this.visit(node.value);
        const t0 = this.pop();
        if (t0 === Type.VOID) {
            this.raise(`Expected value, got ${t0}`);
        }
        const register = this.registerIndex;
        if (register >= REGISTER_MAX) {
            this.raise(RangeError, 'ran out of registers!!', node.name);
        }
        this.declare(node.name.value, { register, type: t0 });
        this.registerIndex += 1;
        this.emit(`sp${register}`);
    }

    visitMacroDeclaration(node) {
        this.declare(node.name.value, node);
    }

    visitMacroExpansion(node) {
        const macro = this.resolve(node.name.value);
        if (macro === null) {
            this.raise(ReferenceError, `${node.name.value} is not declared`, node.name);
        }
        if (node.arguments.length !== macro.parameters.length) {
            this.raise(SyntaxError, `Macro expected ${macro.parameters} arguments`, node);
        }
        this.pushScope();
        macro.parameters.forEach((p, i) => {
            const a = node.arguments[i];
            this.declare(p.value, a);
        });
        this.visit(macro.body);
        this.popScope();
    }

    visitMacroIdentifier(node) {
        const ast = this.resolve(node.value);
        if (ast === null) {
            this.raise(ReferenceError, `${node.value} is not declared`, node);
        }
        // remove scopes so code can't access macro variables
        const { scopes } = this;
        this.scopes = [];
        this.visit(ast);
        this.scopes = scopes;
    }

    visitAssignment(node) {
        this.visit(node.right);
        const t0 = this.pop();
        switch (node.left.type) {
            case 'SimVar':
                if (node.left.value.type) {
                    if (t0 !== SimVarTypes[node.left.value.type]) {
                        this.raise(TypeError, `Expected ${SimVarTypes[node.left.value.type]} but got ${t0}`, node.right);
                    }
                }
                this.emit(`(>${formatSimVar(node.left.value)})`);
                break;
            case 'Identifier': {
                const local = this.resolve(node.left.value);
                if (local === null) {
                    this.raise(ReferenceError, `${node.left.value} is not declared`, node.left);
                }
                if (t0 !== local.type) {
                    this.raise(TypeError, `Expected ${local.type} but got ${t0}`, node.right);
                }
                this.emit(`sp${local.register}`);
                break;
            }
            default:
                throw new RangeError(node.left.type);
        }
    }

    visitUnaryExpression(node) {
        this.visit(node.operand);
        const [i, o] = OpTypes[node.operator];
        const t = this.pop();
        if (t !== i) {
            this.raise(TypeError, `${node.operator} expected ${i} but got ${t}`, node);
        }
        this.emit(OperatorOverload[node.operator] || node.operator);
        this.push(o);
    }

    visitBinaryExpression(node) {
        this.visit(node.left);
        const t1 = this.pop();
        this.visit(node.right);
        const t2 = this.pop();
        if (t1 !== t2) {
            this.raise(TypeError, `${node.operator} expected both operands to be the same type but got ${t1} and ${t2}`, node);
        }
        let i;
        let o;
        switch (node.operator) {
            case '==':
            case '!=':
                if (t1 === Type.STRING) {
                    i = Type.STRING;
                } else if (t1 === Type.BOOLEAN) {
                    i = Type.BOOLEAN;
                } else {
                    i = Type.NUMBER;
                }
                o = Type.BOOLEAN;
                break;
            default:
                ([i, o] = OpTypes[node.operator]);
                break;
        }
        if (t1 !== i) {
            this.raise(TypeError, `${node.operator} expected ${i} but got ${t1}`, node.left);
        }
        if (t2 !== i) {
            this.raise(TypeError, `${node.operator} expected ${i} but got ${t2}`, node.right);
        }
        switch (node.operator) {
            case '==':
            case '!=':
                if (i === Type.STRING) {
                    this.emit(`scmp 0 ${node.operator}`);
                } else {
                    this.emit(node.operator);
                }
                break;
            default:
                this.emit(OperatorOverload[node.operator] || node.operator);
                break;
        }
        this.push(o);
    }

    visitIdentifier(node) {
        const local = this.resolve(node.value);
        if (local === null) {
            this.raise(ReferenceError, `${node.value} is not declared`, node);
        }
        this.emit(`l${local.register}`);
        this.push(local.type);
    }

    visitBooleanLiteral(node) {
        this.emit(node.value ? '1' : '0');
        this.push(Type.BOOLEAN);
    }

    visitNumberLiteral(node) {
        this.emit(node.value.toString());
        this.push(Type.NUMBER);
    }

    visitStringLiteral(node) {
        this.emit(`'${node.value.toString()}'`);
        this.push(Type.STRING);
    }

    visitSimVar(node) {
        this.emit(`(${formatSimVar(node.value)})`);
        this.push(SimVarTypes[node.value.type] || Type.ANY);
    }

    visitIfExpression(node) {
        this.visit(node.test);
        const t = this.pop();
        if (t !== Type.BOOLEAN) {
            this.raise(TypeError, `Expected ${Type.BOOLEAN} but got ${t}`, node.test);
        }

        const visitBranch = (n) => {
            const len = this.stack.length;
            this.visit(n);
            if (this.stack.length - len < 0) {
                throw new RangeError('values popped');
            }
            if (this.stack.length !== len) {
                return this.pop();
            }
            return Type.VOID;
        };

        this.emit('if{');
        const t0 = visitBranch(node.consequent);
        this.emit('}');
        if (t0 !== Type.VOID && !node.alternative) {
            this.raise(SyntaxError, 'If expression with consequent value must have alternative', node);
        }

        if (node.alternative) {
            this.emit('els{');
            const t1 = visitBranch(node.alternative);
            this.emit('}');
            if (t0 !== t1) {
                this.raise(TypeError, `consequent returns ${t0} but alternative returns ${t1}`, node);
            }
        }

        if (t0 !== Type.VOID) {
            if (node.statementWithoutSemicolon) {
                // This could also automatically emit a drop, but being explicit seems better?
                this.raise(SyntaxError, 'If expression in statement position with value must have a semicolon', node);
            }
            this.push(t0);
        }
    }

    visitBlock(node) {
        this.pushScope();
        this.visitStatementList(node.statements);
        this.popScope();
    }

    visitDrop(node) {
        this.visit(node.expression);
        const t0 = this.pop();
        if (t0 !== Type.VOID) {
            this.emit('p');
        }
    }
}

module.exports = { Assembler };
