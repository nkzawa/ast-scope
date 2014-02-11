
var escodegen = require('escodegen');


module.exports = Assignment;

function Assignment(obj) {
  this.operator = obj.operator;
  this.left = obj.left;
  this.right = obj.right;
  this.scope = obj.scope;
}

Assignment.prototype.toString = function() {
  return [
    escodegen.generate(this.left),
    this.operator,
    escodegen.generate(this.right)
  ].join(' ');
};
