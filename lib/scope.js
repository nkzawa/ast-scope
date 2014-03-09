var estraverse = require('estraverse');
var Variable = require('./variable');
var Assignment = require('./assignment');
var Reference = require('./reference');


module.exports = Scope;

function Scope(node, parent) {
  if (node && !Scope.isRequired(node)) {
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
  } else {
    this.undefinedVariables = [];
  }
}

Scope.isRequired = function(node) {
  switch (node.type) {
  case 'FunctionExpression':
  case 'FunctionDeclaration':
  case 'Program':
  case 'CatchClause':
  case 'WithStatement':
    return true;
  }
  return false;
};

Scope.prototype.createChild = function(node) {
  return new Scope(node, this);
};

Scope.prototype.isVariableScope = function() {
  if (!this.node) return true;

  switch (this.node.type) {
  case 'FunctionExpression':
  case 'FunctionDeclaration':
  case 'Program':
    return true;
  }
  return false;
};

Scope.prototype.declare = function(node) {
  var scope = this.resolveVariableScope();
  var variable = scope.define(node.id);
  variable.declarations.push(node);
};

Scope.prototype.define = function(node) {
  var name = node.name;
  return this.variables[name] = this.variables[name] || new Variable(node, this);
};

Scope.prototype.assign = function(node) {
  var assignment = new Assignment(node, this);
  this.assignments.push(assignment);
};

Scope.prototype.reference = function(node) {
  if (!node || !Reference.isRequired(node)) {
    return;
  }

  this.references.push(new Reference(node, this));
};

Scope.prototype.undefined = function(node) {
  var name;
  if (typeof node === 'string') {
    name = node;
  } else {
    switch (node.type) {
    case 'Identifier':
      name = node.name;
      break;
    case 'ThisExpression':
      name = 'this';
      break;
    default:
      throw new Error('Invalid node type: ' + node.type);
    }
  }

  var scope;
  switch (name) {
  case 'this':
  case 'arguments':
    scope = this.resolveVariableScope();
    return scope.variables[name] = scope.variables[name] || new Variable(name, scope);
  }

  scope = this.ancestors().pop() || this;
  return scope.undefinedVariables[name] = scope.undefinedVariables[name] || new Variable(name);
};

Scope.prototype.resolveVariable = function(name) {
  if (typeof name !== 'string') {
    name = name.name;
  }

  var scope = this;
  while (!(name in scope.variables) && scope.parent) {
    scope = scope.parent;
  }
  return scope.variables[name] || scope.undefinedVariables[name];
};

Scope.prototype.resolveVariableScope = function() {
  var scope = this;
  while (scope && !scope.isVariableScope()) {
    scope = scope.parent;
  }
  return scope;
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
