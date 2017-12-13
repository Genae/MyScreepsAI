
let roleClaimer = function (creep) {

    for (let flag of Game.flags) {
        if (flag.color === COLOR_BLUE) {
            if (creep.room.name !== flag.pos.roomName) {
                creep.moveTo(flag);
            } else {
                let c = creep.room.controller;
                if (creep.claimController(c) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(c);
                }
            }
        }
    }
};

module.exports = { roleClaimer: roleClaimer };