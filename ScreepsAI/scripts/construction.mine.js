let scanMine = function (source, room) {
    //find working space
    let positionsAround = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            let t = room.lookForAt(LOOK_TERRAIN, source.pos.x + x, source.pos.y + y);
            if (t[0] !== "wall") {
                positionsAround.push(room.getPositionAt(source.pos.x + x, source.pos.y + y));
            }
        }
    }

    //find path
    let spawns = room.find(FIND_MY_SPAWNS);
    let pathToMine;
    if (spawns.length > 0)
        pathToMine = PathFinder.search(spawns[0].pos, {pos: source.pos, range: 2});

    //save object
    room.memory.structures.mines.push({
        obj: {id: source.id, pos: source.pos},
        workingPlaces: positionsAround,
        pathToMine: pathToMine,
        improvedTo: 0
    });
};

module.exports = { scanMine: scanMine };