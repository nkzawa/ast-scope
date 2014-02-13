
var escodegen = require('escodegen');


module.exports = Assignment;

function Assignment(node, scope) {
  this.node = node;
  this.scope = scope;

  switch (node.type) {
  case 'AssignmentExpression':
    this.operator = node.operator;
    this.left = node.left;
    this.right = node.right;
    break;
  case 'FunctionDeclaration':
    this.operator = '=';
    this.left = node.id;
    this.right = node;
    break;
  case 'VariableDeclarator':
    if (!node.init) {
      throw new Error('VariableDeclarator must have an initial value');
    }
    this.operator = '=';
    this.left = node.id;
    this.right = node.init;
    break;
  default:
    throw new Error('Invalid node type: ' + node.type);
    break;
  }
}

Assignment.prototype.toString = function() {
  return [
    escodegen.generate(this.left),
    this.operator,
    escodegen.generate(this.right)
  ].join(' ');
};
