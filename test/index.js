var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var estraverse = require('estraverse');
var as = require('../');
var findOne = require('./support').findOne;


describe('ast-scope', function() {
  describe('analyze', function() {
    beforeEach(function() {
      this.code = this.currentTest.parent.title;
    });

    describe('node', function() {
      describe('var foo = 1;', function() {
        it('should have Program as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.node).to.equal(ast);
          expect(scope.node.type).to.equal('Program');
        });
      });

      describe('function foo() {}', function() {
        it('should have FunctionDeclaration as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast).children[0];
          expect(scope.node).to.equal(findOne(ast, 'FunctionDeclaration'));
        });
      });

      describe('var foo = function() {};', function() {
        it('should have FunctionExpression as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast).children[0];
          expect(scope.node).to.equal(findOne(ast, 'FunctionExpression'));
        });
      });
    });

    describe('scope chain', function() {
      describe('var foo = 1;', function() {
        it('should have no scope chain', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.parent).to.not.exist;
          expect(scope.children).to.eql([]);
        });
      });

      [
        'function foo() {};',
        'foo = function() {};'
      ].forEach(function(code) {
        describe(code, function() {
          it('should have a child scope', function() {
            var ast = esprima.parse(this.code);
            var scope = as.analyze(ast);
            expect(scope.parent).to.not.exist;
            expect(scope.children).to.have.length(1);

            var child = scope.children[0];
            expect(child.parent).to.equal(scope);
            expect(child.children).to.eql([]);
          });
        });
      });

      describe('function foo() {} function bar() {}', function() {
        it('should have child scopes', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.parent).to.not.exist;
          expect(scope.children).to.have.length(2);

          scope.children.forEach(function(child) {
            expect(child.parent).to.equal(scope);
            expect(child.children).to.eql([]);
          });
        });
      });

      describe('function foo() { function bar() {} }', function() {
        it('should have 2 level nested scopes', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.parent).to.not.exist;
          expect(scope.children).to.have.length(1);

          var child = scope.children[0];
          expect(child.parent).to.equal(scope);
          expect(child.children).to.have.length(1);

          var grandchild = child.children[0];
          expect(grandchild.parent).to.equal(child);
          expect(grandchild.children).to.eql([]);
        });
      });
    });

    describe('variables', function() {
      describe('var foo = 1;', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getVariable('foo');
          expect(foo.name).to.equal('foo');
          expect(foo.node).to.equal(findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo.scope).to.equal(scope);
          expect(foo.declarations).to.have.length(1);
          expect(foo.assignments).to.have.length(1);
        });
      });

      describe('function foo() {};', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getVariable('foo');
          expect(foo.name).to.equal('foo');
          expect(foo.node).to.equal(findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo.scope).to.equal(scope);
          expect(foo.declarations).to.have.length(1);
          expect(foo.declarations[0]).to.equal(findOne(ast, 'FunctionDeclaration'));
          expect(foo.assignments).to.have.length(1);
          expect(foo.assignments[0].node).to.equal(findOne(ast, 'FunctionDeclaration'));
        });
      });

      describe('var foo, bar;', function() {
        it('should have variables', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getVariable('foo');
          expect(foo.name).to.equal('foo');
          expect(foo.node).to.equal(findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo.assignments).to.have.length(0);

          var bar = scope.getVariable('bar');
          expect(foo.name).to.equal('foo');
          expect(bar.node).to.equal(findOne(ast, {type: 'Identifier', name: 'bar'}));
          expect(bar.assignments).to.have.length(0);
        });
      });

      describe('var foo, foo;', function() {
        it('should have 2 declarations', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getVariable('foo');
          expect(foo.declarations).to.have.length(2);
        });
      });

      describe('this;', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var _this = scope.getVariable('this');
          expect(_this.name).to.equal('this');
          expect(_this.node).to.not.exist;
          expect(_this.scope).to.equal(scope);
          expect(_this.references).to.have.length(1);
        });
      });

      describe('arguments;', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var args = scope.getVariable('arguments');
          expect(args.name).to.equal('arguments');
          expect(args.node).to.not.exist;
          expect(args.scope).to.equal(scope);
          expect(args.references).to.have.length(1);
        });
      });

      describe('try {} catch (e) {}', function() {
        it('should have a variable in CatchClause', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var e = scope.children[0].getVariable('e');
          expect(e).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'e'}));
        });
      });

      describe('var constructor;', function() {
        it('should support "constructor"', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var constructor = scope.getVariable('constructor');
          expect(constructor.name).to.equal('constructor');
        });
      });
    });

    describe('unscopedVariables', function() {
      describe('foo = 1;', function() {
        it('should have a undeclared variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getUnscopedVariable('foo');
          expect(foo.name).to.equal('foo');
          expect(foo.node).to.not.exist;
          expect(foo.scope).to.not.exist;
          expect(foo.declarations).to.have.length(0);
          expect(foo.assignments).to.have.length(1);
          expect(foo.references).to.have.length(1);
        });
      });

      describe('(function() {foo = 1;})();', function() {
        it('should have a undeclared variable on top level scope', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.getUnscopedVariable('foo');
          expect(foo.name).to.equal('foo');
          expect(foo.node).to.not.exist;
          expect(foo.scope).to.not.exist;
        });
      });

      describe('undefined; this.value = 1;', function() {
        it('should have undefined and this as variables', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.variables).to.have.length(1);
          expect(scope.getVariable('this')).to.exist;

          expect(scope.unscopedVariables).to.have.length(1);
          expect(scope.getUnscopedVariable('undefined')).to.exist;
        });
      });

      describe('constructor;', function() {
        it('should support "constructor"', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.unscopedVariables).to.have.length(1);
          expect(scope.getUnscopedVariable('constructor')).to.exist;
        });
      });
    });

    describe('assignments', function() {
      describe('foo = 1;', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(ast, 'AssignmentExpression');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', node.left);
          expect(assignment).to.have.property('right', node.right);
        });
      });

      describe('var foo;', function() {
        it('should have no assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.assignments).to.have.length(0);
        });
      });

      describe('var foo = 1;', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(ast, 'VariableDeclarator');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', node.id);
          expect(assignment).to.have.property('right', node.init);

          var variable = scope.getVariable('foo');
          expect(assignment).to.have.property('variable', variable);
          expect(variable.assignments).to.have.length(1);
          expect(variable.assignments[0]).to.equal(assignment);
        });
      });

      describe('function foo() {};', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(ast, 'FunctionDeclaration');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', node.id);
          expect(assignment).to.have.property('right', node);
        });
      });

      describe('(function() { foo = 1; })();', function() {
        it('should have an assignment within scope', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast).children[0];
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(scope.node, 'AssignmentExpression');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('scope', scope);
        });
      });
    });

    describe('references', function() {
      describe('var foo;', function() {
        it('should have no reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.references).to.have.length(0);
        });
      });

      describe('var foo = 1;', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.references).to.have.length(1);

          var ref = scope.references[0];
          expect(ref).to.have.property('node', findOne(ast, {name: 'foo'}));
          expect(ref).to.have.property('scope', scope);
        });
      });

      describe('function foo() {}', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.references).to.have.length(1);

          var ref = scope.references[0];
          expect(ref).to.have.property('node', findOne(ast, {name: 'foo'}));
          expect(ref).to.have.property('scope', scope);
        });
      });

      describe('foo;', function() {
        it('should have a references', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);

          expect(scope.references).to.have.length(1);

          var reference = scope.references[0];
          expect(reference.node).to.equal(findOne(ast, {name: 'foo'}));
          expect(reference.scope).to.equal(scope);
          expect(reference.variable).to.equal(scope.getUnscopedVariable('foo'));
        });
      });

      describe('new Date().getTime();', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);

          expect(scope.references).to.have.length(1);

          var reference = scope.references[0];
          expect(reference.node).to.equal(findOne(ast, 'CallExpression'));
          expect(reference.scope).to.equal(scope);
          expect(reference.variable).to.equal(scope.getUnscopedVariable('Date'));
        });
      });

      describe('[foo].slice();', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);

          expect(scope.references).to.have.length(1);
          expect(scope.references[0].id.name).to.equal('foo');
        });
      });

      describe('foo[bar][baz]', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);

          expect(scope.references).to.have.length(3);
          expect(scope.references[0].id.name).to.equal('foo');
          expect(scope.references[1].id.name).to.equal('baz');
          expect(scope.references[2].id.name).to.equal('bar');
        });
      });

      describe('foo = 1; var foo;', function() {
        it('should support hoisting', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.references[0].variable).to.equal(scope.getVariable('foo'));
        });
      });

      describe('foo(); function foo() {};', function() {
        it('should support hoisting', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          expect(scope.references[0].variable).to.equal(scope.getVariable('foo'));
          expect(scope.references[1].variable).to.equal(scope.getVariable('foo'));
        });
      });
    });
  });
});
