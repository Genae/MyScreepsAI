var getLevel = function (room) {
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

var buildUnits = function (room) {
    room.memory.energy.canBuild = false; // block building if not enough energy
    var spawn = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_SPAWN }
    })[0];
    if (spawn.canCreateCreep([MOVE]) < 0) {
        return; //can't do anything
    }
    var myTargets = getTargets(room);
    var myUnits = {};
    for (var name in Game.creeps) {
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
        return [
            { role: 'harvester', amount: 1, body: [WORK, CARRY, MOVE] },
            { role: 'distributor', amount: 1, body: [CARRY, MOVE, CARRY, MOVE] },
            { role: 'harvester', amount: 2, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
            { role: 'upgrader', amount: 1, body: [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] },
            { role: 'harvester', amount: room.memory.mines.length * 2, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] },
            { role: 'builder', amount: room.memory.spawn.rechargeSpots.length - 1, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] }
        ];
    }
}

