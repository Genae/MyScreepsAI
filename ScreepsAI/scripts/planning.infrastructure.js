var markMoved = function(pos) {
	var posInfo = getPosInfo(pos);
	posInfo.moved++;
}

var getPosInfo = function(pos) {
    var mem = Game.rooms[pos.roomName].memory;
	if (mem.positionInfos === undefined) {
	    mem.positionInfos = {};
	}
	if (mem.positionInfos[pos.x + ',' + pos.y] === undefined) {
	    mem.positionInfos[pos.x + ',' + pos.y] = {
	        moved: 0,
	    };
	}
    return mem.positionInfos[pos.x + ',' + pos.y];
}

var improveMine = function (room) {
    for (var i = 0; i < room.memory.mines.length; i++) {
        if (!room.memory.mines[i].pathImproved) {
            improvePath(room.memory.mines[i].pathToMine.path);
            room.memory.mines[i].pathImproved = true;
        }
    }
}

var improvePath = function(path) {
    for (var i = 0; i < path.length; i++) {
        new RoomPosition(path[i].x, path[i].y, path[i].roomName).createConstructionSite(STRUCTURE_ROAD);
    }
}

module.exports = {
    markMoved: markMoved,
    improveMine: improveMine
};