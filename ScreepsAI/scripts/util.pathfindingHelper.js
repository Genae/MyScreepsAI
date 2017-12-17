let findPathUsingRoads = function (start, goals, ignoreMissing) {
    let roomMissing = false;
    ignoreMissing = ignoreMissing === undefined ? false : ignoreMissing;
    let res = PathFinder.search(
        start, goals,
        {
            plainCost: 2,
            swampCost: 10,

            roomCallback: function (roomName) {
                let room = Game.rooms[roomName];
                if (!room) {
                    roomMissing = !ignoreMissing;
                    return 1;
                }
                let costs = new PathFinder.CostMatrix;
                if (room !== undefined){
                    room.find(FIND_STRUCTURES).forEach(function (structure) {
                        if (structure.structureType === STRUCTURE_ROAD) {
                            costs.set(structure.pos.x, structure.pos.y, 1);
                        } else if (structure.structureType !== STRUCTURE_RAMPART || !structure.my) {
                            costs.set(structure.pos.x, structure.pos.y, 0xff);
                        }
                    });
                }
                return costs;
            }
        });
    return roomMissing ? null : res;
};

module.exports = {findPathUsingRoads: findPathUsingRoads};