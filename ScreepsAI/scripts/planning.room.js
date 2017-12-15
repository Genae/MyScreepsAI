let constructionController = require('construction.controller');
let constructionMine = require('construction.mine');
let constructionSpawn = require('construction.spawn');
let constructionWalls = require('construction.walls');
let constructionLink = require('construction.link');
let constructionMineral = require('construction.mineral');
let pathfindingHelper = require('util.pathfindingHelper');

let scanRoom = function(room){
    //clear all structures
    room.memory.structures = {};

    if (room.find(FIND_MY_SPAWNS)[0] === undefined) {
        room.memory.info.needsPlanning = false;
        return;
    }

    //Scan Mines
    room.memory.structures.mines = [];
    let sources = room.find(FIND_SOURCES);
    for (let i = 0; i < sources.length; i++) {
        constructionMine.scanMine(sources[i], room);
    }
    room.memory.structures.mines.sort(function (a, b) { return a.pathToMine === undefined? 0: a.pathToMine.cost - b.pathToMine === undefined? 0: b.pathToMine.cost });

    //Scan Minerals
    let minerals = room.find(FIND_MINERALS);
    if (minerals.length > 0)
    {
        room.memory.structures.mineral = constructionMineral.createMineral(room, minerals[0]);
    }

    //Scan Links
    room.memory.structures.links = [];

    //Scan Controller
    room.memory.structures.controller = constructionController.createController(room.controller, room);

    //Scan Spawn
    room.memory.structures.spawn = constructionSpawn.createSpawn(room.find(FIND_MY_SPAWNS)[0], room);

    //Scan Walls
    room.memory.structures.walls = constructionWalls.createWalls(room, TOP);
    room.memory.structures.walls = room.memory.structures.walls.concat(constructionWalls.createWalls(room, RIGHT));
    room.memory.structures.walls = room.memory.structures.walls.concat(constructionWalls.createWalls(room, BOTTOM));
    room.memory.structures.walls = room.memory.structures.walls.concat(constructionWalls.createWalls(room, LEFT));
    room.memory.structures.wallHitpoints = 100000;

    //other
    room.memory.structures.repair = [];
    room.memory.structures.improveTo = 0;
};

let planRoomConstruction = function (room) {

    if (room.find(FIND_MY_SPAWNS)[0] === undefined) {
        room.memory.info.needsPlanning = false;
        console.log("no spawn")
        return;
    }
    if(room.memory.structures.links == undefined){
        room.memory.info.rescan = true;
        return;
    }
    //Rescan for new Links
    let links = room.find(FIND_MY_STRUCTURES, { filter: function (s) { return s.structureType === STRUCTURE_LINK } });
    if (room.memory.structures.links !== undefined && room.memory.structures.links.length < links.length) {
        room.memory.structures.links = [];
        for (let i = 0; i < links.length; i++) {
            room.memory.structures.links.push(constructionLink.createLink(links[i]));
        }
    }

    checkBrokenStuff(room);
    if (!room.memory.info.needsPlanning || room.memory.structures.repair.length > 0 || room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return;

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
    if (room.memory.structures.improveTo < room.controller.level) {
        room.memory.structures.improveTo++;
        return;
    }

    //if there is nothing else to do: improve wallstrength
    if (improveDefense(room))
        return;
    let oldHits = room.memory.structures.wallHitpoints;
    if (room.memory.structures.wallHitpoints < 1000000) {
        room.memory.structures.wallHitpoints = Math.min(oldHits + 100000, RAMPART_HITS_MAX[room.controller.level]/10);
    }
    room.memory.info.needsPlanning = room.memory.structures.wallHitpoints !== oldHits;
};

///
/// MINE
///
let improveMine = function (room) {
    for (let i = 0; i < room.memory.structures.mines.length; i++) {
        //Tier 1
        if (room.memory.structures.mines[i].improvedTo < 1 && room.memory.structures.improveTo >= 1) {
            improvePath(room.memory.structures.mines[i].pathToMine.path);
            room.memory.structures.mines[i].improvedTo = 1;
            return true;
        }
        //Tier 2
        if (room.memory.structures.mines[i].improvedTo < 2 && room.memory.structures.improveTo >= 2) {
            for (let wp = 0; wp < room.memory.structures.mines[i].workingPlaces.length; wp++) {
                let workingPlace = room.memory.structures.mines[i].workingPlaces[wp];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dy === 0 || dx === 0)
                            new RoomPosition(workingPlace.x + dx, workingPlace.y + dy, room.name).createConstructionSite(STRUCTURE_ROAD);
                    }
                }
            }
            room.memory.structures.mines[i].improvedTo = 2;
            return true;
        }
    }
    return false;
};

///
/// OuterMine
///
let improveOuterMines = function (room) {
    let spawn = Game.getObjectById(room.memory.structures.spawn.obj.id);
    for (let flagName in Game.flags) {
        let flag = Game.flags[flagName];
        if (flag.color === COLOR_BROWN && Memory.rooms[flag.pos.roomName].masterRoom === room.name) {
            if (flag.memory.improvedTo === undefined)
                flag.memory.improvedTo = 0;
            if (flag.memory.improvedTo === 0 && room.memory.structures.improveTo >= 4) {
                let p = pathfindingHelper.findPathUsingRoads(spawn.pos, { pos: flag.pos, range: 0 });
                if (p !== null) {
                    improvePath(p.path);
                    flag.memory.improvedTo = 1;
                }
            }
        }
    }
    return false;
};

///
/// Minerals
///
let improveMinerals = function (room) {
    if (room.memory.structures.mineral === undefined)
        return false;
    let mineral = Game.getObjectById(room.memory.structures.mineral.obj.id);
    let spawn = Game.getObjectById(room.memory.structures.spawn.obj.id);
    //Tier 1
    if (room.memory.structures.mineral.improvedTo < 1 && room.memory.structures.improveTo >= 1 && room.controller.level >= 6) {
        let p = pathfindingHelper.findPathUsingRoads(spawn.pos, { pos: mineral.pos, range: 1 });
        if (p !== null) {
            improvePath(p.path);
            room.memory.structures.mineral.improvedTo = 1;
            return true;
        }
    }
    //Tier 2
    if (room.memory.structures.mineral.improvedTo < 2 && room.memory.structures.improveTo >= 2 && room.controller.level >= 6) {
        mineral.pos.createConstructionSite(STRUCTURE_EXTRACTOR);
        room.memory.structures.mineral.improvedTo = 2;
    }
    return false;
};

///
/// Controller
///
let improveController = function (room) {
    //Tier 1
    if (room.memory.structures.controller.improvedTo < 1 && room.memory.structures.improveTo >= 1) {
        improvePath(room.memory.structures.controller.pathTo.path);
        room.memory.structures.controller.improvedTo = 1;
        return true;
    }
    return false;
};

///
/// SPAWN
///
let improveSpawn = function (room) {
    //Tier 1
    if (room.memory.structures.spawn.improvedTo < 1 && room.memory.structures.improveTo >= 1) {
        let spawn = Game.getObjectById(room.memory.structures.spawn.obj.id);
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dy !== 0 || dx !== 0) {
                    new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.room.name).createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }
        room.memory.structures.spawn.improvedTo = 1;
        return true;
    }
    //Tier 4
    if (room.memory.structures.spawn.improvedTo < 4 && room.memory.structures.improveTo >= 4) {
        let center = room.memory.structures.spawn.storageCenter;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dy !== 0 || dx !== 0) {
                    new RoomPosition(center.x + dx, center.y + dy, room.name).createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }
        let cpos = new RoomPosition(center.x, center.y, room.name);
        cpos.createConstructionSite(STRUCTURE_STORAGE);
        for (flagName in Game.flags){
            let flag = Game.flags[flagName];
            if (flag.color === COLOR_GREY && flag.secondaryColor === COLOR_YELLOW && flag.pos.roomName === room.name){
                flag.remove();
            }
        }
        return true;
    }
    //Tier 2 - 8
    if (room.memory.structures.spawn.improvedTo < room.memory.structures.improveTo) {
        if (room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType === STRUCTURE_TOWER; } }).length < CONTROLLER_STRUCTURES.tower[room.memory.structures.improveTo]) {
            let ext = constructionSpawn.planExtension(room.memory.structures.spawn);
            ext.createConstructionSite(STRUCTURE_TOWER);
            new RoomPosition(ext.x, ext.y + 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x, ext.y - 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x + 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x - 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
        } else if (room.find(FIND_MY_STRUCTURES, { filter: (structure) => { return structure.structureType === STRUCTURE_EXTENSION; } }).length < CONTROLLER_STRUCTURES.extension[room.memory.structures.improveTo]) {
            let ext = constructionSpawn.planExtension(room.memory.structures.spawn);
            ext.createConstructionSite(STRUCTURE_EXTENSION);
            new RoomPosition(ext.x, ext.y + 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x, ext.y - 1, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x + 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
            new RoomPosition(ext.x - 1, ext.y, room.name).createConstructionSite(STRUCTURE_ROAD);
        } else {
            room.memory.structures.spawn.improvedTo = room.memory.structures.improveTo;
        }
        return true;
    }
    return false;
};

/////////////
// Defense
////////////
let improveDefense = function (room) {
    //always build ramparts under towers
    let protectedStructures = room.find(FIND_MY_STRUCTURES, {
        filter: function(s) { return s.structureType === STRUCTURE_TOWER || s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_SPAWN}
    });
    for (let i = 0; i < protectedStructures.length; i++) {
        protectedStructures[i].pos.createConstructionSite(STRUCTURE_RAMPART);
    }
    if (room.find(FIND_CONSTRUCTION_SITES).length > 0)
        return true;
    let wall = room.find(FIND_STRUCTURES, {
        filter: function (s) {
            return s.structureType === STRUCTURE_WALL && s.hits < room.memory.structures.wallHitpoints;
        }
    });
    if (wall.length > 0) {
        return true;
    }

    if (room.memory.structures.improveTo >= 3) {
        let spawn = Game.getObjectById(room.memory.structures.spawn.obj.id);
        for (let i = 0; i < room.memory.structures.walls.length; i++) {
            let myWall = room.memory.structures.walls[i];
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
                            let hasRampart = false;
                            let pos = new RoomPosition(myWall.walls[p].pos.x + dx, myWall.walls[p].pos.y + dy, myWall.walls[p].pos.roomName);
                            let stuff = pos.lookFor(LOOK_STRUCTURES);
                            for (let i = 0; i < stuff.length; i++) {
                                if (stuff[i].structureType === STRUCTURE_RAMPART) {
                                    hasRampart = true;
                                    break;
                                }
                                if (stuff[i].structureType === STRUCTURE_ROAD) {
                                    if (pos.createConstructionSite(STRUCTURE_RAMPART) !== OK) {
                                        //return true;
                                    }
                                    room.memory.structures.wallHitpoints = 100000;
                                    hasRampart = true;
                                    break;
                                }
                            }
                            if (!hasRampart) {
                                if (pos.createConstructionSite(STRUCTURE_WALL) !== OK) {
                                    //return true;
                                }
                                room.memory.structures.wallHitpoints = 100000;
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
};

let checkBrokenStuff = function (room) {
    if (room.memory.structures.repair.length > 0) {
        let repairObj = Game.getObjectById(room.memory.structures.repair[0]);
        if (repairObj === null || repairObj === undefined) {
            room.memory.structures.repair.shift();
        }
        else if (repairObj.hits === repairObj.hitsMax || (repairObj.structureType === STRUCTURE_RAMPART && repairObj.hits >= room.memory.structures.wallHitpoints)) {
            room.memory.structures.repair.shift();
        }
    }
    let targets = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.hits < structure.hitsMax / 2 && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART) ||
                structure.structureType === STRUCTURE_RAMPART && structure.hits < room.memory.structures.wallHitpoints - 30000;
        }
    });
    for (let i = 0; i < targets.length; i++) {
        if (room.memory.structures.repair.indexOf(targets[i].id) === -1) {
            room.memory.structures.repair.push(targets[i].id);
        }
    }
};

let improvePath = function (path, room) {
    for (let i = 0; i < path.length; i++) {
        let pos = new RoomPosition(path[i].x, path[i].y, (room === undefined ? path[i].roomName : room.name));
        pos.createConstructionSite(STRUCTURE_ROAD);
    }
};

module.exports = {
    planRoomConstruction: planRoomConstruction,
    scanRoom: scanRoom
};