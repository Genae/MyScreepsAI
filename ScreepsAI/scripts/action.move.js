var moveTo = function (creep, pos, range) {
    return moveToAny(creep, [pos], range);
}
var moveToAny = function (creep, pos, range) {
    if (range === undefined) {
        range = 0;
    }
    creep.memory.pathTargets = { pos: pos, range: range };
    var i;
    var unblockedPos = [];
    var myrange = range;
    while (unblockedPos.length === 0) {
        for (i = 0; i < pos.length; i++) {
            for (var dx = -myrange; dx <= myrange; dx++) {
                for (var dy = -myrange; dy <= myrange; dy++) {
                    var posi = new RoomPosition(pos[i].x + dx, pos[i].y + dy, pos[i].roomName);
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

    if (unblockedPos.length === 0) {
        return moveToAny(creep, pos, range + 1);
    }
    var closest = creep.pos.findClosestByRange(unblockedPos);
    if (creep.pos.getRangeTo(closest) > 10) {
        creep.memory.path = creep.pos.findPathTo(closest, {
            ignoreCreeps: creep.memory.pathBlocked < 2
        });

    } else {
        creep.memory.path = creep.pos.findPathTo(closest, {
            ignoreCreeps: false
        });
    }
    creep.memory.path = fix(creep.memory.path);
    creep.memory.index = 0;
    creep.memory.moving = true;
    creep.memory.pathBlocked = 0;
    return continueMove(creep);
}

var fix = function (path) {
    for (let i = 0; i < path.length; i++) {
        if (path[i].x === 0)
            path[i].x = 1;
        if (path[i].y === 0)
            path[i].y = 1;
        if (path[i].x === 49)
            path[i].x = 48;
        if (path[i].y === 49)
            path[i].y = 48;
    }
    return path;
}

var followPath = function (creep, path) {
    creep.memory.index = 0;
    creep.memory.pathBlocked = 0;
    creep.memory.pathTargets = undefined;
    var res = {};
    var closestDist = Math.min.apply(Math, path.map(function (o) {
        var dist = creep.pos.getRangeTo(o.x, o.y);
        res[dist] = o;
        return dist;
    }));
    if (closestDist === 0) {
        creep.memory.path = path;
        creep.memory.moving = true;
        return continueMove(creep);
    }
    return moveTo(creep, res[closestDist]);
}
var continueMove = function (creep) {
    if (creep.fatigue > 0) {
        if (creep.pos.x !== creep.memory.path[creep.memory.path.length - 1].x || creep.pos.y !== creep.memory.path[creep.memory.path.length - 1].y)
            return true;
    }
    var index = (creep.memory.index === undefined ? 0 : creep.memory.index);
    for (var i = index; i < creep.memory.path.length; i++) {
        if (creep.memory.path[i].x % 49 === creep.pos.x % 49 && creep.memory.path[i].y % 49 === creep.pos.y % 49) {
            index = i + 1;
            creep.memory.index = i + 1;
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
    var posnew = new RoomPosition(creep.memory.path[index].x, creep.memory.path[index].y, creep.room.name);
    if (creep.pos.getRangeTo(posnew) > 1) {
        return moveTo(creep, posnew, 0);
    }
    var blocked = isBlocked(creep.pos, true);
    if (blocked) {
        creep.memory.pathBlocked++;
        if (creep.memory.pathBlocked > 2 && creep.memory.pathTargets !== undefined)
            return moveToAny(creep, creep.memory.pathTargets.pos, creep.memory.pathTargets.range);
    }
    else {
        creep.memory.pathBlocked = 0;
    }
    creep.move(creep.pos.getDirectionTo(posnew.x, posnew.y));
    return true;
}

var isBlocked = function (pos, fat) {
    var stuff = pos.look();
    for (var i = 0; i < stuff.length; i++) {
        if (stuff[i].type === 'creep' && (!fat || stuff[i].creep.fatigue === 0)) {
            return true;
        }
        if (stuff[i].type === 'structure') {
            if (stuff[i].structure.structureType !== STRUCTURE_ROAD) {
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
}

module.exports = { moveTo: moveTo, continueMove: continueMove, followPath: followPath, moveToAny: moveToAny };