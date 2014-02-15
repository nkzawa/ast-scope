var estraverse = require('estraverse');


exports.findOne = function(ast, condition) {
  if ('string' === typeof condition) {
    condition = {type: condition};
  }

  var result = null;
  var keys = Object.keys(condition);

  estraverse.traverse(ast, {
    enter: function(node) {
      var matched = keys.every(function(k) {
        return node[k] === condition[k];
      });

      if (!matched) return;

      result = node;
      this.break();
    }
  });
  return result;
};
