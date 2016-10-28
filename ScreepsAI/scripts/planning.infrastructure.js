var constructionController = require('construction.controller');
var constructionMine = require('construction.mine');
var constructionSpawn = require('construction.spawn');

var planRoomConstruction = function (room) {
    if (room.memory.mines === undefined) {
        room.memory.mines = [];
        var sources = room.find(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            constructionMine.scanMine(sources[i], room);
        }
        room.memory.mines.sort(function (a, b) { return a.pathToMine.cost - b.pathToMine.cost });
    }
    if (room.memory.controller === undefined) {
        room.memory.controller = constructionController.createController(room.controller, room);
    }
    if (room.memory.spawn === undefined) {
        room.memory.spawn = constructionSpawn.createSpawn(room.find(FIND_MY_SPAWNS)[0]);
    }
    checkBrokenStuff(room);
    if (improveSpawn(room))
        return;
    if (improveController(room))
        return;
    if (improveMine(room))
        return;
}

var improveMine = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    for (var i = 0; i < room.memory.mines.length; i++) {
        if (room.memory.mines[i].improvedTo < 1 && room.controller.level >= 1) {
            improvePath(room.memory.mines[i].pathToMine.path);
            room.memory.mines[i].improvedTo = 1;
            return true;
        }
    }
    return false;
}

var improveController = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    if (room.memory.controller.improvedTo < 1 && room.controller.level >= 1) {
        improvePath(room.memory.controller.pathTo.path);
        room.memory.controller.improvedTo = 1;
        return true;
    }
    return false;
}

var improveSpawn = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    if (room.memory.spawn.improvedTo < 1 && room.controller.level >= 1) {
        var spawn = Game.getObjectById(room.memory.spawn.resource.id);
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (dy !== 0 || dx !== 0) {
                    new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.room.name).createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }
        room.memory.spawn.improvedTo = 1;
        return true;
    }
    if (room.memory.spawn.improvedTo < 2 && room.controller.level >= 2) {
        var ext = constructionSpawn.planExtensions(room.memory.spawn, room, 2);
        for (var i = 0; i < ext.length; i++) {
            ext[i].createConstructionSite(STRUCTURE_EXTENSION);
        }
        //room.memory.spawn.improvedTo = 2;
        return true;
    }
    return false;
}

var checkBrokenStuff = function (room) {
    if (room.memory.repair === undefined) {
        room.memory.repair = [];
    }
    if (room.memory.repair.length > 0) {
        var repairObj = Game.getObjectById(room.memory.repair[0]);
        if (repairObj.hits === repairObj.hitsMax) {
            room.memory.repair.shift();
        }
    }
    var targets = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.hits < structure.hitsMax / 2;
        }
    });
    for (var i = 0; i < targets.length; i++) {
        if (room.memory.repair.indexOf(targets[i].id) === -1) {
            room.memory.repair.push(targets[i].id);
        }
    }
}

var improvePath = function (path) {
    for (var i = 0; i < path.length; i++) {
        new RoomPosition(path[i].x, path[i].y, path[i].roomName).createConstructionSite(STRUCTURE_ROAD);
    }
}

module.exports = {
    improveMine: improveMine,
    planRoomConstruction: planRoomConstruction
};