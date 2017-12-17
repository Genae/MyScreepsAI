let moveTo = function (creep, pos, range) {
    if (range === undefined) {
        range = 0;
    }
    if (pos.pos !== undefined)
        pos = pos.pos;
    creep.memory.move = {};
    creep.memory.move.pathTargets = { pos: pos, range: range };
    creep.memory.move.moving = true;
    creep.memory.move.recalculate = false;
    creep.memory.move.pathBlocked = 0;
    return continueMove(creep);
};

let continueMove = function (creep) {
    if (creep.memory.move === undefined || creep.memory.move.moving === false)
        return false;
    if (creep.fatigue > 0) {
        return true;
    }
    if (creep.memory.move.lastPos !== undefined && creep.memory.move.lastPos.x === creep.pos.x && creep.memory.move.lastPos.y === creep.pos.y){
        creep.memory.move.pathBlocked++;
    }
    else{
        creep.memory.move.pathBlocked = 0;
    }
    let targetPos = new RoomPosition(creep.memory.move.pathTargets.pos.x, creep.memory.move.pathTargets.pos.y, creep.memory.move.pathTargets.pos.roomName);

    let dist = creep.pos.getRangeTo(targetPos);
    if (dist <= creep.memory.move.pathTargets.range){
        creep.memory.move.moving = false;
        return false;
    }
    creep.memory.move.recalculate = dist < creep.memory.move.pathTargets.range + 5 || creep.memory.move.pathBlocked > 1;
    let config = {
        reusePath: creep.memory.move.recalculate === true ? 1 : 30,
        visualizePathStyle: style,
        ignoreCreeps: (creep.memory.move.pathBlocked <= 1 || creep.memory.move.pathBlocked > 10) && dist > creep.memory.move.pathTargets.range + 2
    };
    if (creep.memory.move.pathTargets.roomName === creep.pos.roomName){
        config.maxRooms = 1;
        config.maxOps = 200;
    }
    let res = creep.moveTo(targetPos, config);
    creep.memory.move.recalculate = creep.memory.move.pathBlocked > 1;
    if (res === 0){
        creep.memory.move.lastPos = creep.pos;
    }
    return true;
};

let style = {
    fill: 'transparent',
    stroke: '#44abff',
    lineStyle: 'dashed',
    strokeWidth: .15,
    opacity: .1
};


module.exports = { moveTo: moveTo, continueMove: continueMove};