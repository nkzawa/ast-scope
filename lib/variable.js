
module.exports = Variable;

function Variable(node, scope) {
  switch (node.type) {
    case 'Identifier':
    case 'ThisExpression':
      break;
    default:
      throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.scope = scope;
  this.assignments = [];
  this.references = [];
}
