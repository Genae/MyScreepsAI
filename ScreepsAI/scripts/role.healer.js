var getVal = function(creep, healer) {
    return healer.pos.getRangeTo(creep.pos) / (creep.hits / creep.hitsMax);
}

var roleHealer = function (creep) {
    var squad = creep.room.find(FIND_MY_CREEPS, {
        filter: function (c) { return (c.memory.role === 'attacker' || c.memory.role === 'healer') && !c.spawning; }
    });
    if (creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }
    if (creep.memory.state === undefined) {
        creep.memory.state = 'waiting';
    }
    var collect = false;
    for (var name in Game.flags) {
        let flag = Game.flags[name];
        if (flag.color === COLOR_YELLOW) {
            collect = true;
        }
    }
    if (squad.length >= 6 || !collect) {
        creep.memory.state = 'attacking';
    }

    for (let flagN in Game.flags) {
        let flag = Game.flags[flagN];
        if (flag.color === COLOR_YELLOW && creep.memory.state === 'waiting') {
            creep.moveTo(flag);
        }
            
        if (flag.color === COLOR_RED && creep.memory.state === 'attacking') {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveTo(flag, { ignoreCreeps: true });
                return;
            }
            else {
                var targets = creep.pos.find(FIND_MY_CREEPS, {
                    filter: function (mc) { return mc.hits < mc.hitsMax }
                });
                if (targets.length > 0) {
                    targets.sort(function(a, b) { return getVal(a, creep) - getVal(b, creep)});
                    var target = targets[0];
                    if (creep.heal(target) === ERR_NOT_IN_RANGE) {
                        creep.rangedHeal(target);
                        creep.moveTo(target, { reusePath: 0 });
                    }
                    else if (creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49) {
                        creep.moveTo(flag, { reusePath: 0 });
                    }
                    return;
                } else {
                    creep.moveTo(flag, { reusePath: 0 });
                }
            }
        }
    }
}
    
module.exports = { roleHealer: roleHealer };