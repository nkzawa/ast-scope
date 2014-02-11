var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var estraverse = require('estraverse');
var es = require('../');


function findOne(ast, condition) {
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
    describe('node', function() {
      var code1 = 'var foo = 1;';
      describe(code1, function() {
        it('should have Program as a node', function() {
          var ast = esprima.parse(code1);
          var scope = es.analyze(ast);
          expect(scope.node).to.equal(ast);
          expect(scope.node.type).to.equal('Program');
        });
      });

      var code2 = 'function foo() {}';
      describe(code2, function() {
        it('should have FunctionDeclaration as a node', function() {
          var ast = esprima.parse(code2);
          var scope = es.analyze(ast).children[0];
          expect(scope.node).to.equal(ast.body[0]);
          expect(scope.node.type).to.equal('FunctionDeclaration');
        });
      });
    });

    describe('scope chain', function() {
      var code1 = 'var foo = 1;';
      describe(code1, function() {
        it('should have no scope chain', function() {
          var ast = esprima.parse(code1);
          var scope = es.analyze(ast);
          expect(scope.parent).to.not.exist;
          expect(scope.children).to.eql([]);
        });
      });

      var code2 = 'function foo() {};';
      describe(code2, function() {
        it('should have a child scope', function() {
          var ast = esprima.parse(code2);
          var scope = es.analyze(ast);
          expect(scope.parent).to.not.exist;
          expect(scope.children).to.have.length(1);

          var child = scope.children[0];
          expect(child.parent).to.equal(scope);
          expect(child.children).to.eql([]);
        });
      });
    });

    describe('variables', function() {
      var code1 = 'var foo = 1;';
      describe(code1, function() {
        it('should have a variable', function() {
          var ast = esprima.parse(code1);
          var scope = es.analyze(ast);
          expect(scope.variables.foo).to.eql([scope.assignments[0]]);
        });
      });

      var code2 = 'function foo() {};';
      describe(code2, function() {
        it('should have a variable', function() {
          var ast = esprima.parse(code2);
          var scope = es.analyze(ast);
          expect(scope.variables.foo).to.eql([scope.assignments[0]]);
        });
      });
    });

    describe('assignments', function() {
      var code1 = 'var foo = 1;';
      describe(code1, function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(code1);
          var scope = es.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var declaration = ast.body[0].declarations[0];

          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', declaration.id);
          expect(assignment).to.have.property('right', declaration.init);
        });
      });

      var code2 = 'function foo() {};';
      describe(code2, function() {
        it('should have an assignment', function() {
          var ast = esprima.parse(code2);
          var scope = es.analyze(ast);
          expect(scope.assignments).to.have.length(1);

          var assignment = scope.assignments[0];
          var declaration = ast.body[0];

          expect(assignment).to.have.property('operator', '=');
          expect(assignment).to.have.property('scope', scope);
          expect(assignment).to.have.property('left', declaration.id);
          expect(assignment).to.have.property('right', declaration);
        });
      });
    });

    describe('references', function() {
      var codes = [
        'var foo = 1;',
        'function foo() {}'
      ];
      codes.forEach(function(code) {
        describe(code, function() {
          it('should have no reference', function() {
            var ast = esprima.parse(code);
            var scope = es.analyze(ast);
            expect(scope.references).to.eql([]);
          });
        });
      });

      var code1 = 'new Date().getTime();';
      describe(code1, function() {
        it('should have a reference', function() {
          var ast = esprima.parse(code1);
          var scope = es.analyze(ast);

          expect(scope.references).to.eql([
            findOne(ast, {type: 'Identifier', name: 'Date'})
          ]);
        });
      });
    });
  });
});
