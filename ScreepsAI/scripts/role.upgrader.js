var actionMove = require('action.move');

var roleUpgrader = function (creep) {
    if (creep.memory.moving) {
        if (!actionMove.continueMove(creep)) {
            return;
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
        if (!creep.room.memory.energy.canUpgrade || creep.withdraw(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            actionMove.followPath(creep, contrConstr.pathTo.path.slice(0).reverse());
        }
        return;
    }
    if (creep.memory.state === 'upgrading') {
        var controller = creep.room.controller;
        if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            if (creep.pos.getRangeTo(controller.pos.x, controller.pos.y) < 3) {
                actionMove.moveTo(creep, controller.pos);
            } else {
                actionMove.followPath(creep, contrConstr.pathTo.path);
            }
        } else {
            creep.memory.moving = false;
        }
    }
}

module.exports = { roleUpgrader: roleUpgrader };
