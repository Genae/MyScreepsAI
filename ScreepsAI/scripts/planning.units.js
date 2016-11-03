var getLevel = function (room) {
    if (room.energyCapacityAvailable >= 1800) {
        return 5;
    }
    if (room.energyCapacityAvailable >= 1300) {
        return 4;
    }
    if (room.energyCapacityAvailable >= 800) {
        return 3;
    }
    else if (room.energyCapacityAvailable >= 550) {
        return 2;
    }
    else if (room.energyCapacityAvailable >= 300) {
        return 1;
    }
    return 0;
}

var getStoredEnergy = function(room) {
    var storage = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_STORAGE }
    });
    if (storage.length === 0)
        return -1;
    var sum = 0;
    for (let i = 0; i < storage.length; i++) {
        sum += storage[i].store[RESOURCE_ENERGY];
    }
    return sum;
}

var buildUnits = function (room) {
    room.memory.energy.canBuild = false; // block building if not enough energy

    var spawn = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_SPAWN }
    })[0];
    if (spawn === undefined || spawn === null)
        return;
    if (spawn.canCreateCreep([MOVE]) < 0) {
        return; //can't do anything
    }
    if (room.memory.energy.fullSpawn === undefined) {
        room.memory.energy.fullSpawn = 0;
    }
    if (room.energyCapacityAvailable <= room.energyAvailable) {
        room.memory.energy.fullSpawn++;
    } else {
        room.memory.energy.fullSpawn = 0;
    }
    var myTargets = getTargets(room);
    var myUnits = {};
    for (var name in Game.creeps) {
        if (Game.creeps[name].ticksToLive < 100 && room.name !== Game.creeps[name].creep.memory.roomName)
            continue;
        var role = Game.creeps[name].memory.role;
        if (myUnits[role] === undefined) {
            myUnits[role] = 1;
        } else {
            myUnits[role]++;
        }
    }
    
    for (var t = 0; t < myTargets.length; t++) {
        if (myUnits[myTargets[t].role] === undefined)
            myUnits[myTargets[t].role] = 0;
        if (myUnits[myTargets[t].role] < myTargets[t].amount) {
            if (myTargets[t].role === 'builder') { // builders shouldn't block building.
                room.memory.energy.canBuild = true;
                room.memory.energy.canUpgrade = true;
            }
            if (myTargets[t].role !== 'builder' || (room.memory.energy.fullSpawn > 5 && (getLevel(room) < 5 || getStoredEnergy(room) > myUnits[myTargets[t].role] * 10000 || getStoredEnergy(room) === -1)))
                spawn.createCreep(myTargets[t].body, undefined, { role: myTargets[t].role });
            return;
        }
    }
    room.memory.energy.canBuild = true; // every unit built, build again.
    room.memory.energy.canUpgrade = true; // every unit built, build again.
}

module.exports = { buildUnits: buildUnits };

//Target Units
var getTargets = function (room) {
    var level = getLevel(room);
    if (level === 0) {
        return [];
    }
    var miningJobs = 0;
    var attackFlags = [];
    for (var flag in Game.flags) {
        if (Game.flags[flag].color === COLOR_RED) {
            attackFlags.push(Game.flags[flag]);
        }
    }
    if (level === 1) {
        for (var i = 0; i < room.memory.mines.length; i++) {
            miningJobs += room.memory.mines[i].workingPlaces.length + 1;
        }
        return [
            { role: 'harvester', amount: 2, body: [WORK, CARRY, MOVE] },
            { role: 'upgrader', amount: 1, body: [WORK, CARRY, MOVE, CARRY, MOVE] },
            { role: 'harvester', amount: miningJobs, body: [WORK, WORK, CARRY, MOVE] },
            { role: 'builder', amount: 2, body: [WORK, CARRY, MOVE] }
        ];
    }
    if (level === 2) {
        for (var i = 0; i < room.memory.mines.length; i++) {
            miningJobs += room.memory.mines[i].workingPlaces.length + 1;
        }
        return [
            { role: 'harvester', amount: 2, body: [WORK, CARRY, MOVE] },
            { role: 'distributor', amount: 1, body: [CARRY, MOVE, CARRY, MOVE] },
            { role: 'harvester', amount: 3, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'upgrader', amount: 1, body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'harvester', amount: miningJobs, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'builder', amount: room.memory.spawn.rechargeSpots.length - 1, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] }
        ];
    }
    if (level === 3) {
        for (var i = 0; i < room.memory.mines.length; i++) {
            miningJobs += room.memory.mines[i].workingPlaces.length + 1;
        }
        return [
            { role: 'harvester', amount: 1, body: [WORK, CARRY, MOVE] },
            { role: 'distributor', amount: 1, body: [CARRY, MOVE, CARRY, MOVE] },
            { role: 'harvester', amount: 2, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'upgrader', amount: 1, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] },
            { role: 'harvester', amount: miningJobs, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] },
            { role: 'attacker', amount: attackFlags.length * 5, body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK] },
            { role: 'builder', amount: room.memory.spawn.rechargeSpots.length - 1, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] }
        ];
    }
    if (level === 4) {
        return [
            { role: 'harvester', amount: 1, body: [WORK, CARRY, MOVE] },
            { role: 'distributor', amount: 1, body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE] },
            { role: 'harvester', amount: 2, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'upgrader', amount: 1, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] },
            { role: 'harvester', amount: room.memory.mines.length * 2, body: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
            { role: 'attacker', amount: attackFlags.length * 5, body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK] },
            { role: 'builder', amount: room.memory.spawn.rechargeSpots.length - 1, body: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] }
        ];
    }
    if (level === 5) {
        return [
            { role: 'harvester', amount: 1, body: [WORK, CARRY, MOVE] },
            { role: 'distributor', amount: 2, body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE] },
            { role: 'harvester', amount: 2, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'upgrader', amount: 1, body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY] },
            { role: 'harvester', amount: room.memory.mines.length * 2, body: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] },
            { role: 'attacker', amount: attackFlags.length * 5, body: [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK] },
            { role: 'builder', amount: room.memory.spawn.rechargeSpots.length - 2, body: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY] }
        ];
    }
}