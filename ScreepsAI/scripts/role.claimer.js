
let roleClaimer = function (creep) {

    for (let flagName in Game.flags) {
        let flag = Game.flags[flagName];
        if (flag.color === COLOR_BLUE) {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveTo(flag);
            } else {
                let c = creep.room.controller;
                if (creep.claimController(c) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(c);
                }
                else{
                    if (Game.rooms[flag.pos.roomName] && Game.rooms[flag.pos.roomName].controller.level > 0){
                        flag.remove();
                        creep.memory.role = 'reserver';
                    }
                }
            }
        }
    }
};

module.exports = { roleClaimer: roleClaimer };