var actionMove = require('action.move');
var planningJobs = require('planning.jobs');

var roleOutHarvester = function (creep) {
    if (creep.memory.job === undefined) {
        planningJobs.findJob(creep, creep.room);
        if (creep.memory.job === undefined)
            return;
    }
    if (creep.ticksToLive > 100) {
        if (Game.rooms[creep.memory.roomName].memory.thisJobs[creep.memory.job.flag] === undefined) {
            Game.rooms[creep.memory.roomName].memory.thisJobs[creep.memory.job.flag] = 1;
        } else {
            Game.rooms[creep.memory.roomName].memory.thisJobs[creep.memory.job.flag]++;
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
    if (creep.carry.energy === 0) {
        creep.memory.state = 'mining';
    }
    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'emptying';
    }


    var myflag = Game.flags[creep.memory.job.flag];
    if (creep.memory.state === 'mining') {
        if (creep.pos.getRangeTo(myflag) > 1) {
            creep.moveTo(myflag);
        }
        else {
            var mysource = creep.pos.findClosestByRange(FIND_SOURCES);
            var h = creep.harvest(mysource);
            if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
                creep.moveTo(mysource);
            }
        }
        
    }
    else if (creep.memory.state === 'emptying') {
        var storage = Game.rooms[creep.memory.roomName].find(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return structure.structureType === STRUCTURE_STORAGE;
            }
        });
        if (storage.length > 0) {
            if (creep.transfer(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(storage[0]);
            }
        }
        else {
            var mySpawn = Game.rooms[creep.memory.roomName].find(FIND_MY_SPAWNS)[0];
            if (creep.transfer(mySpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(mySpawn);
            }
            
        }
    }
}

module.exports = { roleOutHarvester: roleOutHarvester };