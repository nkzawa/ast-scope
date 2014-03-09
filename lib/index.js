
var estraverse = require('estraverse');
var Scope = require('./scope');


exports.analyze = function(ast) {
  var topScope, scope;

  if (ast.type !== 'Program') {
    // Create a top level scope.
    topScope = scope = new Scope();
  }

  estraverse.traverse(ast, {
    enter: function(node, parent) {
      if (Scope.isRequired(node)) {
        scope = scope ? scope.createChild(node) : new Scope(node);
        if (!topScope) {
          topScope = scope;
        }
      }

      switch (node.type) {
      case 'AssignmentExpression':
        scope.assign(node);
        scope.reference(node.left);
        scope.reference(node.right);
        break;

      case 'ArrayExpression':
        node.elements.forEach(scope.reference.bind(scope));
        break;

      case 'BlockStatement':
        break;

      case 'BinaryExpression':
        scope.reference(node.left);
        scope.reference(node.right);
        break;

      case 'BreakStatement':
        break;

      case 'CallExpression':
        node.arguments.forEach(scope.reference.bind(scope));
        break;

      case 'CatchClause':
        scope.define(node.param);
        break;

      case 'ConditionalExpression':
        scope.reference(node.test);
        scope.reference(node.consequent);
        scope.reference(node.alternate);
        break;

      case 'ContinueStatement':
        break;

      case 'DirectiveStatement':
        break;

      case 'DoWhileStatement':
        scope.reference(node.test);
        break;

      case 'DebuggerStatement':
        break;

      case 'EmptyStatement':
        break;

      case 'ExpressionStatement':
        scope.reference(node.expression);
        break;

      case 'ForStatement':
        scope.reference(node.init);
        scope.reference(node.test);
        scope.reference(node.update);
        break;

      case 'ForInStatement':
        scope.reference(node.left);
        scope.reference(node.right);
        break;

      case 'FunctionDeclaration':
        scope.parent.declare(node);
        scope.parent.assign(node);
        scope.parent.reference(node.id);
        node.params.forEach(function(param) {
          scope.define(param);
        });
        break;

      case 'FunctionExpression':
        node.params.forEach(function(param) {
          scope.define(param);
        });
        break;

      case 'Identifier':
        break;

      case 'IfStatement':
        scope.reference(node.test);
        break;

      case 'Literal':
        break;

      case 'LabeledStatement':
        break;

      case 'LogicalExpression':
        scope.reference(node.left);
        scope.reference(node.right);
        break;

      case 'MemberExpression':
        break;

      case 'NewExpression':
        node.arguments.forEach(scope.reference.bind(scope));
        break;

      case 'ObjectExpression':
        break;

      case 'Program':
        break;

      case 'Property':
        scope.reference(node.value);
        break;

      case 'ReturnStatement':
        scope.reference(node.argument);
        break;

      case 'SequenceExpression':
        node.expressions.forEach(scope.reference.bind(scope));
        break;

      case 'SwitchStatement':
        scope.reference(node.discriminant);
        break;

      case 'SwitchCase':
        scope.reference(node.test);
        break;

      case 'ThisExpression':
        break;

      case 'ThrowStatement':
        scope.reference(node.argument);
        break;

      case 'TryStatement':
        break;

      case 'UnaryExpression':
        scope.reference(node.argument);
        break;

      case 'UpdateExpression':
        scope.reference(node.argument);
        break;

      case 'VariableDeclaration':
        break;

      case 'VariableDeclarator':
        scope.declare(node);
        if (node.init) {
          scope.assign(node);
          scope.reference(node.id);
          scope.reference(node.init);
        }
        break;

      case 'WhileStatement':
        scope.reference(node.test);
        break;

      case 'WithStatement':
        scope.reference(node.object);
        break;
      }
    },
    leave: function(node, parent) {
      if (Scope.isRequired(node)) {
        scope = scope.parent;
      }
    }
  });

  return topScope;
};
