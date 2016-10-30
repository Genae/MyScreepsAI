var actionMove = require('action.move');
var roleDistributor = function (creep) {
    if (creep.memory.moving) {
        if (!actionMove.continueMove(creep)) {
            return;
        }
    }

    var extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity) ||
                   (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity && creep.room.memory.canBuild);
        }
    });
    var droppedEnergy = droppedEnergy = creep.room.find(FIND_DROPPED_ENERGY, {
        filter: (energy) => {
            return (energy.amount > 50);
        }
    });

    //state machine
    if (creep.memory.state === undefined) {
        creep.memory.state = 'emptying';
    }
    if (creep.carry.energy < creep.carryCapacity && (creep.memory.state !== 'collecting' || droppedEnergy.length === 0) && extensions.length > 0) {
        creep.memory.state = 'refilling';
    }
    if (creep.memory.state !== 'injecting' && creep.memory.state !== 'collecting' && extensions.length > 0 && creep.carry.energy >= extensions[0].energyCapacity - extensions[0].energy) {
        if (extensions.length > 0) {
            creep.memory.state = 'injecting';
        }
    }
    else if (extensions.length === 0 && creep.carry.energy > 0) {
        creep.memory.state = 'emptying';
    }
    else if (extensions.length === 0) {
        if (droppedEnergy.length > 0) {
            creep.memory.state = 'collecting';
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

    if (creep.memory.state === 'emptying') {
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
            creep.transfer(Game.getObjectById(creep.room.memory.spawn.resource.id), RESOURCE_ENERGY);
        } else {
            actionMove.moveTo(creep, rechargeSpots[creep.memory.rechargeSpot].pos);
        }
        return;
    }

    if (creep.memory.state === 'collecting') {
        if (creep.pickup(droppedEnergy[0]) == ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, droppedEnergy[0].pos);
        }
        return;
    }
}

module.exports = {roleDistributor: roleDistributor}