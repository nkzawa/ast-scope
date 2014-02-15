var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var estraverse = require('estraverse');
var Scope = require('../').Scope;
var findOne = require('./support').findOne;


describe('Scope', function() {
  describe('isRequired', function() {
    it('should be true for Program', function() {
      var ast = esprima.parse('');
      expect(Scope.isRequired(ast)).to.be.true;
    });

    it('should be true for FunctionExpression', function() {
      var ast = esprima.parse('var foo = function() {};');
      var node = findOne(ast, 'FunctionExpression');
      expect(Scope.isRequired(node)).to.be.true;
    });

    it('should be true for FunctionDeclaration', function() {
      var ast = esprima.parse('function foo() {};');
      var node = findOne(ast, 'FunctionDeclaration');
      expect(Scope.isRequired(node)).to.be.true;
    });
  });
});
