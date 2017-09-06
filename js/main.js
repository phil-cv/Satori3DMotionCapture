var endpoint = "wss://p14gsqyb.api.satori.com";
var appkey = "deAb82463fD82665f0F79ecBAeBAC1C1";
var channelName = window.channelName || "3dremote"; 

var degtorad = Math.PI / 180;

/*********************************************************
 * Handle real-time communication with Satori
 *********************************************************/
function initSatori(){
    var client = new RTM(endpoint, appkey);
    client.on("enter-connected", function () {
        $(".connecting").hide();
    });
    client.on("leave-connected", function () {
        $(".connecting").show();
    });
    client.start();  

    //Listen for incoming messages
    var subscription = client.subscribe(channelName, RTM.SubscriptionMode.SIMPLE); 
    subscription.on("rtm/subscription/data", function(pdu) {
        pdu.body.messages.forEach(function(msg) {
            if (msg.alpha) setRotation(msg.alpha, msg.beta, msg.gamma);
            if (msg.zoom) zoom(msg.zoom);
            if (msg.model) setModel(msg.model);
        });
    });
}


/*********************************************************
 * All the 3D stuff below
 *********************************************************/

 //Set up 3D scene
var scene, camera, renderer, models = [], activeModel;
function init3d(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 10 );
    camera.position.set(0, 0, 4);
    camera.lookAt(scene.position);

    //Cube Model
    var geometry = new THREE.CubeGeometry(1, 1, 1);
    var mBlue = new THREE.MeshPhongMaterial( { color: 0x5096c5 });
    var mSatori = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( 'img/satorilogo.png' ) })
    var materialArray = [mBlue, mBlue, mBlue, mBlue, mSatori, mSatori];
    var material = new THREE.MeshFaceMaterial(materialArray);
    var cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);
    models["cube"] = cube;

    //Eiffel Tower Model
    var loader = new THREE.ObjectLoader();
    loader.load("models/eiffel.json",function ( model ) {
        model.scale.set(0.006, 0.006, 0.006);
        model.visible = false;
        model.position.set( 0, -.8, 0 );
        scene.add( model );
        models["eiffel"] = model;
    });

    setModel("cube");

    //Lights
    var light1 = new THREE.PointLight( 0xffffff, 1, 0 );
    var light2 = new THREE.PointLight( 0xffffff, 1, 0 );
    var light3 = new THREE.PointLight( 0xffffff, 1, 0 );
    light1.position.set( 0, 2000, 0 );
    light2.position.set( 1000, 2000, 100 );
    light3.position.set( -1000, -2000, -1000 );
    scene.add( light1 );
    scene.add( light2 );
    scene.add( light3 );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
}

//Resize/reposition the canvas when the window is resized
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//Render loop
function render() {
    requestAnimationFrame(render);
    renderer.render( scene, camera );
}

//Set object rotation based on the alpha/beta/gamma orientation of the phone
function setRotation(alpha, beta, gamma){
    if (alpha === null || beta === null || gamma === null) return;

    var a = alpha * degtorad;
    var b = beta * degtorad;
    var g = gamma * degtorad;

    var euler = new THREE.Euler();
    euler.set( b, a, - g, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us
    var quaternion = new THREE.Quaternion();
    quaternion.setFromEuler( euler );
    activeModel.setRotationFromQuaternion(quaternion);

    //Show debug info
    var angles = Math.floor(alpha) + ", " + Math.floor(beta) + ", " + Math.floor(gamma);
    $("#debug").html(angles);
}

//Handle zoom in/out
function zoom(delta){
    var newZoom = camera.position.z / (1+ delta);
    if (newZoom < 1) newZoom = 1;   //Set min and max limits
    if (newZoom > 80) newZoom = 80;
    camera.position.z = newZoom;
}

//Allow user to specify a different 3D model
function setModel(modelName){
    if (modelName){
        Object.keys(models).forEach(k => models[k].visible = false);
        activeModel = models[modelName];
        if (activeModel) activeModel.visible = true;
    }
}

//Redirect mobile devices to the remote
if (navigator.userAgent.match(/android|iphone|ipad/i)){
    window.location.replace("remote.html");
}else{
    initSatori()
    init3d();
    render();
    setRotation(10, 10, 0);
}
