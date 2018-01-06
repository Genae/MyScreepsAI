let actionMove = require('action.move');

let doUpgrading = function (creep) {

    let controller = Game.rooms[creep.memory.roomName].controller;
    if (creep.room.name !== controller.room.name || creep.pos.getRangeTo(controller.pos.x, controller.pos.y) > 2) {
        if (creep.room.name !== controller.room.name)
            creep.moveTo(controller);
        else
            actionMove.moveTo(creep, controller.pos, 1);
    } else {
        creep.upgradeController(controller);
        creep.memory.moving = false;
    }
};

module.exports = {doUpgrading: doUpgrading};