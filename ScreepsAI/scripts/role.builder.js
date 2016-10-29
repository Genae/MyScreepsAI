var actionMove = require('action.move');

var roleBuilder = function (creep) {
    if (creep.memory.moving) {
        if (!actionMove.continueMove(creep)) {
            return;
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
            //creep.memory.state = 'upgrading';
            //creep.say('upgrading');
        }
    }

    var rechargeSpots = creep.room.memory.spawn.rechargeSpots;
    //run states
    if (creep.memory.state === 'refilling') {
        //find spot
        if (creep.memory.rechargeSpot === undefined) {
            for (var i = 0; i < rechargeSpots.length; i++) {
                if (!rechargeSpots[i].reserved) {
                    rechargeSpots[i].reserved = true;
                    creep.memory.rechargeSpot = i;
                    break;
                }
            }
        }
        if (creep.memory.rechargeSpot === undefined)
            return;
        if (rechargeSpots[creep.memory.rechargeSpot].pos.x === creep.pos.x && rechargeSpots[creep.memory.rechargeSpot].pos.y === creep.pos.y) {
            if (creep.room.memory.energy.canBuild) {
                creep.withdraw(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
            }
        } else {
            actionMove.moveTo(creep, rechargeSpots[creep.memory.rechargeSpot].pos);
        }
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
                actionMove.moveTo(creep, target.pos);
            } else {
                creep.memory.moving = false;
            }
        }
        return;
    }
    if (creep.memory.state === 'repairing') {
        target = Game.getObjectById(creep.room.memory.repair[0]);
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, target.pos);
        } else {
            creep.memory.moving = false;
        }
        return;
    }
}

module.exports = { roleBuilder: roleBuilder };