
var escodegen = require('escodegen');


module.exports = Variable;

function Variable(node, scope) {
  this.node = node;
  this.scope = scope;
  this.assignments = [];

  if (node.type !== 'Identifier') {
    throw new Error('Invalid node type: ' + node.type);
  }
}

Variable.prototype.toString = function() {
  return escodegen(this.node);
};
