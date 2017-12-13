let planningJobs = require('planning.jobs');

let roleReserver = function (creep) {
    if (creep.memory.job === undefined) {
        planningJobs.findJob(creep, creep.room);
        if (creep.memory.job === undefined)
            return;
    }
   
    if (creep.ticksToLive > 100) {
        if (Memory.rooms[creep.memory.roomName].thisJobs["reserve" + creep.memory.job.roomName] === undefined) {
            Memory.rooms[creep.memory.roomName].thisJobs["reserve" + creep.memory.job.roomName] = 1;
        } else {
            Memory.rooms[creep.memory.roomName].thisJobs["reserve" + creep.memory.job.roomName]++;
            if (Memory.rooms[creep.memory.roomName].thisJobs["reserve" + creep.memory.job.roomName] > 1) {
                creep.memory.job = undefined;
                roleReserver(creep);
            }
        }
    }

    if (creep.room.name !== creep.memory.job.roomName) {
        creep.moveTo(new RoomPosition(25, 25, creep.memory.job.roomName));
    } else {
        if (creep.reserveController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        } else {
            creep.room.memory.controllerTicks = creep.room.controller.reservation.ticksToEnd;
        }
    }    
};

module.exports = { roleReserver: roleReserver };