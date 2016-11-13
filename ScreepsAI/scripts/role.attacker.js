
var roleAttacker = function (creep) {
    var roomUnderAttack;
    for (var roomName in Memory.rooms) {
        var myRoom = Memory.rooms[roomName];
        if (myRoom.underAttack) {
            roomUnderAttack = roomName;
        }
    }
    var target;
    if (roomUnderAttack !== undefined) {
        if (creep.room.name !== roomUnderAttack) {
            creep.moveTo(new RoomPosition(25, 25, roomUnderAttack));
        } else {
            target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: function(hc){ return hc.owner.username !== 'Hosmagix' }
            });
            if (target !== null) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                    creep.rangedAttack(target);
                }
                return;
            }
        }
    } else {
        var squad = creep.room.find(FIND_MY_CREEPS, {
            filter: function (c) { return (c.memory.role === 'attacker' || c.memory.role === 'healer') && !c.spawning; }
        });
        if (creep.memory.state === undefined) {
            creep.memory.state = 'waiting';
        }
        var collect = false;
        var flag;
        for (var name in Game.flags) {
            flag = Game.flags[name];
            if (flag.color === COLOR_YELLOW) {
                collect = true;
            }
        }
        if (squad.length >= 6 || !collect) {
            creep.memory.state = 'attacking';
        }
        var priorityTargets = [];
        for (let flagN in Game.flags) {
            flag = Game.flags[flagN];
            if (flag.color === COLOR_PURPLE && creep.memory.state === 'attacking' && flag.pos.roomName === creep.pos.roomName) {
                var targets = flag.pos.lookFor(LOOK_STRUCTURES, {
                    filter: {function(s) {return s.structureType !== STRUCTURE_ROAD}}
                });
                if (targets.length > 0) {
                    priorityTargets.push(targets[0]);
                }
            }
        }
        for (let flagN in Game.flags) {
            flag = Game.flags[flagN];
            if (flag.color === COLOR_YELLOW && creep.memory.state === 'waiting') {
                creep.moveTo(flag);
            }
            
            if (flag.color === COLOR_RED && creep.memory.state === 'attacking') {
                if (creep.room.name !== flag.pos.roomName) {
                    creep.moveTo(flag, { ignoreCreeps: true });
                    return;
                }
                else {
                    var creeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
                        filter: function (hc) {
                            return (hc.getActiveBodyparts(ATTACK) > 0 || hc.getActiveBodyparts(RANGED_ATTACK) > 0) && hc.owner.username !== 'Hosmagix';
                        }
                    });
                    target = creep.pos.findClosestByRange(creeps);
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.rangedAttack(target);
                            if (creep.moveTo(target, { reusePath: 0 }) !== ERR_NO_PATH)
                                return;
                        }
                        else {
                            return;
                        }
                    }
                    target = creep.pos.findClosestByRange(priorityTargets);
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.rangedAttack(target);
                            creep.moveTo(target, { reusePath: 0 });
                        }
                        return;
                    }
                    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                        filter: function (structure) { return structure.structureType === STRUCTURE_TOWER && structure.owner.username !== 'Hosmagix'; }
                    });
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.rangedAttack(target);
                            creep.moveTo(target, { reusePath: 0 });
                        }
                        return;
                    }
                    target = creep.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
                        filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
                    });
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.rangedAttack(target);
                            creep.moveTo(target, { reusePath: 0 });
                        }
                        return;
                    }
                    target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                        filter: function (hc) { return hc.owner.username !== 'Hosmagix' }
                    });
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                            creep.rangedAttack(target, { reusePath: 0 });
                        }
                        return;
                    }
                    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                        filter: function (structure) { return structure.structureType !== STRUCTURE_CONTROLLER && structure.owner.username !== 'Hosmagix' }
                    });
                    if (target !== null) {
                        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                            creep.rangedAttack(target, { reusePath: 0 });
                        }
                        return;
                    }
                    creep.moveTo(flag, { reusePath: 0 });
                    
                    return;
                }
            }
        }
    }
    
}

module.exports = { roleAttacker: roleAttacker };