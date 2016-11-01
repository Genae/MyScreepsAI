var actionMove = require('action.move');

var roleBuilder = function (creep) {
    if (creep.memory.moving) {
        if (actionMove.continueMove(creep)) {
            if (!(creep.memory.state === 'upgrading' && creep.pos.getRangeTo(creep.room.controller.pos.x, creep.room.controller.pos.y) < 4)) {
                return;
            }
        }
    }
    //state machine
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling' || (creep.room.memory.repair.length === 0 && creep.memory.state === 'repairing')) {
        creep.memory.state = 'refilling';
    }
    if (creep.memory.state === 'refilling' && creep.carry.energy === creep.carryCapacity) {
        if (creep.room.memory.repair.length > 0) {
            creep.memory.state = 'repairing';
        }
        else if (creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES) !== null) {
            creep.memory.state = 'building';
        }
        else {
            creep.memory.state = 'upgrading';
        }
    }

    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    //run states
    if (creep.memory.state === 'refilling') {
        //is this spot ok?
        for (var rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
                return;
            }
        }
        actionMove.moveToAny(creep, rechargeSpots.map(function (a) { return a.pos; }));
        return;
    }
    else if (creep.memory.rechargeSpot !== undefined) {
        rechargeSpots[creep.memory.rechargeSpot].reserved = false;
        creep.memory.rechargeSpot = undefined;
    }

    var target;
    if (creep.memory.state === 'building') {
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (target !== null) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, target.pos, 2);
            } else {
                creep.memory.moving = false;
            }
        } else {
            creep.memory.state = 'refilling';
        }
        return;
    }
    if (creep.memory.state === 'repairing') {
        target = Game.getObjectById(creep.room.memory.repair[0]);
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, target.pos, 2);
        } else {
            creep.memory.moving = false;
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

module.exports = { roleBuilder: roleBuilder };