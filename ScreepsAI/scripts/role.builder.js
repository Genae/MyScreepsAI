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
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling' || (Game.rooms[creep.memory.roomName].memory.repair.length === 0 && creep.memory.state === 'repairing')) {
        creep.memory.state = 'refilling';
    }
    let construnctionSite = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: function (str) { return str.structureType === STRUCTURE_RAMPART && str.hits < 10000 }
    });
    if (construnctionSite === null)
        construnctionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    let wall = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: function (s) {
            return s.structureType === STRUCTURE_WALL && s.hits < creep.room.memory.wallHitpoints;
        }
    });
    if (creep.memory.state === 'refilling' && creep.carry.energy === creep.carryCapacity) {
        if (creep.room.memory.repair.length > 0) {
            creep.memory.state = 'repairing';
        }
        else if (construnctionSite !== null) {
            creep.memory.state = 'building';
        }
        else if (wall !== null) {
            creep.memory.state = 'upgradeWalls';
        }
        else {
            creep.memory.state = 'upgrading';
        }
    }

    var rechargeSpots = Game.rooms[creep.memory.roomName].memory.spawn.rechargeSpots;
    //run states
    if (creep.memory.state === 'refilling') {
        //is this spot ok?
        for (var rs = 0; rs < rechargeSpots.length; rs++) {
            if (rechargeSpots[rs].pos.x === creep.pos.x && rechargeSpots[rs].pos.y === creep.pos.y) {
                creep.withdraw(Game.getObjectById(Game.rooms[creep.memory.roomName].memory.spawn.resource.id), RESOURCE_ENERGY);
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
        target = construnctionSite;
        if (target !== null) {
            var res = 0;
            if (construnctionSite.hits !== undefined) {
                res = creep.repair(target);
            } else {
                res = creep.build(target);
            }
            if (res == ERR_NOT_IN_RANGE) {
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
        target = Game.getObjectById(Game.rooms[creep.memory.roomName].memory.repair[0]);
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, target.pos, 2);
        } else {
            creep.memory.moving = false;
        }
        return;
    }
    if (creep.memory.state === 'upgradeWalls') {
        target = wall;
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