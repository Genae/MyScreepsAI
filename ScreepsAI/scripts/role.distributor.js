var actionMove = require('action.move');
var roleDistributor = {

    /** @param {Creep} creep **/
    run: function (creep) {
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
        if (extensions.length === 0)
            return;
        if (creep.carry.energy === 0) {
            if (creep.withdraw(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, creep.room.find(FIND_MY_SPAWNS)[0]);
            }
        } else {
            if (creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, extensions[0]);
            }
        }
    }

};

module.exports = roleDistributor;