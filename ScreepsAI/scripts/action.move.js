/*let getAvoid = function(roomName) {
    let avoid = [];
    for (let i = 0; i <= 49; i++) {
        avoid.push(new RoomPosition(i, 49, roomName));
        avoid.push(new RoomPosition(i, 0, roomName));
        if (i % 49 !== 0) {
            avoid.push(new RoomPosition(49, i, roomName));
            avoid.push(new RoomPosition(0, i, roomName));
        }
    }
    return avoid;
};*/

let moveTo = function (creep, pos, range) {
    return moveToAny(creep, [pos], range);
};

let moveToAny = function (creep, pos, range) {
    if (range === undefined) {
        range = 0;
    }
    creep.memory.pathTargets = { pos: pos, range: range };
    let i;
    let unblockedPos = [];
    let myrange = range;
    while (unblockedPos.length === 0) {
        for (i = 0; i < pos.length; i++) {
            for (let dx = -myrange; dx <= myrange; dx++) {
                for (let dy = -myrange; dy <= myrange; dy++) {
                    let posi = new RoomPosition(pos[i].x + dx, pos[i].y + dy, pos[i].roomName);
                    if (pos[i].x + dx > 0 && pos[i].x + dx < 49 && pos[i].y + dy > 0 && pos[i].y + dy < 49 && !isBlocked(posi, false)) {
                        unblockedPos.push(posi);
                    }
                }
            }
        }
        myrange++;
        if (myrange - range > 3) {
            creep.say("no path");
            return false;
        }
    }

    let closest = creep.pos.findClosestByRange(unblockedPos);
    if (creep.pos.getRangeTo(closest) > 10) {
        creep.memory.path = creep.pos.findPathTo(closest, {
            ignoreCreeps: creep.memory.pathBlocked < 2,
            maxRooms: 1,
        });
    } else {
        creep.memory.path = creep.pos.findPathTo(closest, {
            ignoreCreeps: false,
            maxRooms: 1
        });
    }
    creep.memory.index = 0;
    creep.memory.moving = true;
    creep.memory.pathBlocked = 0;
    return continueMove(creep);
};

let continueMove = function (creep) {
    if (creep.fatigue > 0) {
        return true;
    }
    let index = creep.memory.index === undefined ? 0 : creep.memory.index;
    for (let i = index; i < creep.memory.path.length; i++) {
        if (creep.memory.path[i].x % 49 === creep.pos.x % 49 && creep.memory.path[i].y % 49 === creep.pos.y % 49) {
            index = i + 1;
            creep.memory.index = index;
            break;
        }
    }
    if (index >= creep.memory.path.length) {
        creep.memory.moving = false;
        return false;
    }
    if (creep.memory.path.length > 20 && creep.memory.path.length - index <= 5 && creep.memory.pathTargets !== undefined) { //reevaluate path
        return moveToAny(creep, creep.memory.pathTargets.pos, creep.memory.pathTargets.range);
    }

    let posnew = new RoomPosition(creep.memory.path[index].x, creep.memory.path[index].y, creep.room.name);
    if (creep.pos.getRangeTo(posnew) > 1) {
        return moveTo(creep, posnew, 0);
    }

    if (isBlocked(creep.pos, true)) {
        creep.memory.pathBlocked++;
        if (creep.memory.pathBlocked > 2 && creep.memory.pathTargets !== undefined)
            return moveToAny(creep, creep.memory.pathTargets.pos, creep.memory.pathTargets.range);
    }
    else {
        creep.memory.pathBlocked = 0;
    }
    creep.move(creep.pos.getDirectionTo(posnew.x, posnew.y));
    return true;
};


let followPath = function (creep, path) {
    creep.memory.index = 0;
    creep.memory.pathBlocked = 0;
    creep.memory.pathTargets = undefined;
    let res = {};
    let closestDist = Math.min.apply(Math, path.map(function (o) {
        let dist = creep.pos.getRangeTo(o.x, o.y);
        res[dist] = o;
        return dist;
    }));
    if (closestDist === 0) {
        creep.memory.path = path;
        creep.memory.moving = true;
        return continueMove(creep);
    }
    return moveTo(creep, res[closestDist]);
};

let isBlocked = function (pos, fat) {
    let stuff = pos.look();
    for (let i = 0; i < stuff.length; i++) {
        if (stuff[i].type === 'creep' && (!fat || stuff[i].creep.fatigue === 0)) {
            return true;
        }
        if (stuff[i].type === 'structure') {
            if (!(stuff[i].structure.structureType === STRUCTURE_ROAD || (stuff[i].structure.structureType === STRUCTURE_RAMPART && stuff[i].structure.my))) {
                return true;
            }

        }
        if (stuff[i].type === 'terrain') {
            if (stuff[i].terrain === 'wall') {
                return true;
            }
        }
    }
    return false;
};

module.exports = { moveTo: moveTo, continueMove: continueMove, followPath: followPath, moveToAny: moveToAny };