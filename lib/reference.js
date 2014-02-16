var Variable = require('./variable');


module.exports = Reference;

function Reference(node, scope) {
  if (!Reference.isRequired(node)) {
    throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.scope = scope;
  this.variable = scope.resolveVariable(Variable.extractName(node));
  if (this.variable) {
    this.variable.references.push(this);
  }
}

Reference.isRequired = function(node) {
  switch (node.type) {
  case 'Identifier':
  case 'MemberExpression':
  case 'ThisExpression':
    return true;
  case 'CallExpression':
  case 'NewExpression':
    return Reference.isRequired(node.callee);
  }
  return false;
};

