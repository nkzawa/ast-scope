var Variable = require('./variable');


module.exports = Reference;

function Reference(node, scope) {
  if (!Reference.isRequired(node)) {
    throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.scope = scope;
  this.id = Reference.extractId(node);
  this.variable = scope.resolveVariable(this.id);
  if (!this.variable) {
    this.variable = scope.undeclared(this.id);
  }
  this.variable.references.push(this);
}

Reference.extractId = function(node) {
  switch (node.type) {
  case 'Identifier':
  case 'ThisExpression':
    return node;
  case 'MemberExpression':
    return Reference.extractId(node.object);
  case 'CallExpression':
  case 'NewExpression':
    return Reference.extractId(node.callee);
  }
};

Reference.isRequired = function(node) {
  return !!Reference.extractId(node);
};

