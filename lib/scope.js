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
    this.unscopedVariables = [];
  }
}

Scope.isRequired = function(node) {
  if (Scope.isVariableScopeRequired(node)) {
    return true;
  }

  switch (node.type) {
  case 'CatchClause':
  case 'WithStatement':
    return true;
  }
  return false;
};

Scope.isVariableScopeRequired = function(node) {
  switch (node.type) {
  case 'FunctionExpression':
  case 'FunctionDeclaration':
  case 'Program':
    return true;
  }
  return false;
};

Scope.prototype.hoist = function(ast) {
  var self = this;

  estraverse.traverse(ast || this.node, {
    enter: function(node, parent) {
      if (node === self.node) return;

      switch (node.type) {
      case 'VariableDeclarator':
      case 'FunctionDeclaration':
        self.declare(node);
        break;
      }

      if (Scope.isVariableScopeRequired(node)) {
        this.skip();
      }
    }
  });
};

Scope.prototype.createChild = function(node) {
  return new Scope(node, this);
};

Scope.prototype.isVariableScope = function() {
  if (!this.node) return true;
  return Scope.isVariableScopeRequired(this.node);
};

Scope.prototype.declare = function(node) {
  var variable = this.define(node.id);
  variable.declarations.push(node);
};

Scope.prototype.define = function(node) {
  var name;
  if (typeof node === 'string') {
    name = node;
    node = null;
  } else {
    name = node.name;
  }

  return this.variables[name] = this.variables[name] || new Variable(node || name, this);
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

  switch (name) {
  case 'this':
  case 'arguments':
    return this.resolveVariableScope().define(name);
  }

  var scope = this.ancestors().pop() || this;
  return scope.unscopedVariables[name] = scope.unscopedVariables[name] || new Variable(name);
};

Scope.prototype.resolveVariable = function(name) {
  if (typeof name !== 'string') {
    name = name.name;
  }

  var scope = this;
  while (!(name in scope.variables) && scope.parent) {
    scope = scope.parent;
  }
  return scope.variables[name] || scope.unscopedVariables[name];
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
