let actionMove = require('action.move');
let planningJobs = require('planning.jobs');

let roleOutHarvester = function (creep) {
    if (creep.memory.job === undefined || Game.flags[creep.memory.job.flag] === undefined) {
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
    let myflag = Game.flags[creep.memory.job.flag];


    if (creep.memory.state === 'mining') {
        let energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 30, {
            filter: function(e) { return e.amount > 1000 }
        });
        if (energy.length > 0) {
            if (creep.pickup(energy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(energy[0]);
                return;
            }
        }
        energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2);
        if (energy.length > 0) {
            creep.pickup(energy[0]);
        }
        if (creep.pos.getRangeTo(myflag) > 1) {
            creep.moveTo(myflag);
        }
        else {
            let mysource = myflag.pos.findClosestByRange(FIND_SOURCES);
            if (creep.carry.energy === creep.carryCapacity || (mysource !== null && mysource.energy === 0 && creep.carry.energy > 0)) {
                creep.memory.state = 'emptying';
            }
            let h = creep.harvest(mysource);
            if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
                creep.moveTo(mysource);
            }
        }

    }
    else if (creep.memory.state === 'emptying') {
        if (creep.pos.x > 1 && creep.pos.y > 1 && creep.pos.x < 48 && creep.pos.y < 48) {
            let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 30, {filter: function(cs){return cs.structureType === STRUCTURE_SPAWN}});
            if (constructionSites.length > 0) {
                if (creep.build(constructionSites[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(constructionSites[0]);
                }
                return;
            }
            constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3);
            if (constructionSites.length > 0) {
                if (creep.build(constructionSites[0]) === OK) {
                    return;
                }
                creep.moveTo(constructionSites[0]);
            }
            let repairSites = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: function (s) {
                    return (s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL  && s.hits <= s.hitsMax - 2000) ||
                        ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && (creep.room.memory.structures.wallHitpoints !== undefined && creep.room.memory.structures.wallHitpoints > s.hits));
                }
            });
            if (repairSites.length > 0) {
                if (creep.repair(repairSites[0]) === OK) {
                    return;
                }
                creep.moveTo(repairSites[0]);
            }
        }
        let storage = Game.rooms[creep.memory.roomName].find(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return structure.structureType === STRUCTURE_STORAGE;
            }
        });
        if (storage.length > 0) {
            if (creep.transfer(storage[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage[0]);
            }
            return;
        }
        let ext = Game.rooms[creep.memory.roomName].find(FIND_MY_STRUCTURES, {
            filter: function (structure) {
                return structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity;
            }
        });
        let me = creep.pos.findClosestByRange(ext);
        if (me !== null) {
            if (creep.transfer(me, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(me);
            }
            return;
        }
        let mySpawn = Game.rooms[creep.memory.roomName].find(FIND_MY_SPAWNS)[0];
        if (creep.transfer(mySpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(mySpawn);
        }
    }
};

module.exports = { roleOutHarvester: roleOutHarvester };