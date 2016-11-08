
var roleAttacker = function (creep) {
    var squad = creep.room.find(FIND_MY_CREEPS, {
        filter: function (c) { return (c.memory.role === 'attacker' || c.memory.role === 'healer') && !c.spawning; }
    });
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
    if (squad.length >= 5 || !collect) {
        creep.memory.state = 'attacking';
    }

    for (let flagN in Game.flags) {
        let flag = Game.flags[flagN];
        if (flag.color === COLOR_YELLOW && creep.memory.state === 'waiting') {
            creep.moveTo(flag);
        }
            
        if (flag.color === COLOR_RED && creep.memory.state === 'attacking') {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveTo(flag);
                return;
            }
            else {
                var target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: function (creep) { return creep.hits < creep.hitsMax }
                });
                if (target !== null) {
                    if (creep.heal(target) === ERR_NOT_IN_RANGE) {
                        creep.rangedHeal(target);
                        creep.moveTo(target);
                    }
                    return;
                }
            }
        }
    }
}
    
module.exports = { roleAttacker: roleAttacker };