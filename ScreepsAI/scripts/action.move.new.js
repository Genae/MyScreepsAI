let moveTo = function (creep, pos, range) {
    if (range === undefined) {
        range = 0;
    }
    if (pos.pos !== undefined)
        pos = pos.pos;
    creep.memory.move = {};
    creep.memory.move.pathTargets = { pos: pos, range: range };
    creep.memory.move.moving = true;
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
    if (isInRange(creep.pos, targetPos, creep.memory.move.pathTargets.range)){
        creep.memory.move.moving = false;
        return false;
    }        
    let res = creep.moveTo(targetPos, {
        reusePath: creep.memory.move.pathBlocked > 1 ? 1 : 30, 
        visualizePathStyle: style, 
        ignoreCreeps: creep.memory.move.pathBlocked <= 1
    });
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

let isInRange = function (pos1, pos2, range) {
    return pos1.getRangeTo(pos2) <= range;
};

module.exports = { moveTo: moveTo, continueMove: continueMove};