
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

Variable.extractName = function(node) {
  switch (node.type) {
  case 'Identifier':
    return node.name;
  case 'ThisExpression':
    return 'this';
  case 'MemberExpression':
    return Variable.extractName(node.object);
  case 'CallExpression':
  case 'NewExpression':
    return Variable.extractName(node.callee);
  }
  throw new Error('Invalid node type: ' + node.type);
};
