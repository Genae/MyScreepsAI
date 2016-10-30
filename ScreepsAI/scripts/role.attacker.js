
var roleAttacker = function (creep) {
    var squad = creep.room.find(FIND_MY_CREEPS, {
        filter: function(c) { return c.memory.role === 'attacker'; }
    });
    if (creep.memory.state === undefined) {
        creep.memory.state = 'waiting';
    }
    if (squad.length >= 5) {
        creep.memory.state = 'attacking';
    }
    for (var flagN in Game.flags) {
        var flag = Game.flags[flagN];
        if (flag.color === COLOR_YELLOW && creep.memory.state === 'waiting') {
            creep.moveTo(flag);
        }
        if (flag.color === COLOR_RED && creep.memory.state === 'attacking') {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveTo(flag);
                return;
            }
            else {
                var target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                    filter: function (structure) { return structure.structureType === STRUCTURE_TOWER; }
                });
                if (target !== undefined) {
                    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                target = creep.pos.findClosestByRange(FIND_HOSTILE_SPAWNS);
                if (target !== undefined) {
                    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if (target !== undefined) {
                    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                    filter: function (structure) { return structure.structureType !== STRUCTURE_STORAGE && structure.structureType !== STRUCTURE_CONTROLLER; }
                });
                if (target !== undefined) {
                    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                return;
            }
        }
    }
}

module.exports = { roleAttacker: roleAttacker };