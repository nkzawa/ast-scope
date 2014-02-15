var estraverse = require('estraverse');
var Variable = require('./variable');
var Assignment = require('./assignment');
var Reference = require('./reference');


module.exports = Scope;

function Scope(node, parent) {
  if (!Scope.isRequired(node)) {
    throw new Error('Invalid node type: ' + node.type);
  }

  this.node = node;
  this.parent = parent;
  this.children = [];
  this.variables = {};
  this.assignments = [];
  this.references = [];

  if (parent) {
    parent.children.push(this);
  }
}

Scope.isRequired = function(node) {
  switch (node.type) {
  case 'FunctionExpression':
  case 'FunctionDeclaration':
  case 'Program':
    return true;
  }
  return false;
};

Scope.prototype.createChild = function(node) {
  return new Scope(node, this);
};

Scope.prototype.declare = function(node, init) {
  var name = node.name;

  this.variables[name] = this.variables[name] || new Variable(node, this);

  if (init) {
    this.assign(init);
  }
};

Scope.prototype.assign = function(node) {
  var assignment = new Assignment(node, this);
  this.assignments.push(assignment);

  if (assignment.left.type !== 'Identifier') return;

  var variable = this.findVariable(assignment.left);
  if (variable) {
    variable.assignments.push(assignment);
  }
};

Scope.prototype.reference = function(node) {
  if (!node || !Reference.isRequired(node)) {
    return;
  }

  this.references.push(new Reference(node, this));
};

Scope.prototype.findVariable = function(name) {
  if (typeof name !== 'string') {
    name = name.name;
  }

  var scope = this;
  while (scope && !(name in scope.variables)) {
    scope = scope.parent;
  }
  return scope ? scope.variables[name] : null;
};

Scope.prototype.ancestors = function() {
  var ancestors = [];
  var scope = this.parent;
  while (scope) {
    ancestors.push(scope);
    scope = scope.parent;
  }
  return ancestors;
};
