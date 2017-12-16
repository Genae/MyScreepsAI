let roleWarrior = function (creep) {
    let target;
    let roomsUnderAttack = [];
    for(let roomId in Memory.globalInfo.roomsUnderAttack){
        let room = Memory.globalInfo.roomsUnderAttack[roomId];
        roomsUnderAttack.push(new RoomPosition(room.x, room.y, room.roomName));
    }
    let roomUnderAttack = creep.pos.findClosestByRange(roomsUnderAttack);
    if(roomUnderAttack === null && roomsUnderAttack.length > 0)
        roomUnderAttack = roomsUnderAttack[0];
    if (roomUnderAttack !== null && roomUnderAttack !== undefined) {
        if (creep.room.name !== roomUnderAttack.roomName) {
            creep.moveTo(roomUnderAttack);
        } else {
            if (creep.memory.role === 'attacker'){
                target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: function(hc){ return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1 }
                });
                if (target !== null) {
                    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                        creep.rangedAttack(target);
                    }
                }
            }
            else if (creep.memory.role === 'healer'){
                healingWarrior(creep, roomUnderAttack);
            }
        }
    }
    else {
        let squad = creep.room.find(FIND_MY_CREEPS, {
            filter: function (c) {
                return (c.memory.role === 'attacker' || c.memory.role === 'healer') && !c.spawning;
            }
        });
        if (creep.memory.state === undefined) {
            creep.memory.state = 'waiting';
        }
        let collect = false;
        let flag;
        for (let flagN in Game.flags) {
            let flag = Game.flags[flagN];
            if (flag.color === COLOR_YELLOW && flag.room.name === creep.memory.roomName) {
                collect = true;
            }
        }
        if (squad.length >= 6 || !collect) {
            creep.memory.state = 'attacking';
        }
        let priorityTargets = [];
        for (let flagN in Game.flags) {
            flag = Game.flags[flagN];
            if (flag.color === COLOR_PURPLE && creep.memory.state === 'attacking' && flag.pos.roomName === creep.pos.roomName) {
                let targets = flag.pos.lookFor(LOOK_STRUCTURES);
                if (targets.length > 0) {
                    priorityTargets = targets;
                } else {
                    flag.remove();
                }
            }
        }
        for (let flagN in Game.flags) {
            flag = Game.flags[flagN];
            if (flag.color === COLOR_YELLOW && creep.memory.state === 'waiting' && flag.room.name === creep.memory.roomName) {
                creep.moveTo(flag);
            }

            if (flag.color === COLOR_RED && creep.memory.state === 'attacking') {
                if (creep.room.name !== flag.pos.roomName) {
                    creep.moveTo(flag, {ignoreCreeps: true, reusePath: 50});
                    return;
                }
                else {
                    if (creep.memory.role === 'attacker')
                        attackWarrior(creep, priorityTargets, flag.pos);

                    if (creep.memory.role === 'healer')
                        healingWarrior(creep, flag.pos);
                    return;
                }
            }
        }
    }
};

let healingWarrior = function (creep, pos) {
    let targets = creep.pos.findInRange(FIND_MY_CREEPS, 10, {
        filter: function (mc) { return mc.hits < mc.hitsMax }
    });
    if (targets.length > 0) {
        targets.sort(function(a, b) { return getVal(a, creep) - getVal(b, creep)});
        let target = targets[0];
        let res = creep.heal(target);
        if (res === ERR_NOT_IN_RANGE) {
            creep.rangedHeal(target);
            creep.moveTo(target, { reusePath: 0 });
        }
        else {
            creep.moveTo(pos, { reusePath: 0 });
        }
    } else {
        creep.moveTo(pos, { reusePath: 0 });
    }
};

let getVal = function(creep) {
    return creep.hits / creep.hitsMax;
};

let attackWarrior = function(creep, priorityTargets, pos){
    let target;
    let myHealers = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
        filter: function (mc) {
            return mc.memory.role === 'healer'
        }

    });
    let myHealersInRoom = creep.room.find(FIND_MY_CREEPS, {
        filter: function (mc) {
            return mc.memory.role === 'healer'
        }

    });
    if (myHealersInRoom.length > 0 && myHealers.length === 0) { // no healers in Range
        return;
    }
    let creeps = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 5, {
        filter: function (hc) {
            return (hc.getActiveBodyparts(ATTACK) > 0 || hc.getActiveBodyparts(RANGED_ATTACK) > 0) && Memory.globalSettings.allies.indexOf(hc.owner.username) === -1;
        }
    });
    target = creep.pos.findClosestByRange(creeps);
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(priorityTargets);
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType === STRUCTURE_TOWER && Memory.globalSettings.allies.indexOf(structure.owner.username) === -1;
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
        filter: function (hc) {
            return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
        filter: function (hc) {
            return Memory.globalSettings.allies.indexOf(hc.owner.username) === -1
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType !== STRUCTURE_CONTROLLER && structure.structureType !== STRUCTURE_RAMPART && Memory.globalSettings.allies.indexOf(structure.owner.username) === -1
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_HOSTILE_CONSTRUCTION_SITES, {
        filter: function (structure) {
            return Memory.globalSettings.allies.indexOf(structure.owner.username) === -1
        }
    });
    if (target !== null) {
        creep.moveTo(target);
        return;
    }

    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType !== STRUCTURE_CONTROLLER && Memory.globalSettings.allies.indexOf(structure.owner.username) === -1
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: function (structure) {
            return structure.structureType === STRUCTURE_WALL
        }
    });
    if (seekAndDestroy(creep, target))
        return;

    creep.moveTo(pos, {reusePath: 0});
};

let seekAndDestroy = function(creep, target) {
    if (target !== null) {
        if (creep.attack(target) === ERR_NOT_IN_RANGE) {
            creep.rangedAttack(target);
            if (creep.moveTo(target, { reusePath: 0 }) !== ERR_NO_PATH)
                return true;
        }
        else {
            return true;
        }
    }
    return false;
};

module.exports = { roleWarrior: roleWarrior };