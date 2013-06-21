'use strict';


/**
 * The player
 * @type {Object}
 */
var player = {
  model: {objects: new THREE.Object3D(), motion: 'stand', state: 'stand'},
  position: {x: 0, y: 0, z: 0, direction: 0},
  camera: {speed: 500, distance: thirdPersonCameraDistance, x: 0, y: 0, z: 0},
  physicalShape: false,
  modelHeight: 1.2,
  modelRadius: 0.3
};


/**
 * Player droid-like (code MD2) mesh
 * @type {Object}
 */
var md2meshBody;


/**
 * Tree mesh
 * @type {Object}
 */
var treeBody;


/**
 * Player motion state
 * @type {Object}
 */
var moveState = {
  moving: false,
  front: false,
  Backwards: false,
  left: false,
  right: false,
  speed: .1,
  angle: 0
};


/**
 * Structure of the droid model json file :
 * This file contain a list of all vertex position, for each motion type.
 *
 * MOTION: [START_INDEX,
 *          END_INDEX,
 *          FRAMEPERSECOND,
 *          {state: STANDSTATE, action: false}],
 *
 * @type {Object.<string, Array>}
 * @const
 */
var md2frames = {
  stand: [0, 39, 9, {state: 'stand', action: false}],
  run: [40, 45, 10, {state: 'stand', action: false}],
  attack: [46, 53, 10, {state: 'stand', action: true}],
  pain1: [54, 57, 7, {state: 'stand', action: true}],
  pain2: [58, 61, 7, {state: 'stand', action: true}],
  pain3: [62, 65, 7, {state: 'stand', action: true}],
  jump: [66, 71, 7, {state: 'stand', action: true}],
  flip: [72, 83, 7, {state: 'stand', action: true}],
  salute: [84, 94, 7, {state: 'stand', action: true}],
  taunt: [95, 111, 10, {state: 'stand', action: true}],
  wave: [112, 122, 7, {state: 'stand', action: true}],
  point: [123, 134, 6, {state: 'stand', action: true}],
  crstand: [135, 153, 10, {state: 'crstand', action: false}],
  crwalk: [154, 159, 7, {state: 'crstand', action: false}],
  crattack: [160, 168, 10, {state: 'crstand', action: true}],
  crpain: [196, 172, 7, {state: 'crstand', action: true}],
  crdeath: [173, 177, 5, {state: 'freeze', action: true}],
  death1: [178, 183, 7, {state: 'freeze', action: true}],
  death2: [184, 189, 7, {state: 'freeze', action: true}],
  death3: [190, 197, 7, {state: 'freeze', action: true}],
  boom: [198, 198, 5]};


/**
 * The player direction
 * @type {number}
 */
var direction = 0;


function move() {

  if (player.model.motion !== 'run' && player.model.state === 'stand')
    changeMotion('run');

  else if (player.model.motion !== 'crwalk' && player.model.state === 'crstand')
    changeMotion('crwalk');

  var speed = moveState.speed;

  if (player.model.state === 'crstand') speed *= .5;
  else if (player.model.state === 'freeze') speed = 0;

  direction = moveState.angle;

  if (moveState.front) {
    if (moveState.left) direction = 45;
    else if (moveState.right) direction = 315;
    else direction = 0;
  }
  else if (moveState.Backwards) {
    if (moveState.left) direction = 135;
    else if (moveState.right) direction = 225;
    else direction = 180;
  }
  else {
    if (moveState.left) direction = 90;
    else if (moveState.right) direction = 270;
    else direction = 0;
  }

  direction += player.camera.x / 2;

  player.model.objects.rotation.y = direction * deg2rad;
  player.position.x -= Math.sin(direction * deg2rad) * speed;
  player.position.z -= Math.cos(direction * deg2rad) * speed;
}


/**
 * @param {string} motion The new player motion.
 */
function changeMotion(motion) {
  player.model.motion = motion;
  player.model.state = md2frames[motion][3].state;

  var animMin = md2frames[motion][0];
  var animMax = md2frames[motion][1];
  var animFps = md2frames[motion][2];

  md2meshBody.time = 0;
  md2meshBody.duration = 1000 * ((animMax - animMin) / animFps);
  md2meshBody.setFrameRange(animMin, animMax);
}


/**
 * Animate the world by updating position and speed for all objects created.
 */
function animate() {
  requestAnimationFrame(animate);

  player.model.objects.position = { x: player.position.x,
                                    y: player.position.y,
                                    z: player.position.z};

  // Update the physical shape's position
  // @TODO
  if (player.physicalShape) {
    player.physicalShape.position.x = player.position.x;
    player.physicalShape.position.y = player.position.y +
                                      player.modelHeight / 2;
    player.physicalShape.position.z = player.position.z;
  }

  // Camera x-rotation (up-down)
  camera.position.x = player.position.x + player.camera.distance *
                      Math.sin(player.camera.x * deg2rad / 2);

  camera.position.z = player.position.z + player.camera.distance *
                      Math.cos(player.camera.x * deg2rad / 2);

  // Camera y-rotation (left-right)
  camera.position.y = 1 + player.position.y + player.camera.distance *
                      Math.sin(player.camera.y * deg2rad / 2);

  camera.lookAt(new THREE.Vector3(player.position.x,
                                  player.position.y + 1,
                                  player.position.z));

  // Model animation
  var delta = clock.getDelta();

  if (md2meshBody) {

    var isEndFleame =
        (md2frames[player.model.motion][1] === md2meshBody.currentKeyframe);

    var isAction = md2frames[player.model.motion][3].action;

    if (!isAction || (isAction && !isEndFleame))
      md2meshBody.updateAnimation(1000 * delta);

    else if (/freeze/.test(md2frames[player.model.motion][3].state)) {
      // If player is dead...
    }
    else changeMotion(player.model.state);
  }

  renderer.render(scene, camera);

  scene.simulate();
}


/**
 * Function called when the player's shape collide another object
 * @param {Object} collided The collided object pointer.
 * @param {THREE.Vector3} velocity The relative velocity of both objects.
 * @param {THREE.Vector3} momentum The relative angular momentum.
 */
function playerCollision(collided, velocity, momentum) {
  console.log(velocity);
  // @TODO
  // player.physicalShape
}


/**
 * As god the First Day, create the sky and the earth
 */
function loadSkyAndGround() {
  // Create the blue sky
  scene.fog = new THREE.FogExp2(0x9999ff, 0.01);
  var ambientLight = new THREE.AmbientLight(0x202020);
  scene.add(ambientLight);

  // Create the ground (grass field)
  createSimpleObject(
      {shape: 'plane', size: [1000, 1000], m: 0, texture: 'images/grass.png'});

  // Create sunlight
  var sunlight = new THREE.DirectionalLight(0xfffffa, 1.5);
  sunlight.position.set(1, 50, 1).normalize();
  sunlight.castShadow = true;
  scene.add(sunlight);
}


/**
 * Create a animated droid-like player model
 */
function loadPlayerMesh() {

  droidMaterial = new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture('images/1.png'),
    ambient: 0x999999,
    color: 0xffffff,
    specular: 0xffffff,
    shininess: 25,
    morphTargets: true});

  loader = new THREE.JSONLoader();

  loader.load('js/droid.js', function(geometry) {
    md2meshBody = new THREE.MorphAnimMesh(geometry, droidMaterial);
    md2meshBody.rotation.y = -Math.PI / 2;
    md2meshBody.scale.set(.02, .02, .02);
    md2meshBody.position.y = .5;
    md2meshBody.castShadow = true;
    md2meshBody.receiveShadow = true;
    changeMotion('stand');
    player.model.objects.add(md2meshBody);
  });

  // Now that we have the droid model, we have to bind it to a physical shape
  // in order to manage collision and jumps, for example.
  // The shape is simply a cylinder
  player.physicalShape = new Physijs.BoxMesh(
      new THREE.CylinderGeometry(player.modelRadius,
                                 player.modelRadius,
                                 player.modelHeight,
                                 16, 4, false),
      new THREE.MeshLambertMaterial({opacity: 0.3, transparent: true}),
      1); // Mass

  player.physicalShape.position.y = player.modelHeight / 2;

  player.physicalShape.addEventListener('collision', playerCollision);

  // Insert the player
  scene.add(player.model.objects);
  scene.add(player.physicalShape);
}


/**
 * Create some cubes to test world basic physics
 */
function createCubes() {
  var meshArray = [];

  for (var i = 0; i < 5; i++) {

    meshArray[i] = new Physijs.BoxMesh(new THREE.CubeGeometry(1 + Math.random(),
                                                              Math.random(), 1),
                                       new THREE.MeshLambertMaterial({
                                         color: 0xffffff * Math.random()}));

    meshArray[i].position.x = i % 2 * 5 - 2.5;
    meshArray[i].position.y = 10 * Math.random();
    meshArray[i].position.z = -0.8 * i;

    meshArray[i].rotation.x = Math.random();
    meshArray[i].rotation.y = Math.random();
    meshArray[i].rotation.z = Math.random();

    meshArray[i].castShadow = true;
    meshArray[i].receiveShadow = true;
    scene.add(meshArray[i]);
  }
}


/**
 * Check whether an object is an Array or not
 * @param {?} a The object to check.
 * @return {boolean}
 */
function isArray(a) {
  return (a instanceof Array);
}


/**
 * @param {Array.<Object>} objs List of objects to be created.
 */
function createSimpleObjects(objs) {
  for (var i = 0, j = objs.length; i < j; i++) createSimpleObject(objs[i]);
}


/**
 * @param {Object} params Object's parameters.
 */
function createSimpleObject(params) {

  var pos = isArray(params.pos) ? params.pos : [0, 0, 0];
  var rot = isArray(params.rot) ? params.rot : [0, 0, 0];

  if (!params.color) params.color = 0xffffff;

  var materParams = {color: params.color};

  if (!params.shape) params.shape = 'cube';

  if (params.shape == 'cube') {
    var size = isArray(params.size) ? params.size : [1, 1, 1];
    var shape = new THREE.CubeGeometry(size[0], size[1], size[2]);
  }
  else if (params.shape == 'cylinder') {
    var size = isArray(params.size) ? params.size : [0.5, 0.5, 1];
    var shape = new THREE.CylinderGeometry(
        size[0], // Bottom radius
        size[1], // Up radius
        size[2], // Height
        Math.ceil(Math.max(size[0], size[1]) * 8), // Radial fragments number
        Math.ceil(size[2] * 2), // Axial fragments number
        false // False means that the cylendre ends are closed.
        );
  }
  else if (params.shape == 'plane') {
    var size = isArray(params.size) ? params.size : [1, 1];
    var shape = new THREE.PlaneGeometry(size[0], size[1]);

    if (params.texture) {
      materParams.map = THREE.ImageUtils.loadTexture(params.texture);
      materParams.map.repeat.set(size[0], size[1]);
      materParams.map.wrapS = materParams.map.wrapT = THREE.RepeatWrapping;
    }
  }

  var mater = Physijs.createMaterial(
      new THREE.MeshLambertMaterial(materParams),
      params.friction, params.spring);

  var simpleObject = new Physijs.BoxMesh(shape, mater, params.m);
  simpleObject.castShadow = true;
  simpleObject.receiveShadow = true;
  simpleObject.position.set(pos[0], pos[1], pos[2]);
  simpleObject.rotation.set(rot[0], rot[1], rot[2]);
  scene.add(simpleObject);
}


/**
 * Create the river (log) of this world
 * TODO
 */
function createRiverSpring() {


  var spring = new Physijs.BoxMesh(
      new THREE.CylinderGeometry(5, 5, 0.2, 32, 2, true),
      new THREE.MeshLambertMaterial({color: 0xaa0000}));

  spring.position.x = 10;
  spring.position.y = .1;
  spring.position.z = -10;

  scene.add(spring);
}


/**
 * Test to load a un-animated model
 */
function createTree() {

  var treeMaterial = new THREE.MeshLambertMaterial({
    ambient: 0x999999,
    color: 0x00ff00,
    specular: 0xffffff,
    shininess: 25,
    morphTargets: true});

  loader = new THREE.JSONLoader();

  loader.load('js/tree.js', function(geometry) {
    treeBody = new THREE.Mesh(geometry, treeMaterial);
    // treeBody.rotation.y = -Math.PI / 2;
    // treeBody.scale.set(.02, .02, .02);
    treeBody.position.x = 4;
    treeBody.position.y = 4;
    treeBody.position.z = 2;
    treeBody.castShadow = true;
    treeBody.receiveShadow = true;
  });


  scene.add(treeBody);
}


/**
 * Create the basic road system on the map
 */
function createRoads() {

  createRoad({x: 0, z: 500}, {x: 0, z: -500});
  createRoad({x: 0, z: -20}, {x: 100, z: -120});
  createRoad({x: 0, z: -20}, {x: -100, z: -120});
  createRoad({x: 0, z: 20}, {x: 100, z: 120});
  createRoad({x: 0, z: 20}, {x: -100, z: 120});
  createRoad({x: 500, z: 0}, {x: -500, z: 0});
  createRoad({x: -20, z: 0}, {x: -120, z: -100});
  createRoad({x: -20, z: 0}, {x: -120, z: 100});
  createRoad({x: 20, z: 0}, {x: 120, z: 100});
  createRoad({x: 20, z: 0}, {x: 120, z: -100});
}


/**
 * Create a road on the floor between two points.
 * @param {{x: number, z:number}} a Road start XZ-coordinates.
 * @param {{x: number, z:number}} b Road end XZ-coordinates.
 */
function createRoad(a, b) {
  createSimpleObject({shape: 'plane',
    // Road length is the sqare root of (x2 - x1)^2 + (z2 - z1)^2
    size: [Math.sqrt((b.x - a.x) * (b.x - a.x) +
                     (b.z - a.z) * (b.z - a.z)), 2],
    // X and Z coordinates of the road are simply the middle between start
    // and end points. The Y coordinate is randomly chosen between 1 and 2
    // millimeters, to prevent display glitch.
    pos: [(b.x + a.x) / 2, (1 + Math.random()) / 1000, (b.z + a.z) / 2],
    rot: [0, - Math.atan((b.z - a.z) / (b.x - a.x)), 0],
    m: 0, // The road have no mass
    texture: 'images/pave.jpg'});
}


/**
 * Load objects contained in the world
 */
function loadStuff() {
  loadSkyAndGround();
  createCubes();
  loadPlayerMesh();
  createRoads();
  createRiverSpring();
  createTree();
}
