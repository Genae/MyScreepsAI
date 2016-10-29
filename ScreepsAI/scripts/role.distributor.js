var actionMove = require('action.move');
var roleDistributor = function (creep) {
    if (creep.memory.moving) {
        if (!actionMove.continueMove(creep)) {
            return;
        }
    }

    var extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_EXTENSION &&
                        structure.energy < structure.energyCapacity;
        }
    });
    //state machine
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling' || (extensions.length === 0 && creep.carry.energy < creep.carryCapacity)) {
        creep.memory.state = 'refilling';
    }
    if (creep.memory.state === 'refilling' && creep.carry.energy === creep.carryCapacity) {
        if (extensions.length > 0) {
            creep.memory.state = 'injecting';
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
            creep.withdraw(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
        } else {
            actionMove.moveTo(creep, rechargeSpots[creep.memory.rechargeSpot].pos);
        }
        return;
    }
    else if (creep.memory.rechargeSpot !== undefined) {
        rechargeSpots[creep.memory.rechargeSpot].reserved = false;
        creep.memory.rechargeSpot = undefined;
    }

    if (creep.memory.state === 'injecting') {
        if (creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, extensions[0].pos);
        }
        return;
    }
}

module.exports = {roleDistributor: roleDistributor}