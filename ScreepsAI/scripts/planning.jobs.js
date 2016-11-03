var findJob = function (creep) {
    var room = Game.rooms[creep.memory.roomName];
    if (creep.memory.role === 'harvester') {
        for (var i = 0; i < room.memory.mines.length; i++) {
            if (room.memory.lastJobs[i] === undefined)
                room.memory.lastJobs[i] = 0;
            if ((room.memory.lastJobs[i] < room.memory.mines[i].workingPlaces.length && room.energyCapacityAvailable < 1300) ||
                (room.memory.lastJobs[i] === 0 && room.energyCapacityAvailable >= 1300)) {
                creep.memory.job = { mineIndex: i };
                room.memory.lastJobs[i]++;
                return;
            }
        }
        for (var i = 0; i < room.memory.mines.length; i++) {
            if ((room.memory.lastJobs[i] < room.memory.mines[i].workingPlaces.length + 1 && room.energyCapacityAvailable < 1300) ||
                (room.memory.lastJobs[i] === 1 && room.energyCapacityAvailable >= 1300)) {
                creep.memory.job = { mineIndex: i };
                room.memory.lastJobs[i]++;
                return;
            }
        }
    }
    if (creep.memory.role === 'outharvester') {
        for (var flagName in Game.flags) {
            var flag = Game.flags[flagName];
            if (Memory.rooms[flag.pos.roomName].masterRoom !== room.name || flag.color !== COLOR_BROWN)
                continue;
            if (room.memory.lastJobs[flagName] === undefined)
                room.memory.lastJobs[flagName] = 0;
            if (room.memory.lastJobs[flagName] < 2) {
                creep.memory.job = { flag: flagName };
                room.memory.lastJobs[flagName]++;
                return;
            }
        }
    }
}

module.exports = {
    findJob: findJob
}