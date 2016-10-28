var buildUnits = function (room) {
    var spawn = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_SPAWN }
    })[0];
    if (spawn.canCreateCreep([WORK]) < 0) {
        return; //can't do anything
    }
    var myTargets = targets[room.controller.level];
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
}

module.exports = { buildUnits: buildUnits };

//Target Units
var targets = [
    //lv 0
    [],
    //lv 1
    [
        { role: 'harvester', amount: 3, body: [WORK, CARRY, MOVE] },
        { role: 'upgrader', amount: 1, body: [WORK, WORK, CARRY, MOVE] },
        { role: 'builder', amount: 1, body: [WORK, CARRY, MOVE] },
        { role: 'harvester', amount: 3, body: [WORK, CARRY, MOVE] }
    ],
    //lv 2
    [
        { role: 'harvester', amount: 3, body: [WORK, CARRY, MOVE] },
        { role: 'upgrader', amount: 1, body: [WORK, WORK, CARRY, MOVE] },
        { role: 'builder', amount: 1, body: [WORK, CARRY, MOVE] },
        { role: 'harvester', amount: 3, body: [WORK, CARRY, MOVE] }
    ]
];

