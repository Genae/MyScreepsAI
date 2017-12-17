let actionMove = require('action.move.new');
let actionUpgrading = require('action.upgrading');
let actionRefilling = require('action.refilling');

let roleBuilder = function (creep) {
    if (creep.memory.moving && creep.room.name === creep.memory.roomName) {
        if (actionMove.continueMove(creep)) {
            if (!(creep.memory.state === 'upgrading' && creep.pos.getRangeTo(creep.room.controller.pos.x, creep.room.controller.pos.y) < 4)) {
                return;
            }
        }
    } else
        creep.memory.moving = false;

    let construnctionSite = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: function (str) { return str.structureType === STRUCTURE_RAMPART && str.hits < 10000 }
    });
    if (construnctionSite === null)
        construnctionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    let wall = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: function (s) {
            return s.structureType === STRUCTURE_WALL && s.hits < creep.room.memory.structures.wallHitpoints;
        }
    });
    let repairTarget = null;
    if (creep.memory.state === 'repairing') {
        if (Game.rooms[creep.memory.roomName].memory.structures.repair.length === 0) {
            let targets = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: function(s) {
                    return (s.hits < s.hitsMax && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL) ||
                        (s.hits < creep.room.memory.wallHitpoints && (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL))
                }
            });
            if(targets.length > 0)
                repairTarget = targets[0];
        } else {
            repairTarget = Game.getObjectById(Game.rooms[creep.memory.roomName].memory.structures.repair[0]);
        }
    }
    //state machine
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling' || (repairTarget  === null && creep.memory.state === 'repairing') ||
        (wall === null && creep.memory.state === 'upgradeWalls')) {
        creep.memory.state = 'refilling';
    }

    if (creep.memory.state === 'refilling' && creep.carry.energy === creep.carryCapacity) {
        if (creep.room.memory.structures.repair.length > 0) {
            creep.memory.state = 'repairing';
        }
        else if (construnctionSite !== null) {
            creep.memory.state = 'building';
        }
        else if (wall !== null) {
            creep.memory.state = 'upgradeWalls';
        }
        else {
            creep.memory.state = 'upgrading';
        }
    }

    let spawn = Game.getObjectById(Game.rooms[creep.memory.roomName].memory.structures.spawn.obj.id);
    //run states
    if (creep.memory.state === 'refilling') {
        if (actionRefilling.doRefilling(creep, true) === 'nothingFound') {
            if (Game.rooms[creep.memory.roomName].memory.info.energy.canBuild && creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                actionMove.moveTo(creep, spawn.pos, 1);                    
        }
        return;
    }

    let target;
    if (creep.memory.state === 'building') {
        target = construnctionSite;
        if (target !== null) {
            let res = 0;
            if (construnctionSite.hits !== undefined) {
                res = creep.repair(target);
            } else {
                res = creep.build(target);
            }
            if (res === ERR_NOT_IN_RANGE) {
                actionMove.moveTo(creep, target.pos, 2);
            } else {
                creep.memory.moving = false;
            }
        } else {
            creep.memory.state = 'refilling';
        }
        return;
    }
    if (creep.memory.state === 'repairing') {
        target = repairTarget;
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, target.pos, 2);
        } else {
            creep.memory.moving = false;
        }
        return;
    }
    if (creep.memory.state === 'upgradeWalls') {
        target = wall;
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
            actionMove.moveTo(creep, target.pos, 2);
        } else {
            creep.memory.moving = false;
        }
        return;
    }
    if (creep.memory.state === 'upgrading') {
        actionUpgrading.doUpgrading(creep);
    }
};

module.exports = { roleBuilder: roleBuilder };