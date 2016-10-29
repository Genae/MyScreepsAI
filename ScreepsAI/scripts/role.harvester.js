var actionMove = require('action.move');
var planningJobs = require('planning.jobs');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.job === undefined) {
            planningJobs.findJob(creep, creep.room);
            if (creep.memory.job === undefined)
                return;
        }
        if (creep.room.memory.thisJobs[creep.memory.job.mineIndex] === undefined) {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex] = 1;
        } else {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex]++;
        }
        if (creep.memory.moving) {
            if (!actionMove.continueMove(creep)) {
                return;
            }
        }

        var mymine = creep.room.memory.mines[creep.memory.job.mineIndex];
        if (creep.carry.energy < creep.carryCapacity) {
            var mysource = Game.getObjectById(mymine.resource.id);
            if (creep.harvest(mysource) == ERR_NOT_IN_RANGE) {
                if (creep.pos.getRangeTo(mymine.resource.pos.x, mymine.resource.pos.y) < 3) {
                    actionMove.moveTo(creep, mysource.pos);
                } else {
                    actionMove.followPath(creep, mymine.pathToMine.path);
                }
            }
        }
        else {
            if (creep.transfer(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                actionMove.followPath(creep, mymine.pathToMine.path.slice(0).reverse());
            }
        }
    }

};

module.exports = roleHarvester;