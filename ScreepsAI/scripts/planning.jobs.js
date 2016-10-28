var findJob = function(creep, room){
    if (creep.memory.role === 'harvester') {
        for (var i = 0; i < room.memory.mines.length; i++) {
            creep.memory.job = { mineIndex: i };
            return;
        }
    }
}

module.exports = {
    findJob: findJob
}