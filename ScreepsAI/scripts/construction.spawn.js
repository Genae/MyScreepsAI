let createSpawn = function (spawn, room) {

    //get free spots
    const rechargeSpots = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dy !== 0 || dx !== 0) {
                const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, spawn.room.name);
                rechargeSpots.push({ pos: pos, reserved: false });
            }
        }
    }
    let storage = planStorage(spawn);

    //save object
    return {
        obj: { id: spawn.id, pos: spawn.pos },
        rechargeSpots: rechargeSpots,
        storageCenter: storage,
        improvedTo: 0
    };
};

const planExtension = function (spawn) {
    const mySpawn = Game.getObjectById(spawn.obj.id);

    let r = 1;
    while (true) {
        r++;
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if (((dx + dy) % 2) === 0) {
                    const pos = new RoomPosition(mySpawn.pos.x + dx, mySpawn.pos.y + dy, mySpawn.room.name);
                    if (!isBlocked(pos, mySpawn.room)) {
                        return pos;
                    }
                }
            }
        }
    }
};

const planStorage = function (mySpawn) {
    let center;
    let offset = 0;
    while(center === undefined){
        center = getCenter(mySpawn, offset);
        if (offset <= 0)
            offset -= 1;
        offset *= -1;
    }
    let r = 1;
    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            const pos = new RoomPosition(center.x + dx, center.y + dy, mySpawn.room.name);
            console.log("creating flag");
            pos.createFlag(undefined, COLOR_GREY, COLOR_YELLOW);
        }
    }
    return center;
};

let getCenter = function(mySpawn, offset){
    let pos = new RoomPosition(mySpawn.pos.x + offset, mySpawn.pos.y + 3, mySpawn.room.name);
    if (!isAreaBlocked(pos, 1, mySpawn.room))
        return pos;

    pos = new RoomPosition(mySpawn.pos.x + offset, mySpawn.pos.y - 3, mySpawn.room.name);
    if (!isAreaBlocked(pos, 1, mySpawn.room))
        return pos;

    pos = new RoomPosition(mySpawn.pos.x + 3, mySpawn.pos.y + offset, mySpawn.room.name);
    if (!isAreaBlocked(pos, 1, mySpawn.room))
        return pos;

    pos = new RoomPosition(mySpawn.pos.x - 3, mySpawn.pos.y + offset, mySpawn.room.name);
    if (!isAreaBlocked(pos, 1, mySpawn.room))
        return pos;
};

let isAreaBlocked = function (center, r, room) {

    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            const pos = new RoomPosition(center.x + dx, center.y + dy, room.name);
            if (isBlocked(pos, room))
                return true;
        }
    }
    return false;
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
    return false;

};

module.exports = { createSpawn: createSpawn, planExtension: planExtension };