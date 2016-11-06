var actionMove = require('action.move');

var roleUpgrader = function (creep, storage) {
    storage = storage.concat(creep.room.find(FIND_MY_STRUCTURES, {filter: function(s) { return s.structureType === STRUCTURE_LINK && s.energy > 0}}));
    if (creep.memory.moving) {
        if (actionMove.continueMove(creep)) {
            if (!(creep.memory.state === 'upgrading' && creep.pos.getRangeTo(creep.room.controller.pos.x, creep.room.controller.pos.y) < 4)) {
                return;
            }
        }
    }
    //state machine
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling') {
        creep.memory.state = 'refilling';
    }
    if (creep.memory.state === 'refilling' && (creep.carry.energy === creep.carryCapacity || (creep.carry.energy > 0 && creep.room.controller.ticksToDowngrade < 1000))) {
        creep.memory.state = 'upgrading';
    }

    var contrConstr = creep.room.memory.controller;
    if (creep.memory.state === 'refilling') {
        if (storage.length > 0) {
            var myStor = creep.pos.findClosestByRange(storage);
            if (creep.withdraw(myStor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                actionMove.moveTo(creep, myStor.pos, 1);
            else
                creep.memory.state = 'upgrading';
        } else if (!creep.room.memory.energy.canUpgrade || creep.withdraw(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            actionMove.followPath(creep, contrConstr.pathTo.path.slice(0).reverse());
        }
        return;
    }
    if (creep.memory.state === 'upgrading') {
        var controller = creep.room.controller;
        if (creep.pos.getRangeTo(controller.pos.x, controller.pos.y) > 2) {
            if (creep.pos.getRangeTo(controller.pos.x, controller.pos.y) < 4) {
                actionMove.moveTo(creep, controller.pos, 1);
            } else {
                actionMove.followPath(creep, creep.room.memory.controller.pathTo.path);
            }
        } else {
            creep.upgradeController(controller);
            creep.memory.moving = false;
        }
    }
}

module.exports = { roleUpgrader: roleUpgrader };
