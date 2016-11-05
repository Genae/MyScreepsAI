var scanMine = function (source, room) {
    //find working space
    var positionsAround = [];
    for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
            var t = room.lookForAt('terrain', source.pos.x + x, source.pos.y + y);
            if (t != "wall") {
                positionsAround.push(room.getPositionAt(source.pos.x + x, source.pos.y + y));
            }
        }
    }

    //find path
    var spanws = room.find(FIND_MY_SPAWNS);
    var pathToMine = findPathUsingRoads(spanws[0].pos, { pos: source.pos, range: 2 });

    //save object
    room.memory.mines.push({
        resource: { id: source.id, pos: source.pos },
        workingPlaces: positionsAround,
        pathToMine: pathToMine,
        improvedTo: 0
    });
}

module.exports = { scanMine: scanMine };


var findPathUsingRoads = function (start, goals) {
    var roomMissing = false;
    var res = PathFinder.search(
        start, goals,
        {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,

            roomCallback: function (roomName) {
                let room = Game.rooms[roomName];
                // In this example `room` will always exist, but since PathFinder 
                // supports searches which span multiple rooms you should be careful!
                if (!room) {
                    roomMissing = true;
                    return 1;
                }
                let costs = new PathFinder.CostMatrix;
                room.find(FIND_STRUCTURES).forEach(function (structure) {
                    if (structure.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    } else if (structure.structureType !== STRUCTURE_RAMPART ||
                        !structure.my) {
                        // Can't walk through buildings, except for our own ramparts
                        costs.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                });
                return costs;
            }
        });
    return roomMissing ? null : res;
}