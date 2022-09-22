"use strict"

import * as THREE from 'three';

import Stats from 'https://unpkg.com/three@0.142.0/examples/jsm/libs/stats.module.js';

import * as YUKA from './lib/yuka/f7503a588747128eaa180fa9379b59419129164c/yuka.module.js';

import * as RAYCASTER from './raycaster.js';
import * as FILES from './files.js';
import * as GAME from './game.js'
import * as PHYSICS from './physics.js'
import * as GLTFS from './gltfs.js'
import * as SOUNDS from './sounds.js'
import * as GRAPHICS from './graphics.js'
import * as PRIMITIVES from './primitives.js'
import * as UTILS from './utils.js'
import WebGLCheck from './lib/WebGL.js';

import cubeGreen from './objects/cubeGreen.js';
import cubeRed from './objects/cubeRed.js';
import sphereBlack from './objects/sphereBlack.js';

// see https://threejs.org/docs/index.html#manual/en/introduction/WebGL-compatibility-check
if ( !WebGLCheck.isWebGLAvailable() ) {
    const warning = WebGLCheck.getWebGLErrorMessage();
    document.body.appendChild( warning );
    throw new Error(warning.textContent);
}

window.GAME = GAME;

GAME.state.onPhaseChange.push( function(phase) {
    switch (phase) {
        case GAME.PHASES.INIT:
            init();
            initEvents();
            break;
        case GAME.PHASES.LOAD_STARTED:
            loadStarted();
            break;
        case GAME.PHASES.LOAD_COMPLETED:
            loadCompleted();

            requestAnimationFrame( render );
            break;
        case GAME.PHASES.GAME_STARTED:
            gameStarted();
            break;
        case GAME.PHASES.GAME_PAUSED:
            break;
        case GAME.PHASES.GAME_RESUMED:
            break;
    }
});

let ground = undefined;
function init() {
    GAME.state.stats = new Stats();
    //document.body.appendChild( GAME.state.stats.dom );

    GAME.view.init(20, -100);
    // GRAPHICS INIT
    GAME.graphics.renderer = GRAPHICS.setupRenderer('#mainCanvas');
    GAME.graphics.camera = GRAPHICS.setupPerspectiveCamera('#mainCanvas', UTILS.tmpV1.set(0, 15, 0), UTILS.tmpV2.set(0, 0, 0));
    GAME.graphics.camera.frustum = UTILS.getCameraFrustum(GAME.graphics.camera);
    //GAME.graphics.camera.rotateY(Math.PI / 2);
    //GAME.graphics.camera.lookAt(0, 0, 0);
    GAME.graphics.scene = GRAPHICS.setupScene('#96b0bc'); // https://encycolorpedia.com/96b0bc
    GAME.graphics.clock = new THREE.Clock();
    //GAME.graphics.orbitControls = GRAPHICS.setupOrbitControls(GAME.graphics.camera, GAME.graphics.renderer, 0, 0, 0);

    Ammo().then(function ( AmmoLib ) {
        Ammo = AmmoLib;

        // Physics Init
        PHYSICS.init();
        PHYSICS.dynamicsWorld.setGravity( new Ammo.btVector3( 0, 0, 0 ) );
        // YUKA init - AI Game Library
        GAME.yuka.entityManager = new YUKA.EntityManager();
        GAME.yuka.time = new YUKA.Time();

        // SCENE OBJECTS
        const dirLight = GRAPHICS.setupDirLight();
        GAME.graphics.scene.add(dirLight);
        
        // GROUND
        let w = 10, h = 0.1, d = 10;
        ground = PRIMITIVES.makeGround(w, h, d);
        ground["userData"].filename = "ground";
        ground.position.y = -0.05;
        // PHYSICS.initObject(ground, 0, UTILS.tmpV1.set(w, h, d), 0.05);
        // PHYSICS.addRigidBody(ground);
        GAME.graphics.scene.add(ground);

        GAME.state.phase = GAME.PHASES.LOAD_STARTED;
    })
}

function loadStarted() {
    // let processes = 2;
    // // Loading GLTFs
    // let groups = [ FILES.gltfs ];
    // GLTFS.queueFileNames(groups, (function() {
    //     let loaded = 0;
    //     let total = groups.reduce((prev, curr) => prev + curr.filenames.length, 0);
    //     return function(filename, gltf) {
    //         GAME.models.add(filename, gltf.scene);
    //         // All files loaded?
    //         if (++loaded == total) { if (!--processes) { GAME.state.phase = GAME.PHASES.LOAD_COMPLETED; }; }
    //     }
    // })());
    // // Loading Sounds
    // groups = [ FILES.sounds ];
    // SOUNDS.queueFileNames(groups, (function() { 
    //     let loaded = 0;
    //     let total = groups.reduce((prev, curr) => prev + curr.filenames.length, 0);
    //     return function(filename, buffer) {
    //         GAME.audioBuffers.add(filename, buffer);
    //         // All files loaded?
    //         if (++loaded == total) { if (!--processes) { GAME.state.phase = GAME.PHASES.LOAD_COMPLETED; }; }
    //     }
    // })());

    setTimeout(() => GAME.state.phase = GAME.PHASES.LOAD_COMPLETED, 100);
}

function loadCompleted() {
    let obj3d;
    GAME.models.add("cube_green", obj3d = PRIMITIVES.makeBox(0.90, 0.90, 0.90, 0x44aa88));
    obj3d["userData"].filename = "cube_green";
    GAME.models.add("cube_red", obj3d = PRIMITIVES.makeBox(0.90, 0.90, 0.90, 0xFF2222));
    obj3d["userData"].filename = "cube_red";
    GAME.models.add("sphere_black", obj3d = PRIMITIVES.makeSphere(0.1, 12, 7, 0x000000));
    obj3d["userData"].filename = "sphere_black";

    cubeGreen.createInstances(1, 1000);
    cubeRed.createInstances(1, 10);
    sphereBlack.createInstances(1, 10);

    spreadSounds();

    const gridCell = new THREE.Vector2(0, 0);
    Object.values(GAME.managers).forEach((obj) => {
        if (!obj.getInstanceAvailable) { return; }
        let obj3d = obj.getInstanceAvailable(0);
        UTILS.tmpV1.set(gridCell.x * 3, obj3d.userData.center.y + 0.05 + 0.1, gridCell.y * 3 - 10);
        obj3d = obj.addInstanceTo(GAME.graphics.scene, UTILS.tmpV1);
        UTILS.spiralGetNext(gridCell);
    });

    document.getElementById("startButton").disabled = false;
}

function spreadSounds() {

}

function gameStarted() {
    GAME.managers.releaseAllInstances();

    // https://stackoverflow.com/questions/14856339/how-do-i-change-the-opacity-of-an-stl-object-in-three-js-webgl
    //ground.material.opacity = 0;
    //ground.material.transparent = true;
    //ground.material.visible = false;

}

function render(timeElapsed) {
    requestAnimationFrame( render );

    const timeDelta = GAME.time.delta = GAME.graphics.clock.getDelta();
    GAME.time.elapsed = timeElapsed;

    RAYCASTER.getIntersects(GAME.graphics.scene.children, RAYCASTER.pointer, GAME.graphics.camera);

    // document.getElementById("info").style.display = "block";
    // let available1 = GAME.instances["ammo_machinegun.glb"]?.available.length;
    // let inuse1 = GAME.instances["ammo_machinegun.glb"]?.inuse.length;
    // document.getElementById("info").textContent = `inuse: ${inuse1} available: ${available1};`
    // let available2 = GAME.instances["craft_speederC.glb"]?.available.length;
    // let inuse2 = GAME.instances["craft_speederC.glb"]?.inuse.length;
    // document.getElementById("info").textContent = `inuse: ${inuse2} available: ${available2}`;

    switch (GAME.state.phase) {
        case GAME.PHASES.INIT:
        case GAME.PHASES.LOAD_STARTED:
        case GAME.PHASES.LOAD_COMPLETED:
        case GAME.PHASES.GAME_PAUSED:
            // for (let gltf of Object.values(GLTFS.loaded)) {
            //     gltf.scene.rotation.y += timeDelta * (Math.PI / 2);
            // }
            break;
        case GAME.PHASES.GAME_STARTED:
        case GAME.PHASES.GAME_RESUMED:
            //const yukaDelta = GAME.yuka.time.update().getDelta();
            //GAME.yuka.entityManager.update( yukaDelta );

            //PHYSICS.update(timeDelta);

            for (let manager of Object.values(GAME.managers)) {
                if (manager.update) {
                    manager.update(timeDelta, timeElapsed);
                }
            }

            for (let value of Object.values(GAME.instances)) {
                if (value.inuse) {
                    for (let obj3d of value.inuse) {
                        obj3d.userData.onUpdate(timeDelta, timeElapsed);
                    }
                }
            }

            break;
    }

    GAME.callbacks?.onUpdate?.(timeDelta, timeElapsed);

    // see https://threejs.org/manual/#en/responsive
    if (UTILS.resizeRendererToDisplaySize(GAME.graphics.renderer)) {
        const canvas = GAME.graphics.renderer.domElement;
        GAME.graphics.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        GAME.graphics.camera.updateProjectionMatrix();
        UTILS.getCameraFrustum(GAME.graphics.camera, GAME.graphics.camera.frustum);
    }

    GAME.state.stats.update();
    GAME.graphics.renderer.render( GAME.graphics.scene, GAME.graphics.camera );
};

function initEvents() {
    document.getElementById("startButton").addEventListener("click", onClickStartButton, false);
    document.getElementById("resumeButton").addEventListener("click", onClickResumeButton, false);
    document.getElementById("menuMobileButton").addEventListener("touchstart", onClickMenuMobileButton, false);

    document.addEventListener("keydown", onKeyDown);
    
    // https://threejs.org/docs/#api/en/core/Raycaster
    document.addEventListener( 'pointermove', onPointerMove, false);
    // https://stackoverflow.com/questions/15505272/javascript-while-mousedown
    document.addEventListener("mousedown", onMouseDown); // Assign events
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseout", onMouseUp); // Also clear the interval when user leaves the window with mouse
    
    // https://discourse.threejs.org/t/touch-in-three-js/23382/3
    // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchCancel);
    document.addEventListener('touchmove', onTouchMove);
}

function onClickStartButton() {
    document.getElementById("mainMenu").style.display = "none";

    UTILS.unlockIphoneSounds(GAME.audioListener);

    GAME.state.phase = GAME.PHASES.GAME_STARTED;
}
function onClickResumeButton() {
    document.getElementById("mainMenu").style.display = "none";

    GAME.state.phase = GAME.PHASES.GAME_RESUMED;
}
function onClickMenuMobileButton() { onPausePressed(); }

function onKeyDown(event) {
    switch (event.code) {
        case 'Escape':
            onPausePressed();
            break;
    }

    switch (GAME.state.phase) {
        case GAME.PHASES.INIT:
            break;
        case GAME.PHASES.LOAD_STARTED:
            break;
        case GAME.PHASES.LOAD_COMPLETED:
            break;
        case GAME.PHASES.GAME_STARTED:
        case GAME.PHASES.GAME_RESUMED:
            for (let value of Object.values(GAME.instances)) {
                if (value.inuse) {
                    for (let obj3d of value.inuse) {
                        obj3d.userData.onKeyboardKeyDown(event);
                    }
                }
            }
            break;
        case GAME.PHASES.GAME_PAUSED:
            break;
    }

    GAME.callbacks?.onKeyDown?.(event);
}

function onPausePressed() {
    switch (GAME.state.phase) {
        case GAME.PHASES.INIT:
            break;
        case GAME.PHASES.LOAD_STARTED:
            break;
        case GAME.PHASES.LOAD_COMPLETED:
            break;
        case GAME.PHASES.GAME_STARTED:
        case GAME.PHASES.GAME_RESUMED:
            //document.getElementById("resumeButton").style.display = "block";
            //document.getElementById("mainMenu").style.display = "table";
            
            GAME.state.phase = GAME.PHASES.GAME_PAUSED;
            break;
        case GAME.PHASES.GAME_PAUSED:
            //document.getElementById("mainMenu").style.display = "none";

            GAME.state.phase = GAME.PHASES.GAME_RESUMED;
            break;
    }
}

function calculateRaycasterPointer(x, y) {
    // calculate pointer position in normalized device coordinates (-1 to +1) for both components
    RAYCASTER.pointer.x = ( x / window.innerWidth ) * 2 - 1;
    RAYCASTER.pointer.y = - ( y / window.innerHeight ) * 2 + 1;
}

function onPointerMove( event ) { calculateRaycasterPointer(event.clientX, event.clientY); }


// https://stackoverflow.com/questions/15505272/javascript-while-mousedown
var mouseDownID = -1;  //Global ID of mouse down interval
function onMouseDown(event) {
    if(mouseDownID == -1)  { //Prevent multimple loops!
        mouseDownID = setInterval(whileMouseDown, 1 /*execute every 1ms*/, event);
    }
}
function onMouseUp(event) {
    if(mouseDownID!=-1) {  //Only stop if exists
        clearInterval(mouseDownID);
        mouseDownID=-1;
    }
}
function whileMouseDown(event) {
    switch (GAME.state.phase) {
        case GAME.PHASES.INIT:
            break;
        case GAME.PHASES.LOAD_STARTED:
            break;
        case GAME.PHASES.LOAD_COMPLETED:
            break;
        case GAME.PHASES.GAME_STARTED:
        case GAME.PHASES.GAME_RESUMED:
            for (let value of Object.values(GAME.instances)) {
                if (value.inuse) {
                    for (let obj3d of value.inuse) {
                        obj3d.userData.onMouseDown(event);
                    }
                }
            }
            break;
        case GAME.PHASES.GAME_PAUSED:
            break;
    }
}

// https://discourse.threejs.org/t/touch-in-three-js/23382/3
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
const ongoingTouches = [];
function copyTouch({ identifier, pageX, pageY }) { return { identifier, pageX, pageY }; }
function ongoingTouchIndexById(idToFind) {
    for (let i = 0; i < ongoingTouches.length; i++) {
        const id = ongoingTouches[i].identifier;
  
        if (id == idToFind) { return i; }
    }
    return -1;
}
function onTouchStart(event) {
    //event.preventDefault();
    //console.log('touchstart.');
    const touches = event.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
        //console.log(`touchstart: ${i}.`);
        ongoingTouches.push(copyTouch(touches[i]));

        //console.log(`next( ${ touches[i].pageX }, ${ touches[i].pageY } );`);
        calculateRaycasterPointer(touches[i].pageX, touches[i].pageY);
    }

    if(mouseDownID == -1)  { //Prevent multimple loops!
        mouseDownID = setInterval(whileMouseDown, 1 /*execute every 1ms*/, event);
    }
}
function onTouchMove(event) {
    //event.preventDefault();
    const touches = event.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
        const idx = ongoingTouchIndexById(touches[i].identifier);
    
        if (idx >= 0) {
            //console.log(`continuing touch ${ idx }`);
            //console.log(`prev( ${ ongoingTouches[idx].pageX }, ${ ongoingTouches[idx].pageY } );`);
            //console.log(`next( ${ touches[i].pageX }, ${ touches[i].pageY } );`);
    
            calculateRaycasterPointer(touches[i].pageX, touches[i].pageY);

            ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        } else {
            console.log('can\'t figure out which touch to continue');
        } 
    }
}
function onTouchEnd(event) {
    //event.preventDefault();
    //console.log("touchend");
    const touches = event.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
    
        if (idx >= 0) {
            //console.log(`prev( ${ ongoingTouches[idx].pageX }, ${ ongoingTouches[idx].pageY } );`);
            //console.log(`next( ${ touches[i].pageX }, ${ touches[i].pageY } );`);

            calculateRaycasterPointer(touches[i].pageX, touches[i].pageY);

            ongoingTouches.splice(idx, 1);  // remove it; we're done
        } else {
            log('can\'t figure out which touch to end');
        }
    }

    if(mouseDownID != -1) {  //Only stop if exists
        clearInterval(mouseDownID);
        mouseDownID=-1;
    }
}
function onTouchCancel(event) {
    //event.preventDefault();
    //console.log('touchcancel.');
    const touches = event.changedTouches;
  
    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
        ongoingTouches.splice(idx, 1);  // remove it; we're done
    }

    if(mouseDownID!=-1) {  //Only stop if exists
        clearInterval(mouseDownID);
        mouseDownID=-1;
    }
}

// // HELPERS
// // see https://threejs.org/manual/#en/lights
// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight);
// scene.add(dirLightHelper);
// // see https://threejs.org/manual/#en/shadows
// const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
// scene.add(cameraHelper);