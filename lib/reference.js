var Variable = require('./variable');


module.exports = Reference;

function Reference(node, scope) {
  if (!Reference.isRequired(node)) {
    throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.scope = scope;
  this.variable = scope.resolveVariable(Variable.extractId(node));
  if (this.variable) {
    this.variable.references.push(this);
  }
}

Reference.isRequired = function(node) {
  switch (node.type) {
  case 'Identifier':
  case 'ThisExpression':
    return true;
  case 'MemberExpression':
    return Reference.isRequired(node.object);
  case 'CallExpression':
  case 'NewExpression':
    return Reference.isRequired(node.callee);
  }
  return false;
};

