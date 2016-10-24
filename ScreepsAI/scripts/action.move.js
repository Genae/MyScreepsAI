var pIn = require('planning.infrastructure');

var moveTo = function (creep, pos) {
	creep.memory.path = creep.pos.findPathTo(pos);
	creep.memory.moving = true;
    continueMove(creep);
}
var continueMove = function (creep) {
	pIn.markMoved(creep.pos);
    var posOld = creep.pos;
    creep.moveByPath(creep.memory.path);
    if (posOld === creep.pos) { // no move needed/possible
        creep.memory.moving = false;
        return false;
    }
    return true;
}

module.exports = { moveTo: moveTo, continueMove: continueMove };