var findJob = function(creep, room){
    if (creep.memory.role === 'harvester') {
        for (var i = 0; i < room.memory.mines.length; i++) {
            if (room.memory.lastJobs[i] === undefined)
                room.memory.lastJobs[i] = 0;
            if (room.memory.lastJobs[i] < room.memory.mines[i].workingPlaces.length) {
                creep.memory.job = { mineIndex: i };
                room.memory.lastJobs[i]++;
                return;
            }
        }
    }
}

module.exports = {
    findJob: findJob
}