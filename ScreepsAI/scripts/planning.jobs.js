let findJob = function (creep) {
    let room = Game.rooms[creep.memory.roomName];
    if (creep.memory.role === 'harvester') {
        for (let i = 0; i < room.memory.structures.mines.length; i++) {
            if (room.memory.lastJobs[i] === undefined)
                room.memory.lastJobs[i] = 0;
            if ((room.memory.lastJobs[i] < room.memory.structures.mines[i].workingPlaces.length && room.energyCapacityAvailable < 1300) ||
                (room.memory.lastJobs[i] === 0 && room.energyCapacityAvailable >= 1300)) {
                creep.memory.job = { mineIndex: i };
                room.memory.lastJobs[i]++;
                return;
            }
        }
        for (let i = 0; i < room.memory.structures.mines.length; i++) {
            if ((room.memory.lastJobs[i] < room.memory.structures.mines[i].workingPlaces.length + 1 && room.energyCapacityAvailable < 1300) ||
                (room.memory.lastJobs[i] === 1 && room.energyCapacityAvailable >= 1300)) {
                creep.memory.job = { mineIndex: i };
                room.memory.lastJobs[i]++;
                return;
            }
        }
    }
    if (creep.memory.role === 'outharvester') {
        for (let flagName in Game.flags) {
            let flag = Game.flags[flagName];
            if (flag.color !== COLOR_BROWN || Memory.rooms[flag.pos.roomName].masterRoom !== room.name)
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
    if (creep.memory.role === 'reserver') {
        let slaverooms = {};
        for (let flagName in Game.flags) {
            let flag = Game.flags[flagName];
            if (flag.color !== COLOR_BROWN || Memory.rooms[flag.pos.roomName].masterRoom !== room.name)
                continue;
            if (slaverooms[flag.pos.roomName] === undefined) {
                slaverooms[flag.pos.roomName] = 0;
            }
            slaverooms[flag.pos.roomName]++;
            if (slaverooms[flag.pos.roomName] >= 2 && room.memory.lastJobs["reserve" + flag.pos.roomName] !== 1) {
                creep.memory.job = { roomName: flag.pos.roomName };
            }
        }
    }
};

module.exports = { findJob: findJob };