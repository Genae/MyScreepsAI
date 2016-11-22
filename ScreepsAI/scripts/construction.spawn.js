var createSpawn = function (spawn, room) {

    //get free spots
    var rechargeSpots = [];
    for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
            if (dy !== 0 || dx !== 0) {
                var pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.room.name);
                if (!isOnAnyPath(pos, room))
                    rechargeSpots.push({ pos: pos, reserved: false });
            }
        }
    }

    //save object
    return {
        resource: { id: spawn.id, pos: spawn.pos },
        rechargeSpots: rechargeSpots,
        improvedTo: 0
    };
}
var planExtension = function(spawn, room) {
    var mySpawn = Game.getObjectById(spawn.resource.id);

    var r = 1;
    while (true) {
        r++;
        for (var dx = -r; dx <= r; dx++) {
            for (var dy = -r; dy <= r; dy++) {
                if (((dx + dy) % 2) === 0) {
                    var pos = new RoomPosition(mySpawn.pos.x + dx, mySpawn.pos.y + dy, mySpawn.room.name);
                    if (!isBlocked(pos, room)) {
                        return pos;
                    }
                }
            }
        }
    }
}

var isBlocked = function (pos, room) {
    if (pos.x <= 3 || pos.y <= 3 || pos.x >= 47 || pos.y >= 47)
        return true;
    var stuff = pos.look();
    for (var i = 0; i < stuff.length; i++) {
        if (stuff[i].type == "creep") {
            continue;
        }
        if (stuff[i].type == 'structure') {
            return true;
        }
        else if(stuff[i].type == 'terrain') {
            if (stuff[i].terrain == 'wall')
                return true;
        }
    }
    if (isOnAnyPath(pos, room))
        return true;
    return false;
}

var isOnPath = function (pos, path) {
    for (var i = 0; i < path.length; i++) {
        if (pos.x === path[i].x && pos.y === path[i].y) {
            return true;
        }
    }
    return false;
}

var isOnAnyPath = function(pos, room){
    for (var m = 0; m < room.memory.mines.length; m++) {
        if (isOnPath(pos, room.memory.mines[m].pathToMine.path)) {
            return true;
        }
    }
    if (isOnPath(pos, room.memory.controller.pathTo.path)) {
        return true;
    }
    return false;
}

module.exports = { createSpawn: createSpawn, planExtension: planExtension };