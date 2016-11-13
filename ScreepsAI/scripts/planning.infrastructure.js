var constructionController = require('construction.controller');
var constructionMine = require('construction.mine');
var constructionSpawn = require('construction.spawn');
var constructionWalls = require('construction.walls');
var constructionLink = require('construction.link');
var constructionMineral = require('construction.mineral');

var planRoomConstruction = function (room) {
    if (room.memory.mines === undefined) {
        room.memory.mines = [];
        var sources = room.find(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            constructionMine.scanMine(sources[i], room);
        }
        room.memory.mines.sort(function (a, b) { return a.pathToMine.cost - b.pathToMine.cost });
    }

    if (room.memory.mineral === undefined && room.find(FIND_MINERALS).length > 0)
    {
        room.memory.mineral = constructionMineral.createMineral(room);
    }

    if (room.memory.links === undefined) {
        room.memory.links = [];
    }
    var links = room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType === STRUCTURE_LINK } });
    if (room.memory.links.length < links.length) {
        room.memory.links = [];
        for (let i = 0; i < links.length; i++) {
            room.memory.links.push(constructionLink.createLink(links[i]));
        }
    }

    if (room.memory.controller === undefined) {
        room.memory.controller = constructionController.createController(room.controller, room);
    }
    //spawn needs to be last (rechargeSpots)!
    if (room.memory.spawn === undefined) {
        room.memory.spawn = constructionSpawn.createSpawn(room.find(FIND_MY_SPAWNS)[0], room);
    }
    if (room.memory.walls === undefined) {
        room.memory.walls = constructionWalls.createWalls(room, TOP);
        room.memory.walls = room.memory.walls.concat(constructionWalls.createWalls(room, RIGHT));
        room.memory.walls = room.memory.walls.concat(constructionWalls.createWalls(room, BOTTOM));
        room.memory.walls = room.memory.walls.concat(constructionWalls.createWalls(room, LEFT));
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
    if (improveOuterMines(room))
        return;
    if (improveMinerals(room))
        return;
    if (room.memory.improveTo < room.controller.level) {
        room.memory.improveTo++;
        return;
    }

    //if there is nothing else to do: improve wallstrength
    if (improveDefense(room))
        return;
    if (room.memory.wallHitpoints < 1000000) {
        var newHits = room.memory.wallHitpoints + 100000;
        room.memory.wallHitpoints = Math.min(newHits, RAMPART_HITS_MAX[room.controller.level]/10);
    }
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
/// OuterMine
///
var improveOuterMines = function (room) {
    var spawn = Game.getObjectById(room.memory.spawn.resource.id);
    for (var flagName in Game.flags) {
        var flag = Game.flags[flagName];
        if (flag.color === COLOR_BROWN && Memory.rooms[flag.pos.roomName].masterRoom === room.name) {
            if (flag.memory.improvedTo === undefined)
                flag.memory.improvedTo = 0;
            if (flag.memory.improvedTo === 0 && room.memory.improveTo >= 4) {
                var p = findPathUsingRoads(spawn.pos, { pos: flag.pos, range: 0 });
                if (p !== null) {
                    improvePath(p.path);
                    flag.memory.improvedTo = 1;
                }
            }
        }
    }
    return false;
}

///
/// Minerals
///
var improveMinerals = function (room) {
    if (room.memory.minerals === undefined)
        return false;
    var mineral = Game.getObjectById(room.memory.mineral.resource.id);
    var spawn = Game.getObjectById(room.memory.spawn.resource.id);
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    //Tier 1
    if (room.memory.mineral.improvedTo < 1 && room.memory.improveTo >= 1 && room.controller.level >= 6) {
        var p = findPathUsingRoads(spawn.pos, { pos: mineral.pos, range: 1 });
        if (p !== null) {
            improvePath(p.path);
            room.memory.mineral.improvedTo = 1;
            return true;
        }
    }
    //Tier 2
    if (room.memory.mineral.improvedTo < 2 && room.memory.improveTo >= 2 && room.controller.level >= 6) {
        mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
        room.memory.mineral.improvedTo = 2;
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

/////////////
// Defense
////////////
var improveDefense = function (room) {
    //always build ramparts under towers
    var preotectedStructures = room.find(FIND_MY_STRUCTURES, {
        filter: function(s) { return s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_SPAWN}
    });
    for (let i = 0; i < preotectedStructures.length; i++) {
        preotectedStructures[i].pos.createConstructionSite(STRUCTURE_RAMPART);
    }
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    let wall = room.find(FIND_STRUCTURES, {
        filter: function (s) {
            return s.structureType === STRUCTURE_WALL && s.hits < room.memory.wallHitpoints;
        }
    });
    if (wall.length > 0) {
        return true;
    }

    if (room.memory.improveTo >= 4) {
        var spawn = Game.getObjectById(room.memory.spawn.resource.id);
        for (let i = 0; i < room.memory.walls.length; i++) {
            var myWall = room.memory.walls[i];
            if (myWall.improvedTo === 0) {
                let path = spawn.pos.findPathTo(myWall.exits[0].x, myWall.exits[0].y, {
                    ignoreCreeps: true
                });
                improvePath(path, room);
                myWall.improvedTo = 1;
                return true;
            }
            else if (myWall.improvedTo === 1) {
                if (myWall.exits.length === 2) {
                    let path = spawn.pos.findPathTo(myWall.exits[1].x, myWall.exits[1].y, {
                        ignoreCreeps: true
                    });
                    improvePath(path, room);
                }
                myWall.improvedTo = 2;
                return true;
            }
            else if (myWall.improvedTo === 2) {
                for (let p = 0; p < myWall.walls.length; p++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            var hasRampart = false;
                            var pos = new RoomPosition(myWall.walls[p].pos.x + dx, myWall.walls[p].pos.y + dy, myWall.walls[p].pos.roomName);
                            var stuff = pos.lookFor(LOOK_STRUCTURES);
                            for (let i = 0; i < stuff.length; i++) {
                                if (stuff[i].structureType === STRUCTURE_RAMPART) {
                                    hasRampart = true;
                                    break;
                                }
                                if (stuff[i].structureType === STRUCTURE_ROAD) {
                                    if (pos.createConstructionSite(STRUCTURE_RAMPART) !== OK) {
                                        return true;
                                    }
                                    room.memory.wallHitpoints = 100000;
                                    hasRampart = true;
                                    break;
                                }
                            }
                            if (!hasRampart) {
                                if (pos.createConstructionSite(STRUCTURE_WALL) !== OK) {
                                    return true;
                                }
                                room.memory.wallHitpoints = 100000;
                            }
                        }
                    }
                    
                }
                myWall.improvedTo = 3;
                return true;
            }
        }
    }
    return false;
}

var checkBrokenStuff = function (room) {
    if (room.memory.repair === undefined) {
        room.memory.repair = [];
    }
    if (room.memory.repair.length > 0) {
        var repairObj = Game.getObjectById(room.memory.repair[0]);
        if (repairObj === null || repairObj === undefined) {
            room.memory.repair.shift();
        }
        else if (repairObj.hits === repairObj.hitsMax || (repairObj.structureType === STRUCTURE_RAMPART && repairObj.hits >= room.memory.wallHitpoints)) {
            room.memory.repair.shift();
        }
    }
    var targets = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.hits < structure.hitsMax / 2 && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART) ||
                    structure.structureType === STRUCTURE_RAMPART && structure.hits < room.memory.wallHitpoints - 30000;
        }
    });
    for (let i = 0; i < targets.length; i++) {
        if (room.memory.repair.indexOf(targets[i].id) === -1) {
            room.memory.repair.push(targets[i].id);
        }
    }
}

var improvePath = function (path, room) {
    for (var i = 0; i < path.length; i++) {
        var pos = new RoomPosition(path[i].x, path[i].y, (room === undefined ? path[i].roomName : room.name));
        pos.createConstructionSite(STRUCTURE_ROAD);
    }
}

var findPathUsingRoads = function (start, goals) {
    var roomMissing = false;
    var res = PathFinder.search(
        start, goals,
        {
            plainCost: 2,
            swampCost: 10,

            roomCallback: function(roomName) {
                let room = Game.rooms[roomName];
                if (!room) {
                    roomMissing = true;
                    return 1;
                }
                let costs = new PathFinder.CostMatrix;
                room.find(FIND_STRUCTURES).forEach(function(structure) {
                    if (structure.structureType === STRUCTURE_ROAD) {
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    } else if (structure.structureType !== STRUCTURE_RAMPART || !structure.my) {
                        costs.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                });
                return costs;
            }
        });
    return roomMissing ? null : res;
}

module.exports = {
    improveMine: improveMine,
    planRoomConstruction: planRoomConstruction
};