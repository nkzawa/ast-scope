var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var estraverse = require('estraverse');
var es = require('../');


function findOne(ast, condition) {
  if ('string' === typeof condition) {
    condition = {type: condition};
  }

  var result = null;
  var keys = Object.keys(condition);

  estraverse.traverse(ast, {
    enter: function(node) {
      var matched = keys.every(function(k) {
        return node[k] === condition[k];
      });

      if (!matched) return;

      result = node;
      this.break();
    }
  });
  return result;
}

describe('esprima-scope', function() {
  describe('analyze', function() {
    beforeEach(function() {
      this.code = this.currentTest.parent.title;
    });

    describe('node', function() {
      describe('var foo = 1;', function() {
        it('should have Program as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
          expect(scope.node).to.equal(ast);
          expect(scope.node.type).to.equal('Program');
        });
      });

      describe('function foo() {}', function() {
        it('should have FunctionDeclaration as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast).children[0];
          expect(scope.node).to.equal(findOne(ast, 'FunctionDeclaration'));
        });
      });

      describe('var foo = function() {};', function() {
        it('should have FunctionExpression as a node', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast).children[0];
          expect(scope.node).to.equal(findOne(ast, 'FunctionExpression'));
        });
      });
    });

    describe('scope chain', function() {
      describe('var foo = 1;', function() {
        it('should have no scope chain', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
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
            var scope = es.analyze(ast);
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
          var scope = es.analyze(ast);
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
          var scope = es.analyze(ast);
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
          var scope = es.analyze(ast);
          expect(scope.variables.foo).to.have.length(1);

          var assignment = scope.variables.foo[0];
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment.left).to.have.property('type', 'Identifier');
          expect(assignment.left).to.have.property('name', 'foo');
          expect(assignment.right).to.have.property('type', 'Literal');
          expect(assignment.right).to.have.property('value', 1);
        });
      });

      describe('function foo() {};', function() {
        it('should have a variable', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
          expect(scope.variables.foo).to.have.length(1);

          var assignment = scope.variables.foo[0];
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment.left).to.have.property('type', 'Identifier');
          expect(assignment.left).to.have.property('name', 'foo');
          expect(assignment.right).to.have.property('type', 'FunctionDeclaration');
        });
      });

      describe('var foo, bar;', function() {
        it('should have variables', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
          expect(scope.variables.foo).to.have.length(0);
          expect(scope.variables.bar).to.have.length(0);
        });
      });
    });

    describe('assignments', function() {
      describe('foo = 1;', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
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

      describe('var foo = 1;', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(ast, 'VariableDeclarator');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', node.id);
          expect(assignment).to.have.property('right', node.init);
        });
      });

      describe('function foo() {};', function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);
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
          var scope = es.analyze(ast).children[0];
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var node = findOne(scope.node, 'AssignmentExpression');

          expect(assignment).to.have.property('node', node);
          expect(assignment).to.have.property('scope', scope);
        });
      });
    });

    describe('references', function() {
      [
        'var foo = 1;',
        'function foo() {}'
      ].forEach(function(code) {
        describe(code, function() {
          it('should have no reference', function() {
            var ast = esprima.parse(this.code);
            var scope = es.analyze(ast);
            expect(scope.references).to.eql([]);
          });
        });
      });

      describe('new Date().getTime();', function() {
        it('should have a reference', function() {
          var ast = esprima.parse(this.code);
          var scope = es.analyze(ast);

          expect(scope.references).to.eql([
            findOne(ast, {type: 'Identifier', name: 'Date'})
          ]);
        });
      });
    });
  });

  describe('isScopeRequired', function() {
    it('should be true for Program', function() {
      var ast = esprima.parse('');
      expect(es.isScopeRequired(ast)).to.be.true;
    });

    it('should be true for FunctionExpression', function() {
      var ast = esprima.parse('var foo = function() {};');
      var node = findOne(ast, 'FunctionExpression');
      expect(es.isScopeRequired(node)).to.be.true;
    });

    it('should be true for FunctionDeclaration', function() {
      var ast = esprima.parse('function foo() {};');
      var node = findOne(ast, 'FunctionDeclaration');
      expect(es.isScopeRequired(node)).to.be.true;
    });
  });
});
