var scanMine = function (source, room) {
    //find working space
    var positionsAround = [];
    for (var x = -1; x <= 1; x++) {
        for (var y = -1; y <= 1; y++) {
            var t = room.lookForAt('terrain', source.pos.x + x, source.pos.y + y);
            if (t == "plain") {
                positionsAround.push(room.getPositionAt(source.pos.x + x, source.pos.y + y));
            }
        }
    }

    //find path
    var spanws = room.find(FIND_MY_SPAWNS);
    var pathToMine = PathFinder.search(spanws[0].pos, { pos: source.pos, range: 2 });
    
    //save object
    room.memory.mines.push({
        resource: { id: source.id, pos: source.pos },
        workingPlaces: positionsAround,
        pathToMine: pathToMine,
        improvedTo: 0
    });
}

module.exports = { scanMine: scanMine };