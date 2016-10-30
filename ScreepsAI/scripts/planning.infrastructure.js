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
    //spawn needs to be last (rechargeSpots)!
    if (room.memory.spawn === undefined) {
        room.memory.spawn = constructionSpawn.createSpawn(room.find(FIND_MY_SPAWNS)[0], room);
    }
    checkBrokenStuff(room);
    if (room.memory.improveTo === undefined) {
        room.memory.improveTo = 0;
    }
    if (improveMine(room))
        return;
    if (improveSpawn(room))
        return;
    if (improveController(room))
        return;
    if (room.memory.improveTo < room.controller.level)
        room.memory.improveTo++;
}

///
/// MINE
///
var improveMine = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    for (var i = 0; i < room.memory.mines.length; i++) {
        //Tier 1
        if (room.memory.mines[i].improvedTo < 1 && room.memory.improveTo >= 1) {
            improvePath(room.memory.mines[i].pathToMine.path);
            room.memory.mines[i].improvedTo = 1;
            return true;
        }
        //Tier 2
        if (room.memory.mines[i].improvedTo < 2 && room.memory.improveTo >= 2) {
            for (var wp = 0; wp < room.memory.mines[i].workingPlaces.length; wp++) {
                var workingPlace = room.memory.mines[i].workingPlaces[wp];
                for (var dx = -1; dx <= 1; dx++) {
                    for (var dy = -1; dy <= 1; dy++) {
                        if (dy === 0 || dx === 0)
                            new RoomPosition(workingPlace.x + dx, workingPlace.y + dy, room.name).createConstructionSite(STRUCTURE_ROAD);
                    }
                }
            }
            room.memory.mines[i].improvedTo = 2;
            return true;
        }
    }
    return false;
}

///
/// Controller
///
var improveController = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    //Tier 1
    if (room.memory.controller.improvedTo < 1 && room.memory.improveTo >= 1) {
        improvePath(room.memory.controller.pathTo.path);
        room.memory.controller.improvedTo = 1;
        return true;
    }
    return false;
}

///
/// SPAWN
///
var improveSpawn = function (room) {
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    //Tier 1
    if (room.memory.spawn.improvedTo < 1 && room.memory.improveTo >= 1) {
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
    //Tier 2 - 8
    if (room.memory.spawn.improvedTo < room.memory.improveTo) {
        if (room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_TOWER; } }).length < CONTROLLER_STRUCTURES.tower[room.memory.improveTo]) {
            var ext = constructionSpawn.planExtension(room.memory.spawn, room);
            ext.createConstructionSite(STRUCTURE_TOWER);
            new RoomPosition(ext.x, ext.y + 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x, ext.y - 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x + 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x - 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
        } else if (room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } }).length < CONTROLLER_STRUCTURES.extension[room.memory.improveTo]) {
            var ext = constructionSpawn.planExtension(room.memory.spawn, room);
            ext.createConstructionSite(STRUCTURE_EXTENSION);
            new RoomPosition(ext.x, ext.y + 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x, ext.y - 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x + 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x - 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
        } else {
            room.memory.spawn.improvedTo = room.memory.improveTo;
        }
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