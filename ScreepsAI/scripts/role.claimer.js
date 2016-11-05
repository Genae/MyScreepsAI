
var roleClaimer = function (creep) {

    for (var name in Game.flags) {
        var flag = Game.flags[name];
        if (flag.color === COLOR_BLUE) {
            if (creep.room.name != flag.pos.roomName) {
                creep.moveTo(flag);
            } else {
                var c = creep.room.controller;
                if (creep.claimController(c) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(c);
                }
            }
        }
    }
       
    
}

module.exports = { roleClaimer: roleClaimer };