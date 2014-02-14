var estraverse = require('estraverse');
var Variable = require('./variable');
var Assignment = require('./assignment');


module.exports = Scope;

function Scope(node, parent) {
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

  var name = assignment.left.name;
  var scope = this;
  while (!(name in scope.variables) && scope.parent) {
    scope = scope.parent;
  }

  if (!scope.variables[name]) {
    scope.declare(assignment.left);
  }

  scope.variables[name].assignments.push(assignment);
};

Scope.prototype.reference = function(node) {
  if (!node) return;

  var isReferenceOnly = true;

  switch (node.type) {
  case 'MemberExpression':
    estraverse.traverse(node, {
      enter: function(n, parent) {
        switch (n.type) {
        case 'MemberExpression':
        case 'Identifier':
          return;
        }
        isReferenceOnly = false;
        this.break();
      }
    });

    if (isReferenceOnly) {
      this.references.push(node);
    } else {
      this.reference(node.object);
    }
    break;
  case 'Identifier':
    this.references.push(node);
    break;
  }
};

Scope.prototype.findVariable = function(name) {
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
