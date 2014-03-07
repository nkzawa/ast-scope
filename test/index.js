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
          var foo = scope.variables.foo;
          expect(foo).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo).to.have.property('scope', scope);
          expect(foo.assignments).to.have.length(1);
        });
      });

      describe('function foo() {};', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.variables.foo;
          expect(foo).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo).to.have.property('scope', scope);
          expect(foo.assignments).to.have.length(1);
          expect(foo.assignments[0]).to.have.property('node', findOne(ast, 'FunctionDeclaration'));
        });
      });

      describe('var foo, bar;', function() {
        it('should have variables', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.variables.foo;
          expect(foo).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'foo'}));
          expect(foo.assignments).to.have.length(0);

          var bar = scope.variables.bar;
          expect(bar).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'bar'}));
          expect(bar.assignments).to.have.length(0);
        });
      });

      describe('try {} catch (e) {}', function() {
        it('should have a variable in CatchClause', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var e = scope.children[0].variables.e;
          expect(e).to.have.property('node', findOne(ast, {type: 'Identifier', name: 'e'}));
        });
      });
    });

    describe('undeclaredVariables', function() {
      describe('foo = 1;', function() {
        it('should have a undeclared variable', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.undeclaredVariables.foo;
          expect(foo.node).to.eql({type: 'Identifier', name: 'foo'});
          expect(foo.scope).to.be.empty;
          expect(foo.assignments).to.have.length(1);
          expect(foo.references).to.have.length(1);
        });
      });

      describe('(function() {foo = 1;})();', function() {
        it('should have a undeclared variable on top level scope', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);
          var foo = scope.undeclaredVariables.foo;
          expect(foo.node).to.eql({type: 'Identifier', name: 'foo'});
          expect(foo.scope).to.be.empty;
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

          var variable = scope.variables.foo;
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
          expect(reference.variable).to.equal(scope.undeclaredVariables.foo);
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
          expect(reference.variable).to.equal(scope.undeclaredVariables.Date);
        });
      });

      describe('[foo].slice();', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = as.analyze(ast);

          expect(scope.references).to.have.length(1);
          expect(scope.references[0].node.name).to.equal('foo');
        });
      });
    });
  });
});
