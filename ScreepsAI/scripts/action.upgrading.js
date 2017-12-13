let actionMove = require('action.move');

let doUpgrading = function (creep) {

    let controller = creep.room.controller;
    if (creep.pos.getRangeTo(controller.pos.x, controller.pos.y) > 2) {
        actionMove.moveTo(creep, controller.pos, 1);
    } else {
        creep.upgradeController(controller);
        creep.memory.moving = false;
    }
};

module.exports = {doUpgrading: doUpgrading};