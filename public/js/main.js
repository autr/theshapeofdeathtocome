

var shuffled = [];
var shuffledIndex = 780;


while (shuffled.length < websites.length) {
  var randIndex = parseInt((Math.random() * websites.length), 10);
  if (shuffled.indexOf(randIndex) === -1) {
    shuffled.push(randIndex);
  }
}


var scene, camera, renderer, light, gui, clock, spotlightGui, lightHelper, torch, source, dest, floor, sampler, solution, godCamera, godControls, graves, models, areaSize, manager, sprite, w, h;
var projector, mouse = { x: 0, y: 0 }, INTERSECTED, vector, ray;


var shadow = 1;
var blockColour = 0x999999;
var floorColour = 0xaaaaaa;
var ambientColour = 0xaaaaaa;
var dummy, dummyCtx



function guiChange() {
  scene.fog.density = gui.fogDensity;
  godCamera.left = gui.l;
  godCamera.right = gui.r;
  godCamera.top = gui.t;
  godCamera.bottom = gui.b;
  godCamera.position.x = gui.x;
  godCamera.position.y = gui.y;
  godCamera.position.z = gui.z;
  godCamera.lookAt( scene.position );
  godCamera.updateProjectionMatrix();
}

function de2ra(degree) { return degree*(Math.PI/180); } 

function spotlightChange() {
  light.intensity = spotlightGui.intensity;
  light.distance = spotlightGui.distance;
  light.angle = spotlightGui.angle;
  light.penumbra = spotlightGui.penumbra;
  light.decay = spotlightGui.decay;
  light.position.x = spotlightGui.x;
  light.position.y = spotlightGui.y;
  light.position.z = spotlightGui.z;
  //lightHelper.update();
}

function init() {

  w = window.innerWidth, h = window.innerHeight;

  areaSize = 200;

  dummy = document.createElement('canvas');
  dummy.width  = 1;
  dummy.height = 1;
  dummyCtx = dummy.getContext("2d");


  // var progressBar = document.createElement('div');
  // progressBar.classList.add('progressBar');
  // document.body.appendChild(progressBar);
  manager = new THREE.LoadingManager();

  /////// CLOCK

  clock = new THREE.Clock();

  /////// GUI

  gui  = {
    fogDensity: 0.02,
    l: (areaSize*4) / - 2,
    r: (areaSize*4) / 2,
    t: (areaSize*4) / 2,
    b: (areaSize*4) / - 2,
    x: 0,
    y: 8,
    z: 8,
  };

  spotlightGui = {
    intensity: 3,
    distance: 200,
    angle: 1,
    penumbra: 1,
    decay: 0,
    x: 0,
    y: 0,
    z: 0,
  };

  var datGui = new dat.GUI();
  var lightDist = 100.0;


  datGui.add( gui, "fogDensity", 0, 0.1 ).onChange( guiChange );
  datGui.add( gui, "l").onChange( guiChange );
  datGui.add( gui, "r").onChange( guiChange );
  datGui.add( gui, "t").onChange( guiChange );
  datGui.add( gui, "b").onChange( guiChange );
  datGui.add( gui, "x", -100, 100).onChange( guiChange );
  datGui.add( gui, "y", -100, 100).onChange( guiChange );
  datGui.add( gui, "z", -100, 100).onChange( guiChange );

  datGui.add( spotlightGui, "intensity", 0, 3 ).onChange( spotlightChange );
  datGui.add( spotlightGui, "distance", 0, 200 ).onChange( spotlightChange );
  datGui.add( spotlightGui, "angle", 0, 10 ).onChange( spotlightChange );
  datGui.add( spotlightGui, "penumbra", 0, 1 ).onChange( spotlightChange );
  datGui.add( spotlightGui, "decay", 0, 2 ).onChange( spotlightChange );
  datGui.add( spotlightGui, "x", -lightDist, lightDist ).onChange( spotlightChange );
  datGui.add( spotlightGui, "z", -lightDist, lightDist ).onChange( spotlightChange );
  datGui.add( spotlightGui, "y", -lightDist, lightDist ).onChange( spotlightChange );

  datGui.close();
  dat.GUI.toggleHide();

  /////// SCENE

  scene = new THREE.Scene();

  window.addEventListener('resize', function() {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
  

  scene.fog = new THREE.FogExp2( 0xffffff, gui.fogDensity );

  //////// RENDERER
  var canvas = $('canvas.3d');
  renderer = new THREE.WebGLRenderer({antialias:true, canvas: canvas[0]});
  renderer.setSize(w, h);
  if (shadow) renderer.shadowMap.enabled = true;
  if (shadow) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  document.body.appendChild(renderer.domElement);


  //////// LIGHT

  renderer.setClearColor(new THREE.Color(255, 255,255), 1);

  light = new THREE.SpotLight(0xffffff);
  if (shadow) light.castShadow = true;
  light.shadowDarkness = 0.05;
  light.position.set(spotlightGui.x,spotlightGui.y,spotlightGui.z);
  light.shadow.mapSize.width = 1024 * 1;
  light.shadow.mapSize.height = 1024 * 1;
  light.position.x = 0;
  light.position.y = 0;
  light.position.z = 0;
  //scene.add(light);

  var ambient = new THREE.AmbientLight( ambientColour );
  scene.add(ambient);




  ///////// OBJECTS



  sampler = new PoissonDiskSampler(areaSize - 10, areaSize - 10, 20, 30 );
  solution = sampler.sampleUntilSolution();


  // for ( var i = 0; i < solution.length; i ++ ) {

  ////// STONE

  graves = [];
  models = [];

  var count = 0;

  function nextTombstone() {

    var x = solution[count].x - (areaSize/2);
    var z = solution[count].y - (areaSize/2);

    var grave = new Grave();

    function completeGrave(grave) {

      count += 1;
      $('.loading').text("loading initial " + count + "/"+ solution.length);
      if (count < solution.length) nextTombstone();
    }

    grave.init(x, z).then(completeGrave, completeGrave);

    graves.push(grave);
    models.push(grave.model);

    
  }

  nextTombstone();






  ////////// FLOOR

  floor = new THREE.Mesh( 
    new THREE.BoxGeometry( areaSize * 2, areaSize * 2, 1, 1 ), 
    new THREE.MeshPhongMaterial( { color: floorColour } ));
  floor.material.side = THREE.DoubleSide;
  floor.rotation.x = de2ra(90);
  floor.position.y = 0;
  if (shadow) floor.receiveShadow = true;
  scene.add( floor );


  /////// CAMERA



  source = new THREE.Mesh(new THREE.BoxGeometry( 2, 2, 2), new THREE.MeshPhongMaterial( { 
      color: 0x00ffff,
  } ) );
  source.position.x = 0;
  source.position.y = 20;
  source.position.z = 20;

  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 20000);
  camera.position.y = 3;
  // camera.rotation.x += 90;
  scene.add(camera);
  camera.add(source);
  source.add(light);
  light.target = camera;


  godCamera = new THREE.OrthographicCamera(gui.l, gui.r , gui.t , gui.b , -2000, 2000 );
  godCamera.position.x = gui.x;
  godCamera.position.y = gui.y;
  godCamera.position.z = gui.z;
  godCamera.lookAt( scene.position );
  scene.add(godCamera);

  //////// CONTROLS



  controls = new THREE.FirstPersonControls( camera , renderer.domElement);
  controls.activeLook = true;
  controls.autoForward =  false;
  controls.lookVertical = false;
  controls.lookHorizontal = true;
  controls.disabled = true;
  // controls.constrainVertical = true;
  // controls.verticalMin = 0.8;
  // controls.verticalMax = 2.2;






  /////// MOUSE


  projector = new THREE.Projector();
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  // document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  // document.addEventListener( 'touchstart', onDocumentMouseDown, false );

  //////// RAYS


  vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  vector.unproject(camera );
  ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );


  //////// Update TWEENS

    requestAnimationFrame(animate);

    function animate(time) {
        requestAnimationFrame(animate);
        TWEEN.update(time);
    }


}

function onDocumentMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

var closeup = false;

function onDocumentMouseDown( event ) {
  if ((!closeup)&&(INTERSECTED !== null)) {

    window.clicked = INTERSECTED;

    if (!INTERSECTED.beingViewed) {

      controls.autoForward = false;
      INTERSECTED.beingViewed = true;

      var position = INTERSECTED.position;
      var line = new THREE.Line3(INTERSECTED.position, camera.position);

      var destination = line.at(THREE.Math.mapLinear(6, 0, line.distance(), 0, 1));
      destination = INTERSECTED.position;

      var destinationX = (destination.x > camera.position.x) ? destination.x - 4 : destination.z + x;

      var tweenPosition = new TWEEN.Tween(camera.position)
        .to({
          x: destinationX,
          z: destination.z,
        }, THREE.Math.mapLinear(line.distance(), 0, 40, 0, 3000))
        .onUpdate(function() {
          //camera.lookAt(destination);
        })
        .onComplete(function() {
        })
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .start();

    } else {

      controls.autoForward = true;
      INTERSECTED.beingViewed = false;
    }

  }
}
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};
function animate() {

  //camera.position.y = 0;


  for ( var i = 0; i < graves.length - 1; i ++ ) {
    var grave = graves[i];
    var model = grave.model;
    var graveZ = model.position.z;
    var cameraZ = camera.position.z;
    var graveX = model.position.x;
    var cameraX = camera.position.x;
    var updateTexture = false;
    if ((graveZ - cameraZ) > (areaSize/2)) { model.position.z -= areaSize; updateTexture = true; }
    if ((graveZ - cameraZ) < ((areaSize/2)*-1)) { model.position.z += areaSize; updateTexture = true; }
    if ((graveX - cameraX) > (areaSize/2)) { model.position.x -= areaSize; updateTexture = true; }
    if ((graveX - cameraX) < ((areaSize/2)*-1)) { model.position.x += areaSize; updateTexture = true; }
    if (updateTexture) grave.texturise();
  }


  requestAnimationFrame(animate);

  ///// MOVE FLOOR

  floor.position.x = camera.position.x;
  floor.position.z = camera.position.z;

  if (typeof controls !== "undefined") {
    controls.update( clock.getDelta() );
  }

  if (typeof godControls !== "undefined") {
    godControls.update( clock.getDelta() );
  }



  vector.x = mouse.x;
  vector.y = mouse.y;
  vector.unproject( camera );
  ray.set( camera.position, vector.sub( camera.position ).normalize() );

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects(models);

  if ( intersects.length > 0 ) {
      // if the closest object intersected is not the currently stored intersection object
    if ( intersects[ 0 ].object != INTERSECTED )  {
      INTERSECTED = intersects[0].object;
      renderer.domElement.style.cursor = "pointer";
    }
  } else  {
    if ( INTERSECTED )  {
        renderer.domElement.style.cursor = "auto";
    }
    INTERSECTED = null;
  }

  renderer.clear();
  renderer.autoClear = false;
  renderer.setViewport( window.innerWidth/2, 0, window.innerWidth/2, window.innerHeight );
  renderer.setScissor( window.innerWidth/2, 0, window.innerWidth/2, window.innerHeight );
  renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
  renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
  renderer.setScissorTest( true );
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);





}

var startPause = true;
function showCurtain() {

      $('.wrapper').fadeIn(1000);
      $('.curtain').fadeIn(1000);
      $('.ui').fadeIn(1000);
      controls.disabled = true;
}

function hideCurtain() {

    $('.wrapper').fadeOut(1000);
    $('.curtain').fadeOut(1000);
    controls.disabled = false;
}

window.onload = function () { 

  init();
  animate(); 


  window.addEventListener( 'keydown', function(e) {
    console.log(e.keyCode);
    if ((e.keyCode === 69)||(e.keyCode === 13)) {
      console.log('Press');
      if (startPause) hideCurtain();
      if (!startPause) { showCurtain(); $('.text').addClass('visible'); }
      startPause = !startPause;
    }
  }, false );

  $('.show-text').click(function(e) {

      startPause = false;
      if (!startPause) { showCurtain(); $('.text').addClass('visible'); }

      e.preventDefault();
  });


  $('.enter')[0].addEventListener('click', function(e) {
      startPause = true;
      if (startPause) hideCurtain();
  }, 4000);

};
  