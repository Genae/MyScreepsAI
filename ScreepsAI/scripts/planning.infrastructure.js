var markMoved = function(pos) {
	var posInfo = getPosInfo(pos);
	posInfo.moved++;
	if (posInfo.moved === 3) {
	    pos.createConstructionSite(STRUCTURE_ROAD);
	}
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

module.exports = {
	markMoved: markMoved
};