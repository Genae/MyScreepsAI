let createSpawn = function (spawn, room) {

    //get free spots
    const rechargeSpots = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dy !== 0 || dx !== 0) {
                const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.room.name);
                if (!isOnAnyPath(pos, room))
                    rechargeSpots.push({ pos: pos, reserved: false });
            }
        }
    }

    //save object
    return {
        obj: { id: spawn.id, pos: spawn.pos },
        rechargeSpots: rechargeSpots,
        improvedTo: 0
    };
};

const planExtension = function (spawn, room) {
    const mySpawn = Game.getObjectById(spawn.obj.id);

    let r = 1;
    while (true) {
        r++;
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if (((dx + dy) % 2) === 0) {
                    const pos = new RoomPosition(mySpawn.pos.x + dx, mySpawn.pos.y + dy, mySpawn.room.name);
                    if (!isBlocked(pos, room)) {
                        return pos;
                    }
                }
            }
        }
    }
};

let isBlocked = function (pos, room) {
    if (pos.x <= 3 || pos.y <= 3 || pos.x >= 47 || pos.y >= 47)
        return true;
    const stuff = pos.look();
    for (let i = 0; i < stuff.length; i++) {
        if (stuff[i].type === "creep") {
            continue;
        }
        if (stuff[i].type === 'structure') {
            return true;
        }
        if (stuff[i].type === 'flag') {
            return true;
        }
        else if(stuff[i].type === 'terrain') {
            if (stuff[i].terrain === 'wall')
                return true;
        }
    }
    return isOnAnyPath(pos, room);
    
};

let isOnPath = function (pos, path) {
    for (let i = 0; i < path.length; i++) {
        if (pos.x === path[i].x && pos.y === path[i].y) {
            return true;
        }
    }
    return false;
};

let isOnAnyPath = function(pos, room){
    for (let m = 0; m < room.memory.mines.length; m++) {
        if (isOnPath(pos, room.memory.mines[m].pathToMine.path)) {
            return true;
        }
    }
    return isOnPath(pos, room.memory.controller.pathTo.path);    
};

module.exports = { createSpawn: createSpawn, planExtension: planExtension };