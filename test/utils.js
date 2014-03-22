var expect = require('chai').expect;
var esprima = require('esprima');
var utils = require('../').utils;


describe('utils', function() {
  describe('extractId', function() {
    it('should extract id for Identifier', function() {
      var ast = esprima.parse('foo');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract this for ThisExpression', function() {
      var ast = esprima.parse('this');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'ThisExpression'});
    });

    it('should extract id for MemberExpression', function() {
      var ast = esprima.parse('foo.bar');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for CallExpression', function() {
      var ast = esprima.parse('foo()');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for NewExpression', function() {
      var ast = esprima.parse('new foo()');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'Identifier', name: 'foo'});
    });

    it('should extract id for combinations', function() {
      var ast = esprima.parse('new this.foo().bar().baz');
      var node = ast.body[0].expression;
      expect(utils.extractId(node)).to.eql({type: 'ThisExpression'});
    });
  });

  describe('extractId', function() {
    it('should extract name for Identifier', function() {
      var ast = esprima.parse('foo;');
      var node = ast.body[0].expression;
      expect(utils.extractName(node)).to.equal('foo');
    });

    it('should extract name for ThisExpression', function() {
      var ast = esprima.parse('this;');
      var node = ast.body[0].expression;
      expect(utils.extractName(node)).to.equal('this');
    });
  });
});
