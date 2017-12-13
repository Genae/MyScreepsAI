let actionMove = require('action.move');
let planningJobs = require('planning.jobs');

let roleHarvester = function (creep) {
    if (creep.memory.job === undefined) {
        planningJobs.findJob(creep, creep.room);
        if (creep.memory.job === undefined)
            return;
    }
    let mymine = creep.room.memory.structures.mines[creep.memory.job.mineIndex];
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
    let controller;
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
        if (h === ERR_NOT_IN_RANGE || h === ERR_NOT_ENOUGH_RESOURCES) {
            if (creep.pos.getRangeTo(mymine.obj.pos.x, mymine.obj.pos.y) < 3 && h === ERR_NOT_ENOUGH_RESOURCES) {
                return;
            }
            if (creep.pos.getRangeTo(mymine.obj.pos.x, mymine.obj.pos.y) < 3) {
                actionMove.moveToAny(creep, mymine.workingPlaces, 0);
            } else {
                actionMove.followPath(creep, mymine.pathToMine.path);
            }
        }
    }
    else if (creep.memory.state === 'emptying') {
        controller = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: function (s) { return s.structureType === STRUCTURE_CONTROLLER } });
        if (controller.length > 0) {
            creep.upgradeController(controller[0]);
        }
        let links = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: function (s) { return s.structureType === STRUCTURE_LINK && s.energy < s.energyCapacity } });
        if (links.length > 0) {
            creep.transfer(links[0], RESOURCE_ENERGY);
            creep.memory.state = 'mining';
        }
        else if (creep.transfer(creep.room.find(FIND_MY_SPAWNS)[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            let repairSites = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: function (s) {
                    return (s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL && s.hits <= s.hitsMax - 2000) ||
                        ((s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && (creep.room.memory.structures.wallHitpoints !== undefined && creep.room.memory.structures.wallHitpoints > s.hits));
                }
            });
            if (repairSites.length > 0) {
                creep.repair(repairSites[0]);
                return;
            }
            actionMove.followPath(creep, mymine.pathToMine.path.slice(0).reverse());
        }
    }
};

module.exports = { roleHarvester: roleHarvester };