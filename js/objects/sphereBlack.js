import AsbtractGameObjectManager from '../object.js'

import * as GAME from '../game.js'

class SphereBlack extends AsbtractGameObjectManager {
    constructor(filename) { 
        super(filename); 
    }

    update(delta, elapsed) {
    }
    
    onCollision(other) {
    }

    onUpdate(delta, elapsed) {
        super.onUpdate(delta, elapsed);
    }

    onKeyboardKeyDown(event) {
    }

    onMouseDown(event) {
    }

    resetGamePlayParams(params) {
        if (!params) { throw new Error("params must be an object") }

        return params;
    }
}

const sphereBlack = new SphereBlack("sphere_black");

GAME.managers.sphereBlack = sphereBlack;

export default sphereBlack;