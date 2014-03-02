
module.exports = Variable;

function Variable(node, scope) {
  if (node.type !== 'Identifier') {
    throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.scope = scope;
  this.assignments = [];
  this.references = [];
}

Variable.extractId = function(node) {
  switch (node.type) {
  case 'Identifier':
  case 'ThisExpression':
    return node;
  case 'MemberExpression':
    return Variable.extractId(node.object);
  case 'CallExpression':
  case 'NewExpression':
    return Variable.extractId(node.callee);
  }
  throw new Error('Invalid node type: ' + node.type);
};
