
module.exports = Assignment;

function Assignment(node, scope) {
  if (!Assignment.isRequired(node)) {
    throw new Error('Invalid node type: ' + node.type);
  }

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
    this.operator = '=';
    this.left = node.id;
    this.right = node.init;
    break;
  }
}

Assignment.isRequired = function(node) {
  switch (node.type) {
  case 'AssignmentExpression':
  case 'FunctionDeclaration':
    return true;
  case 'VariableDeclarator':
    return !!node.init;
  }
  return false;
};
