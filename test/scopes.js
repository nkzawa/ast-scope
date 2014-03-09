var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var scopes = require('../').scopes;
var findOne = require('./support').findOne;


describe('scopes', function() {
  describe('isRequired', function() {
    it('should be true for Program', function() {
      var ast = esprima.parse('');
      expect(scopes.isRequired(ast)).to.be.true;
    });

    it('should be true for FunctionExpression', function() {
      var ast = esprima.parse('var foo = function() {};');
      var node = findOne(ast, 'FunctionExpression');
      expect(scopes.isRequired(node)).to.be.true;
    });

    it('should be true for FunctionDeclaration', function() {
      var ast = esprima.parse('function foo() {};');
      var node = findOne(ast, 'FunctionDeclaration');
      expect(scopes.isRequired(node)).to.be.true;
    });

    it('should be true for CatchClause', function() {
      var ast = esprima.parse('try {} catch (e) {}');
      var node = findOne(ast, 'CatchClause');
      expect(scopes.isRequired(ast)).to.be.true;
    });
  });
});
