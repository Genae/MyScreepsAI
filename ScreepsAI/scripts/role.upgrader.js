var actionMove = require('action.move');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.moving) {
            if (!actionMove.continueMove(creep)) {
                return;
            }
        }

        var contrConstr = creep.room.memory.controller;
        if (creep.carry.energy > 0) {
            var controller = creep.room.controller;
            if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                if (creep.pos.getRangeTo(controller.pos.x, controller.pos.y) < 3) {
                    actionMove.moveTo(creep, controller.pos);
                } else {
                    actionMove.followPath(creep, contrConstr.pathTo.path);
                }
            }
        }
        else {
            if (!creep.room.memory.energy.canUpgrade || creep.withdraw(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                actionMove.followPath(creep, contrConstr.pathTo.path.slice(0).reverse());
            }
        }
    }

};

module.exports = roleHarvester;