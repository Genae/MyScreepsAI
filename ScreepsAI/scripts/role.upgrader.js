let actionMove = require('action.move');
let actionUpgrading = require('action.upgrading');
let actionRefilling = require('action.refilling');

let roleUpgrader = function (creep) {
    if (creep.memory.moving) {
        if (actionMove.continueMove(creep)) {
            if (!(creep.memory.state === 'upgrading' && creep.pos.getRangeTo(creep.room.controller.pos.x, creep.room.controller.pos.y) < 4)) {
                return;
            }
        }
    }
    //state machine
    if (creep.carry.energy === 0 && creep.memory.state !== 'refilling') {
        creep.memory.state = 'refilling';
    }
    if (creep.memory.state === 'refilling' && (creep.carry.energy === creep.carryCapacity || (creep.carry.energy > 0 && creep.room.controller.ticksToDowngrade < 1000))) {
        creep.memory.state = 'upgrading';
    }

    let contrConstr = creep.room.memory.structures.controller;
    if (creep.memory.state === 'refilling') {
        if (actionRefilling.doRefilling(creep, creep.room.storage !== null && creep.room.storage !== undefined))
            creep.memory.state = 'upgrading';
    }
    else if (creep.memory.state === 'upgrading') {
        actionUpgrading.doUpgrading(creep);
    }
};

module.exports = { roleUpgrader: roleUpgrader };
