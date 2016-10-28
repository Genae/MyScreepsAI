var actionMove = require('action.move');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.moving) {
            if (!actionMove.continueMove(creep)) {
                return;
            }
        }
        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('refilling');
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('building');
        }

        if (creep.memory.building) {
            var target = creep.room.controller;
            if (target !== null) {
                if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
                    actionMove.moveTo(creep, target);
                }
            }
        }
        else {
            var sources = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy > 0;
                }
            });
            if (!creep.room.memory.energy.canUpgrade || creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, sources[0]);
            }
        }
    }
};

module.exports = roleUpgrader;