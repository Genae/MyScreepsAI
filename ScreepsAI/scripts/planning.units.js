var getLevel = function (room) {
    if (room.energyCapacityAvailable >= 550) {
        return 2;
    } else {
        return 1;
    }
}

var buildUnits = function (room) {
    room.memory.energy.canBuild = false; // block building if not enough energy
    var spawn = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_SPAWN }
    })[0];
    if (spawn.canCreateCreep([MOVE]) < 0) {
        return; //can't do anything
    }
    var myTargets = targets[getLevel(room)];
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
        if (myUnits[myTargets[t].role] >= myTargets[t].amount) {
            myUnits[myTargets[t].role] -= myTargets[t].amount;
        } else {
            spawn.createCreep(myTargets[t].body, undefined, { role: myTargets[t].role });
            return;
        }
    }
    room.memory.energy.canBuild = true; // every unit built, build again.
    room.memory.energy.canUpgrade = true; // every unit built, build again.
}

module.exports = { buildUnits: buildUnits };

//Target Units
var targets = [
    //lv 0
    [],
    //lv 1
    [
        { role: 'harvester', amount: 2, body: [WORK, CARRY, MOVE] },
        { role: 'upgrader', amount: 1, body: [WORK, CARRY, MOVE, CARRY, MOVE] },
        { role: 'harvester', amount: 3, body: [WORK, WORK, CARRY, MOVE] },
        { role: 'builder', amount: 2, body: [WORK, CARRY, MOVE] },
    ],
    //lv 2
    [
        { role: 'harvester', amount: 2, body: [WORK, CARRY, MOVE] },
        { role: 'distributor', amount: 1, body: [CARRY, MOVE, CARRY, MOVE] },
        { role: 'harvester', amount: 2, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
        { role: 'upgrader', amount: 1, body: [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] },
        { role: 'harvester', amount: 1, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
        { role: 'builder', amount: 1, body: [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE] },
    ]
];

