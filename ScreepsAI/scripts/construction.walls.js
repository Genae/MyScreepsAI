var createWalls = function (room, direction) {

    var wallSlots = [];
    var index = -1;
    var connected = false;
    //check NORTH and SOUTH
    if (direction === TOP || direction === BOTTOM) {
        let one = direction === TOP ? 1 : 48;
        for (let x = 0; x < 50; x++) {
            if (room.lookForAt(LOOK_TERRAIN, x, one)[0] !== 'wall' && needsWall(room, direction, x)) {
                if (!connected) {
                    index++;
                    wallSlots[index] = {
                        walls: [],
                        exits: [],
                        improvedTo: 0
                    };
                }
                wallSlots[index].walls.push({ pos: new RoomPosition(x, one, room.name), type: STRUCTURE_WALL });
                connected = true;
            } else {
                connected = false;
            }
        }
    }
    //check EAST and WEST
    if (direction === LEFT || direction === RIGHT) {
        let one = direction === LEFT ? 1 : 48;
        for (let y = 0; y < 50; y++) {
            if (room.lookForAt(LOOK_TERRAIN, one, y)[0] !== 'wall' && needsWall(room, direction, y)) {
                if (!connected) {
                    index++;
                    wallSlots[index] = {
                        walls: [],
                        exits: [],
                        improvedTo: 0
                    };
                }
                wallSlots[index].walls.push({ pos: new RoomPosition(one, y, room.name), type: STRUCTURE_WALL });
                connected = true;
            } else {
                connected = false;
            }
        }
    }

    //create exits
    for (let p = 0; p < wallSlots.length; p++) {
        if (wallSlots[p].walls.length <= 3) {
            for (let s = 0; s < wallSlots[p].walls.length; s++) {
                wallSlots[p].walls[s].type = STRUCTURE_RAMPART;
            }
            wallSlots[p].exits.push(wallSlots[p].walls[Math.floor(wallSlots[p].walls.length / 2)].pos);
        }
        else if (wallSlots[p].walls.length <= 15) {
            var center = Math.floor(wallSlots[p].walls.length / 2);
            for (let s = center-1; s <= center + 1; s++) {
                wallSlots[p].walls[s].type = STRUCTURE_RAMPART;
            }
            wallSlots[p].exits.push(wallSlots[p].walls[center].pos);
        }
        else {
            var center1 = Math.floor(wallSlots[p].walls.length / 3);
            for (let s = center1 - 1; s <= center1 + 1; s++) {
                wallSlots[p].walls[s].type = STRUCTURE_RAMPART;
            }
            wallSlots[p].exits.push(wallSlots[p].walls[center1].pos);

            var center2 = Math.floor(wallSlots[p].walls.length / 3) * 2;
            for (let s = center2 - 1; s <= center2 + 1; s++) {
                wallSlots[p].walls[s].type = STRUCTURE_RAMPART;
            }
            wallSlots[p].exits.push(wallSlots[p].walls[center2].pos);
        }
    }

    //save object
    return wallSlots;
}

var needsWall = function(room, direction, pos) {
    if (direction === TOP) {
        for (let dx = -1; dx <= 1; dx++) {
            if (room.lookForAt(LOOK_TERRAIN, pos + dx, 0)[0] !== 'wall') {
                return true;
            }
        }
        return false;
    }
    if (direction === BOTTOM) {
        for (let dx = -1; dx <= 1; dx++) {
            if (room.lookForAt(LOOK_TERRAIN, pos + dx, 49)[0] !== 'wall') {
                return true;
            }
        }
        return false;
    }
    if (direction === LEFT) {
        for (let dy = -1; dy <= 1; dy++) {
            if (room.lookForAt(LOOK_TERRAIN, 0, pos + dy)[0] !== 'wall') {
                return true;
            }
        }
        return false;
    }
    if (direction === RIGHT) {
        for (let dy = -1; dy <= 1; dy++) {
            if (room.lookForAt(LOOK_TERRAIN, 49, pos + dy)[0] !== 'wall') {
                return true;
            }
        }
        return false;
    }
}

module.exports = { createWalls: createWalls };