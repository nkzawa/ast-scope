var fs = require('fs');
var expect = require('chai').expect;
var esprima = require('esprima');
var estraverse = require('estraverse');
var Reference = require('../').Reference;


describe('Reference', function() {
  describe('extractId', function() {
    it('should extract id for Identifier', function() {
      var ast = esprima.parse('foo');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract this for ThisExpression', function() {
      var ast = esprima.parse('this');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'ThisExpression'});
    });

    it('should extract id for MemberExpression', function() {
      var ast = esprima.parse('foo.bar');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for CallExpression', function() {
      var ast = esprima.parse('foo()');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for NewExpression', function() {
      var ast = esprima.parse('new foo()');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for combinations', function() {
      var ast = esprima.parse('new this.foo().bar().baz');
      var node = ast.body[0].expression;
      expect(Reference.extractId(node)).to.eql({type: 'ThisExpression'});
    });
  });
});
