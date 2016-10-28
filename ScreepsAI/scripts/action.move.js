var moveTo = function (creep, x, y) {
    if(y === undefined)
        creep.memory.path = creep.pos.findPathTo(x);
    else
        creep.memory.path = creep.pos.findPathTo(x, y);

    console.log("findPath: " + creep.memory.path.length);
	creep.memory.moving = true;
    return continueMove(creep);
}
var followPath = function (creep, path) {
    var res = {};
    var closestDist = Math.min.apply(Math, path.map(function(o) {
        var dist = creep.pos.getRangeTo(o.x, o.y);
        res[dist] = o;
        return dist;
    }));
    if (closestDist === 0) {
        creep.memory.path = path;
        creep.memory.moving = true;
        return continueMove(creep);
    }
    return moveTo(creep, res[closestDist].x, res[closestDist].y);
}
var continueMove = function (creep) {
    if (creep.fatigue > 0)
        return true;
    var index = 0;
    for (var i = 0; i < creep.memory.path.length; i++) {
        if (creep.memory.path[i].x === creep.pos.x && creep.memory.path[i].y === creep.pos.y) {
            index = i+1;
            break;
        }
    }
    if (index >= creep.memory.path.length) {
        creep.memory.moving = false;
        return false;
    }
    var posnew = new RoomPosition(creep.memory.path[index].x, creep.memory.path[index].y, creep.room.name);
    var blocked = false;
    /*var stuff = posnew.look();
    for (var i = 0; i < stuff.length; i++) {
        if (stuff[i].type === "creep") {
            console.log("blocked by " + stuff[i].type);
            blocked = true;
            break;
        }
    }  
    if (blocked) //blocked
    {
        if (index < creep.memory.path.length - 2)
            moveTo(creep, creep.memory.path[index + 1].x, creep.memory.path[index + 1].y);
    }*/
    creep.move(creep.pos.getDirectionTo(posnew.x, posnew.y));
    return true;
}

module.exports = { moveTo: moveTo, continueMove: continueMove, followPath: followPath };