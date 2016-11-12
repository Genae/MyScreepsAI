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
            if (Game.rooms[creep.memory.roomName].memory.thisJobs[creep.memory.job.flag] > 2) {
                planningJobs.findJob(creep, creep.room);
            }
        }
    }
    
    //state machine
    if (creep.memory.state === undefined) { // this has no state if energy > 0 && energy < max, so start at mining
        creep.memory.state = 'mining';
    }
    if (creep.carry.energy === 0) {
        creep.memory.state = 'mining';
    }
    var myflag = Game.flags[creep.memory.job.flag];
    var mysource = creep.pos.findClosestByRange(FIND_SOURCES);
    if (creep.carry.energy === creep.carryCapacity|| (mysource !== null && mysource.energy === 0 && creep.carry.energy> 0)) {
        creep.memory.state = 'emptying';
    }


    if (creep.memory.state === 'mining') {
        var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY, 30, {
            filter: function(e) { return e.amount > 1000 }
        });
        if (energy.length > 0) {
            if (creep.pickup(energy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(energy[0]);
                return;
            }
        }
        energy = creep.pos.findInRange(FIND_DROPPED_ENERGY, 2);
        if (energy.length > 0) {
            creep.pickup(energy[0]);
        }
        if (creep.pos.getRangeTo(myflag) > 1) {
            creep.moveTo(myflag);
        }
        else {
            var h = creep.harvest(mysource);
            if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
                creep.moveTo(mysource);
            }
        }
        
    }
    else if (creep.memory.state === 'emptying') {
        if (creep.pos.x > 1 && creep.pos.y > 1 && creep.pos.x < 48 && creep.pos.y < 48) {
            var constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3);
            if (constructionSites.length > 0) {
                creep.build(constructionSites[0]);
                return;
            }
            if (constructionSites.length > 0) {
                creep.build(constructionSites[0]);
                return;
            }
            var repairSites = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: function (s) {
                    return (s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL  && s.hits <= s.hitsMax - 2000) ||
                        ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && (creep.room.memory.wallHitpoints !== undefined && creep.room.memory.wallHitpoints > s.hits));
                }
            });
            if (repairSites.length > 0) {
                creep.repair(repairSites[0]);
                return;
            }
        }
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