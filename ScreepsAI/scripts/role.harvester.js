var actionMove = require('action.move');
var planningJobs = require('planning.jobs');

var roleHarvester = function (creep) {
    if (creep.memory.job === undefined) {
        planningJobs.findJob(creep, creep.room);
        if (creep.memory.job === undefined)
            return;
    }
    var mymine = creep.room.memory.mines[creep.memory.job.mineIndex];
    if (creep.ticksToLive > 100) {
        if (creep.room.memory.thisJobs[creep.memory.job.mineIndex] === undefined) {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex] = 1;
        } else {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex]++;
            if (creep.room.memory.thisJobs[creep.memory.job.mineIndex] > mymine.workingPlaces.length + 1) {
                creep.memory.job = undefined;
                roleHarvester(creep);
            }
        }
    }

    if (creep.memory.moving) {
        if (actionMove.continueMove(creep)) {
            return;
        }
    }
    //state machine
    if (creep.memory.state === undefined) { // this has no state if energy > 0 && energy < max, so start at mining
        creep.memory.state = 'mining';
    }
    if (creep.carry.energy < creep.carryCapacity * 0.2) {
        creep.memory.state = 'mining';
    }
    var mysource = Game.getObjectById(mymine.resource.id);
    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'emptying';
    }


    if (creep.memory.state === 'mining') {
        var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY, 30, {
            filter: function (e) { return e.amount > 1000 }
        });
        if (energy.length > 0) {
            if (creep.pickup(energy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(energy[0]);
                return;
            }
        }
        var h = creep.harvest(mysource);
        if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
            if (creep.pos.getRangeTo(mymine.resource.pos.x, mymine.resource.pos.y) < 3 && h === ERR_NOT_ENOUGH_RESOURCES) {
                return;
            }
            if (creep.pos.getRangeTo(mymine.resource.pos.x, mymine.resource.pos.y) < 3) {
                actionMove.moveTo(creep, mysource.pos, 1);
            } else {
                actionMove.followPath(creep, mymine.pathToMine.path);
            }
        }
    }
    else if (creep.memory.state === 'emptying') {
        var links = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: function (s) { return s.structureType === STRUCTURE_LINK && s.energy < s.energyCapacity } });
        if (links.length > 0) {
            creep.transfer(links[0], RESOURCE_ENERGY);
            creep.memory.state = 'mining';
        }
        else if (creep.transfer(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            actionMove.followPath(creep, mymine.pathToMine.path.slice(0).reverse());
        }
    }
}

module.exports = { roleHarvester: roleHarvester };