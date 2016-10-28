var createSpawn = function (spawn, room) {

    //save object
    return {
        resource: { id: spawn.id, pos: spawn.pos },
        improvedTo: 0
    };
}
var planExtensions = function(spawn, room, level) {
    var mySpawn = Game.getObjectById(spawn.resource.id);

    //check for space NORTH
    var openNorth = [];
    if (!check(openNorth, mySpawn, -1, 1, -5, -2, true)) {
        openNorth = [];
    }
    console.log("NORTH: " + openNorth.length);
    //check for space EAST
    var openEast = [];
    if (!check(openEast, mySpawn, 2, 5, -1, 1, false)) {
        openEast = [];
    }
    console.log("EAST: " + openEast.length);
    //check for space SOUTH
    var openSouth = [];
    if (!check(openSouth, mySpawn, -1, 1, 2, 5, true)) {
        openSouth = [];
    }
    console.log("SOUTH: " + openSouth.length);
    //check for space WEST
    var openWest = [];
    if (!check(openWest, mySpawn, -5, -2, -1, 1, false)) {
        openWest = [];
    }
    console.log("WEST: " + openWest.length);
}

var check = function(open, mySpawn, mix, max, miy, may, x) {
    for (var dx = mix; dx <= max; dx++) {
        for (var dy = miy; dy <= may; dy++) {
            var pos = new RoomPosition(mySpawn.pos.x + dx, mySpawn.pos.y + dy, mySpawn.room.name);
            if (isBlocked(pos)) {
                if (((!x && dy === 0) || (x && dx === 0))) {
                    console.log("street blocked at: " + pos.x + "/" + pos.y);
                    return false;
                }
            } 
            else if(!((!x && dy === 0) || (x && dx === 0))) {
                open.push(pos);
            }
        }
    }
    return true;
}

var isBlocked = function(pos) {
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
    return false;
}


module.exports = { createSpawn: createSpawn, planExtensions: planExtensions };