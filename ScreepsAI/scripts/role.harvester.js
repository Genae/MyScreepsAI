let actionMove = require('action.move.new');
let planningJobs = require('planning.jobs');
let storageHelper = require('util.storageHelper');
let actionUpgrading = require('action.upgrading');

let roleHarvester = function (creep) {

    let mymine = findMineToWork(creep);
    if (mymine === undefined)
        return;
    if (creep.memory.state === 'emptying')
        checkRepair(creep);      
        
    if (actionMove.continueMove(creep))
        return; // just move
    
    if (creep.room.memory.info.energy.fullSpawn > 5 && creep.memory.state === 'emptying')
        actionUpgrading.doUpgrading(creep);

    let controller;
    //state machine
    if (creep.memory.state === undefined) { // this has no state if energy > 0 && energy < max, so start at mining
        creep.memory.state = 'mining';
    }
    if (creep.carry.energy < creep.carryCapacity * 0.05) {
        creep.memory.state = 'mining';
    }
    let mysource = Game.getObjectById(mymine.obj.id);
    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'emptying';
    }


    if (creep.memory.state === 'mining') {
        let energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 30, {
            filter: function (e) { return e.amount > 1000 }
        });
        if (energy.length > 0) {
            if (creep.pickup(energy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(energy[0]);
                return;
            }
        }
        let h = creep.harvest(mysource);
        if (h === ERR_NOT_ENOUGH_RESOURCES) {
            if (creep.pos.getRangeTo(mymine.obj.pos) > 2)
                actionMove.moveTo(creep, mymine.obj.pos, 1);
            return;
        }
        if (h === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, mymine.obj.pos, 1);
        }
    }
    else if (creep.memory.state === 'emptying') {
        let stor = storageHelper.getStorageToFill(creep);
        if (creep.transfer(stor, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, stor.pos, 1);
        }
    }
};

let findMineToWork = function (creep) {
    if (creep.memory.job === undefined) {
        planningJobs.findJob(creep, creep.room);
        if (creep.memory.job === undefined)
            return undefined;
    }
    let mymine = creep.room.memory.structures.mines[creep.memory.job.mineIndex];
    if (creep.ticksToLive > 100) {
        if (creep.room.memory.thisJobs[creep.memory.job.mineIndex] === undefined) {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex] = 1;
        } else {
            creep.room.memory.thisJobs[creep.memory.job.mineIndex]++;
            if (creep.room.memory.thisJobs[creep.memory.job.mineIndex] > mymine.workingPlaces.length + 1) {
                creep.memory.job = undefined;
                return findMineToWork(creep);
            }
        }
    }
    return mymine;
};

let checkRepair = function (creep) {
    let repairSites = creep.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: function (s) {
            return (s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL  && s.hits <= s.hitsMax - 2000) ||
                ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && (creep.room.memory.structures.wallHitpoints !== undefined && creep.room.memory.structures.wallHitpoints > s.hits) ||
                    (s.structureType === STRUCTURE_ROAD && s.hits <= s.hitsMax - 500));
        }
    });
    if (repairSites.length > 0) {
        if (creep.repair(repairSites[0]) === OK) {
            return;
        }
        creep.moveTo(repairSites[0]);
    }
};

module.exports = { roleHarvester: roleHarvester };