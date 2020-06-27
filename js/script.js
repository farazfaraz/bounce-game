var ballSpeed=70;//For controlling the speed of the ball
// Lives
var lives = 3;//The times you can play

// Scores
var score = 0;//The total score you got step by step
var gameState;//The state of the game,when you are initializing, when you are setup, when you go in the next state because you winn the current state and when you are playing

// Box2DWeb Dynamics
var box2DVec2         = Box2D.Common.Math.b2Vec2;
var box2DWorld        = Box2D.Dynamics.b2World;
var box2DBodyDef      = Box2D.Dynamics.b2BodyDef;
var box2DBody         = Box2D.Dynamics.b2Body;
var box2DFixtureDef   = Box2D.Dynamics.b2FixtureDef;
var box2DPolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var box2DCircleShape  = Box2D.Collision.Shapes.b2CircleShape;

// Box2D world variables
var newWorld         = undefined;//when you want to invisible an object you use undefined property
var newBall          = undefined;

function createDynamicWorld() {
    // Create the world object.
    newWorld = new box2DWorld(new box2DVec2(0, 0), true);

    // Create the ball.
    var newBodyDefinition = new box2DBodyDef();
    newBodyDefinition.type = box2DBody.b2_dynamicBody;
    newBodyDefinition.position.Set(1, 1);
    newBall = newWorld.CreateBody(newBodyDefinition);
    var newFixtureDefinition = new box2DFixtureDef();
    newFixtureDefinition.density = 1.0;
    newFixtureDefinition.friction = 0.0;
    newFixtureDefinition.restitution = 0.25;
    newFixtureDefinition.shape = new box2DCircleShape(ballRadius);
    newBall.CreateFixture(newFixtureDefinition);

    // Create the maze.
    newBodyDefinition.type = box2DBody.b2_staticBody;
    newFixtureDefinition.shape = new box2DPolygonShape();
    newFixtureDefinition.shape.SetAsBox(0.5, 0.5);
    for (var i = 0; i < maze.dimension; i++) {
        for (var j = 0; j < maze.dimension; j++) {
            if (maze[i][j]) {
                newBodyDefinition.position.x = i;
                newBodyDefinition.position.y = j;
                newWorld.CreateBody(newBodyDefinition).CreateFixture(newFixtureDefinition);
            }
        }
    }

}

var ballTexture    = THREE.ImageUtils.loadTexture('./img/ball1.jpeg');
var obstacleTexture= THREE.ImageUtils.loadTexture('./img/obstacle1.jpeg');
var planeTexture   = THREE.ImageUtils.loadTexture('./img/wall2.jpeg');
var meshTexture   = THREE.ImageUtils.loadTexture('./img/wall1.jpeg');//generate a maze texture
var pilletTexture   = THREE.ImageUtils.loadTexture('./img/pillet.jpg');
var exitTexture    = THREE.ImageUtils.loadTexture('./img/exit1.png');

function generate_maze_mesh(field) {//In order to generate a maze
    var emptyGeometry = new THREE.Geometry();
    for (var i = 0; i < field.dimension; i++) {
        for (var j = 0; j < field.dimension; j++) {
            if (field[i][j]) {
                var cubeGeometry = new THREE.CubeGeometry(1,1,1,1,1,1);
                var cubeMesh_ij = new THREE.Mesh(cubeGeometry);
                cubeMesh_ij.position.z = 0.5;
                cubeMesh_ij.position.y = j;
                cubeMesh_ij.position.x = i;
                THREE.GeometryUtils.merge(emptyGeometry, cubeMesh_ij);
            }
        }
    }
    var material = new THREE.MeshPhongMaterial({map: meshTexture});
    var mesh = new THREE.Mesh(emptyGeometry, material)
    return mesh;
}

var camera;
var scene;
var renderer;
var light;

// Model Mesh Declarations
var maze;
var mazeMesh;
var mazeDimension  = 11;//By changing this parameter I can change the level of the game and I have done by an slider
var planeMesh;
var ballMesh;

// Model Radius Desclaration
var obstacleRadius = 0.25;
var pilletRadius = 0.25;
var ballRadius     = 0.11;
var exitRadius     = 0.4;//When the ball go near to the exit cube it colors goes to change

var animationAxis        = [0, 0];
var obstacleLocation = undefined;
var pilletLocation = undefined;
var obstacleMovementLimit = undefined;
var flag;
var exit_angle = 0;
var exit_opacity = 1;



function createSceneRenderWorld() {
    scene = new THREE.Scene();// Create the scene object.
    // Add the light.
    light= new THREE.PointLight(0xcffafa, 1);
    light.position.set(1, 1, 1.3);
    scene.add(light);
    // Add the Ball Mesh.
    g = new THREE.SphereGeometry(ballRadius, 32, 16);
    m = new THREE.MeshPhongMaterial({map:ballTexture});
    ballMesh = new THREE.Mesh(g, m);
    ballMesh.position.set(1, 1, ballRadius);
    scene.add(ballMesh);
    // Add the Obstacle Mesh
    addObstacle();
    obstacleTranslation();
    flag = Array(obstacleLocation.length/2)
    for(i=0;i<flag.length;i++)
      flag[i]=true


    //Addition of Pillet Mesh
    var level = Math.floor((mazeDimension-1)/2 - 4);
    if(level%2==0)
        addPillets(level/2);
    else
        pilletLocation=undefined;

    //Adding the Exit Mesh
    exitGeometry = new THREE.CubeGeometry(0.6,0.5,0.7,0,0,1);
    exitMeshPhong = new THREE.MeshBasicMaterial({map:exitTexture});
    exitMesh = new THREE.Mesh(exitGeometry,exitMeshPhong);
    exitMesh.position.set(mazeDimension,mazeDimension-2,exitRadius);
    exitMesh.rotation.set(Math.PI/2, 0, 0);
    scene.add(exitMesh)

    // Adding the Camera.
    var aspect = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
    camera.position.set(1, 1, 5);
    scene.add(camera);

    // Adding the Maze Mesh.
    mazeMesh = generate_maze_mesh(maze);
    scene.add(mazeMesh);

    // Adding the Plane Mesh.
    g = new THREE.PlaneGeometry(mazeDimension*10, mazeDimension*10, mazeDimension, mazeDimension);
    planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
    planeTexture.repeat.set(mazeDimension*5, mazeDimension*5);
    m = new THREE.MeshPhongMaterial({map:planeTexture});
    planeMesh = new THREE.Mesh(g, m);
    planeMesh.position.set((mazeDimension-1)/2, (mazeDimension-1)/2, 0);
    planeMesh.rotation.set(Math.PI/2, 0, 0);
    scene.add(planeMesh);

}
function updateDynamicWorld() {
    document.getElementById("ballSpeedControl").onchange = function() {//For controlling ball speed
        ballSpeed = event.srcElement.value;
        document.getElementById("txtBallSpeed").value=ballSpeed;
    };
        document.getElementById("levelChange").onchange = function() {//For changing the level of game
            mazeDimension = event.srcElement.value;
            initializeGame();
    };    
    // Applying Friction to the ball
    var velocity = newBall.GetLinearVelocity();
    velocity.Multiply(0.95);
    newBall.SetLinearVelocity(velocity);

    // Applying Force to the ball controlled by User
    var force = new box2DVec2(animationAxis[0]*newBall.GetMass()*0.25, animationAxis[1]*newBall.GetMass()*0.25);
    newBall.ApplyImpulse(force, newBall.GetPosition());
    animationAxis = [0,0];

    // Taking a time step.
    newWorld.Step(1/ballSpeed, 8, 3);
    animatingObstacle()
}
function updateSceneRenderWorld() {
    // Updating Ball position.
    var xIncrement = newBall.GetPosition().x - ballMesh.position.x;
    var yIncrement = newBall.GetPosition().y - ballMesh.position.y;

    ballMesh.position.x += xIncrement;
    ballMesh.position.y += yIncrement;
    actualBallPosX = Math.round(ballMesh.position.x*100)/100
    actualBallPosY = Math.round(ballMesh.position.y*100)/100

    // Updating Lives and Score
    checkBallCollisionWithObjects(actualBallPosX,actualBallPosY);

    /*if(name1!="" && name2!="" && lives==0){
        if(score1>score2){
            alert("player1 is winer");
        }else if(score1<score2){
            alert("Player2 is winer");
        }else{alert("The scores are equal");}
    }*/

    if (lives == 0) {
        $('#gameover').show()
        $('#try').show()
        $('#panelControl').hide();
        $('#help').hide();
        $('#level').hide();
        $('#lives').hide();
        $('#score').hide();
        $('#totalscore').html('Total Score: ' + score).show();
        $('html, body').css({
            overflow: 'hidden',
            height: '100%',
        });
        scene.remove(planeMesh);
        scene.remove(light);
        scene.remove(ballMesh);
        scene.remove(exitMesh);
        scene.remove(mazeMesh);
        scene.remove(camera);
    }

    // Updating Ball rotation.
    var tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(0,1,0), xIncrement/ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    tempMat = new THREE.Matrix4();
    tempMat.makeRotationAxis(new THREE.Vector3(1,0,0), -yIncrement/ballRadius);
    tempMat.multiplySelf(ballMesh.matrix);
    ballMesh.matrix = tempMat;
    ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix);

    // Updating Camera Position and Light Position.
    camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
    camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
    camera.position.z += (5 - camera.position.z) * 0.1;
    light.position.x = camera.position.x;
    light.position.y = camera.position.y;
    light.position.z = camera.position.z - 3.7;
}

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

function onMoveKey(axis) {
    animationAxis = axis.slice(0);
}

jQuery.fn.centerv = function () {
    wh = window.innerHeight;
    h = this.outerHeight();
    this.css("position", "absolute");
    this.css("top", Math.max(0, (wh - h)/2) + "px");
    return this;
}

jQuery.fn.centerh = function () {
    ww = window.innerWidth;
    w = this.outerWidth();
    this.css("position", "absolute");
    this.css("left", Math.max(0, (ww - w)/2) + "px");
    return this;
}

jQuery.fn.center = function () {
    this.centerv();
    this.centerh();
    return this;
}

function initializeGame(){
    maze = createMaze(mazeDimension);
    maze[mazeDimension-1][mazeDimension-2] = false;
    createDynamicWorld();
    createSceneRenderWorld();
    camera.position.set(1, 1, 5);
    light.position.set(1, 1, 1.3);
    light.intensity = 0;
    var level = Math.floor((mazeDimension-1)/2 - 4);
    $('#level').html('Level: ' + level);
    $('#score').html('Score: ' + score);
    $('#lives').html('Lives: ' + lives);
    gameState = 'setup';
}

function setupGameScene(){
    light.intensity += 0.1 * (1.0 - light.intensity);
    renderer.render(scene, camera);
    if (Math.abs(light.intensity - 1.0) < 0.05) {
        light.intensity = 1.0;
        gameState = 'play'
    }
}

function playGame(){
    updateDynamicWorld();
    updateSceneRenderWorld();
    renderer.render(scene, camera);

    var mazeX = Math.floor(ballMesh.position.x + 0.5);
    var mazeY = Math.floor(ballMesh.position.y + 0.5);
    if (mazeX == mazeDimension && mazeY == mazeDimension - 2) {
        mazeDimension += 2;
        score = score + 16;
        $('#bravoUps').show();
        document.getElementById("bravoUps").innerHTML="Bravoooo";//When you get more 2 scores because of high speed
        if(ballSpeed<15){
            score=score+2;
            $('#ballSpeed15').show();//For showing this message :You got 2 more scores because of your speed
        }else{
            $('#ballSpeed15').hide(); //For hiding this message :You got 2 more scores because of your speed
        }
        gameState = 'next';
    }
}

function nextGameLevel(){
    scene.remove(exitMesh)

    updateDynamicWorld();
    updateSceneRenderWorld();
    light.intensity += 0.07 * (0.0 - light.intensity);
    renderer.render(scene, camera);
    if (Math.abs(light.intensity - 0.0) < 0.1) {
        light.intensity = 0.0;
        renderer.render(scene, camera);
        gameState = 'initialize'
    }
}

// Game state animation
function gameAnimation() {

    if (gameState == "initialize"){
        initializeGame();
    }
    else if (gameState == "setup"){
        setupGameScene();
    }
    else if (gameState == "play"){
        playGame();
    }
    else if (gameState == "next"){
        nextGameLevel()
    }
    requestAnimationFrame(gameAnimation);
}

$(document).ready(function() {

    // Create the renderer.
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Bind keyboard and resize events.
    KeyboardJS.bind.axis('left', 'right', 'down', 'up', onMoveKey);
    //MouseEvent.bind.axis('left', 'right', 'down', 'up', onMoveKey);
    $(window).resize(onResize);

    $('#try').click(function(){
        location.reload();
    })

    // Set the initial state of the game
    document.getElementById("startPlayer1").onclick = function() {//For controlling ball speed
        //gameState = 'initialize';
        $('#hidden').show();
    };
    document.getElementById("startPlayer2").onclick = function() {//For controlling ball speed
        //gameState = 'initialize';
        $('#hidden').show();
    };
    document.getElementById("continue").onclick = function() {//For controlling ball speed
        var name1=document.getElementById("txtPlayer1").value;
        var name2=document.getElementById("txtPlayer2").value;
        if(name1==""){
            alert("Please input your names");
        }else{
            $('#showName').show();
            document.getElementById("showName").innerHTML="Good luck "+name1;
            gameState = 'initialize';
            //initializeGame();
            //if (lives==0) var score1=score;
            //initializeGame();
            //if (lives==0) var score2=score;
            //if(score1>score2) alert("player1 is winer");
            //else if(score1<score2) alert("player2 is winer");
            //else alert("The scores are equal");
        }
    };
    //gameState = 'initialize';

    // Start game Animation.
    requestAnimationFrame(gameAnimation);
})


//Intigrating all codes of obstacle collision,pillet picking and exit fading
function checkBallCollisionWithObjects(actualBallPosX,actualBallPosY){
    collision_flag = checkCollisionWithObstacle(actualBallPosX,actualBallPosY)
    if (collision_flag){
        lives = lives - 1;
        if (score >= 10){
            score = score - 5;
        }
        $('#bravoUps').show();   
        document.getElementById("bravoUps").innerHTML="Ups! Try again"; //When you loose the scores 
        $('#ballSpeed15').hide();//For hiding this message :You got 2 more scores because of your speed

        createDynamicWorld();
        createSceneRenderWorld();

        $('#lives').html('Lives: ' + lives);
        $('#score').html('Score: ' + score);
    }
    var level = Math.floor((mazeDimension-1)/2 - 4);
    //If you delete this block the ball can go everywhere, for example it can passes into the wall
    if(pilletLocation!=undefined){
        pilletPicked = pickingPilletByBall(actualBallPosX,actualBallPosY)
        if(pilletPicked!=-1 && pilletLocation.length>-1){
            var object = scene.getChildByName("pilletMesh"+pilletPicked);
            scene.remove(object);
            pilletLocation[pilletPicked]=-1
            pilletLocation[pilletPicked+1]=-1
            score = score + 8
            $('#score').html('Score: ' + score);
            document.getElementById("bravoUps").innerHTML="You got 8 scores because of Pillet";//When you get 8 scores because of pillet
        }
    }

    if((actualBallPosX>(mazeDimension-1.5) && (actualBallPosX < mazeDimension) )){
        exitMesh.material.opacity = exit_opacity;
        if(exit_opacity>0.2)
            exit_opacity-=0.01
    }
    else{
          exit_opacity=1
          exitMesh.material.opacity = exit_opacity;
    }
    exit_angle += 0.05
    exitMesh.rotation.set(exit_angle,0,0)
}

//Adding Obstacle to the scene
function addObstacle(){
    var totalObstacles = (Math.floor((mazeDimension-1)/2 - 4))+1;
    obstacleLocation = Array(totalObstacles*2);
    var obstLoci=0;
    while(obstLoci<(totalObstacles*2)){
        x = Math.floor(Math.random() * (mazeDimension - 1)) + 0;
        y = Math.floor(Math.random() * (mazeDimension - 1)) + 0;

        for(i=0;i<obstacleLocation.length;i++)
        {
            if((x==obstacleLocation[i] && y==obstacleLocation[i+1]) || (x==1 && y==1))
            {
                x = Math.floor(Math.random() * (+mazeDimension - 1)) + 0;
                y = Math.floor(Math.random() * (+mazeDimension - 1)) + 0;
            }

        }

        if(!maze[x][y]){
            obstacleLocation[obstLoci]=x;
            obstacleLocation[obstLoci+1]=y;
            obstLoci+=2;
        }
    }

    for( var j=0;j<(totalObstacles*2);j+=2){
        var obstacleg1 = new THREE.CubeGeometry(0.5,0.5,0.5,1,1,1);
        var obstaclem1 = new THREE.MeshPhongMaterial({map:obstacleTexture});
        obstacleMesh = new THREE.Mesh(obstacleg1, obstaclem1);
        obstacleMesh.position.set(obstacleLocation[j],obstacleLocation[j+1], obstacleRadius);
        obstacleMesh.name = "obstacleMesh"+(j+1);
        scene.add(obstacleMesh);
    }

}

// Adding of pillets to scene
function addPillets(totalPillet){
    pilletLocation = Array(totalPillet*2);
    var pilletLoci = 0;
    while(pilletLoci<(totalPillet*2)){
        x = Math.floor(Math.random() * (mazeDimension-1));
        y = Math.floor(Math.random() * (mazeDimension-1));


        if(pilletLocation.indexOf(x)>-1)
            if(y==pilletLocation[pilletLocation.indexOf(x)+1])
            {
                x = Math.floor(Math.random() * (mazeDimension-1));
                y = Math.floor(Math.random() * (mazeDimension-1));
            }
        if((obstacleLocation.indexOf(x)>-1 && y==obstacleLocation[obstacleLocation.indexOf(x)]) || (x==1 && y==1))
            {
                x = Math.floor(Math.random() * (mazeDimension-1));
                y = Math.floor(Math.random() * (mazeDimension-1));
            }


        if(!maze[x][y]){
            pilletLocation[pilletLoci] = x;
            pilletLocation[pilletLoci+1] = y;
            pilletLoci += 2;
        }
        else
        {
            x = Math.floor(Math.random() * (mazeDimension-1));
            y = Math.floor(Math.random() * (mazeDimension-1));
        if(!maze[x][y]){
            pilletLocation[pilletLoci] = x;
            pilletLocation[pilletLoci+1] = y;
            pilletLoci += 2;
        }

        }
    }

    for(var j=0; j<(totalPillet*2); j+=2){
        var pilletGeometry = new THREE.TorusKnotGeometry(0.08,0.05);
        var pilletMeshPhong = new THREE.MeshPhongMaterial({map:pilletTexture,});
        pilletMesh = new THREE.Mesh(pilletGeometry, pilletMeshPhong);
        pilletMesh.position.set(pilletLocation[j],pilletLocation[j+1], pilletRadius);
        pilletMesh.name = "pilletMesh"+j;
        scene.add(pilletMesh);
    }

}


function hierarchicalTank(j,flag)
{
    var carWidth = 0.1;
    var carHeight = 0.12;
    var carLength = 0.4;

    var wheelRadius = 0.06;
    var wheelThickness = 0.062;
    var wheelSegments = 4;

    var domeRadius = 0.1;
    var domeWidthSubdivisions = 8;
    var domeHeightSubdivisions = 8;
    var domePhiStart = 0;
    var domePhiEnd = Math.PI * 2;
    var domeThetaStart = 0;
    var domeThetaEnd = Math.PI * .5;

    var turretWidth = .0125;
    var turretHeight = .0125;
    var turretLength = carLength * .75 * .2;

    var tank = new THREE.Object3D();
    tank.name="obstacleMesh"+(j)


    scene.add(tank);

    var bodyGeometry = new THREE.CubeGeometry(carWidth, carHeight, carLength);
    var bodyMaterial = new THREE.MeshPhongMaterial({color: 0xF733BB});
    var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    if (flag)
    {
        console.log("FInally Rotatting")
        bodyMesh.rotation.y = Math.PI;
        bodyMesh.rotation.x = Math.PI *.5;
    }
    else
    {
         bodyMesh.rotation.y = Math.PI * .5;
         bodyMesh.rotation.x = Math.PI * .5;

    }

    bodyMesh.position.set(obstacleLocation[j],obstacleLocation[j+1], obstacleRadius);
    bodyMesh.name = "bodyMesh";
    bodyMesh.castShadow = true;
    tank.add(bodyMesh);

    var wheelGeometry = new THREE.CylinderGeometry(
        wheelRadius,     // top radius
        wheelRadius,     // bottom radius
        wheelThickness,  // height of cylinder
        wheelSegments);
    var wheelMaterial = new THREE.MeshPhongMaterial({color: 0x0311BB});
    var wheelPositions = [
      [-(carWidth/2)  - (wheelThickness-0.02) , -carHeight ,  carLength/2-0.1 ],
      [ (carWidth/2)  + wheelThickness - 0.02 , -carHeight ,  carLength/2-0.1 ],
      [-(carWidth/2)  - wheelThickness + 0.02 , -carHeight , 0],
      [ (carWidth/2)  + wheelThickness  - 0.02, -carHeight , 0],
      [-(carWidth/2)  - wheelThickness + 0.02 , -carHeight , -carLength/2+0.1 ],
      [ (carWidth/2)  + wheelThickness - 0.02 , -carHeight , -carLength/2+0.1 ],
    ];
    count=0
    var wheelMeshes = wheelPositions.map((position) => {
      var mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
      mesh.position.set(...position);
      mesh.rotation.z = Math.PI * .5;
      mesh.castShadow = true;
      mesh.name="wheel"+count
      count+=1
      bodyMesh.add(mesh);
      return mesh;
    });


    var domeGeometry = new THREE.SphereGeometry(
      domeRadius, domeWidthSubdivisions, domeHeightSubdivisions,
      domePhiStart, domePhiEnd, domeThetaStart, domeThetaEnd);
    var domeMesh = new THREE.Mesh(domeGeometry, bodyMaterial);
    domeMesh.castShadow = true;
    bodyMesh.add(domeMesh);
    domeMesh.position.y = 0.05;

    var turretGeometry = new THREE.CubeGeometry(
        turretWidth, turretHeight, turretLength);
    var turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
    var turretPivot = new THREE.Object3D();
    turretMesh.castShadow = true;
    turretPivot.scale.set(4,4,4);
    turretPivot.position.y = .05;
    turretMesh.position.z = turretLength * .6;
    turretPivot.name="turretPivot"
    turretMesh.name="turretMesh"
    turretPivot.add(turretMesh);
    bodyMesh.add(turretPivot);

}



//Collision Detection of Ball with Obstacle
function checkCollisionWithObstacle(ball_Pos_X,ball_Pos_Y){
    if (obstacleLocation.length<=0)
        return false;

    for( i = 0;i<obstacleLocation.length;i+=2)
    {
        if((ball_Pos_X<=(obstacleLocation[i]+0.3) && ball_Pos_X>=(obstacleLocation[i]-0.3)   )
            &&
             (ball_Pos_Y<=(obstacleLocation[i+1]+0.3) && ball_Pos_Y>=(obstacleLocation[i+1]-0.3)))
            return true
    }
    return false;
}

//Picking of Pillet from scene
function pickingPilletByBall(ball_Pos_X,ball_Pos_Y){
    if(pilletLocation.length<=0)
        return false;

    for(i=0;i<pilletLocation.length;i+=2)
    {
        if((ball_Pos_X<=(pilletLocation[i]+0.3) && ball_Pos_X>=(pilletLocation[i]-0.3)   )
            &&
             (ball_Pos_Y<=(pilletLocation[i+1]+0.3) && ball_Pos_Y>=(pilletLocation[i+1]-0.3)))
           return i;
    }
    return -1;
}


function obstacleTranslation(){

    var flag=false;

    obstacleMovementLimitX_X = new Array(obstacleLocation.length)
    obstacleMovementLimitY_X = new Array(obstacleLocation.length);
    obstacleMovementLimitX_Y = new Array(obstacleLocation.length);
    obstacleMovementLimitY_Y = new Array(obstacleLocation.length);
    for (i=0;i<obstacleLocation.length;i+=2)
    {
        for (j=obstacleLocation[i];j<mazeDimension-1;j++)
           {
               if(maze[j][obstacleLocation[i+1]])
                break;
           }
        obstacleMovementLimitX_X[i] = j;
        obstacleMovementLimitY_X[i] = obstacleLocation[i+1];
        for( j=obstacleLocation[i];j>0;j--)
        {
            if(maze[j][obstacleLocation[i+1]])
                break;
        }
        obstacleMovementLimitX_X[i+1]=j;
        obstacleMovementLimitY_X[i+1]=obstacleLocation[i+1];
        if(obstacleMovementLimitX_X[i]-obstacleMovementLimitX_X[i+1]<=2)
            {
            // console.log("INside Rotation")
            hierarchicalTank(i,true)
                    }
        else
            hierarchicalTank(i,false)
            }

    for (i=0;i<obstacleLocation.length;i+=2)
    {
        for (j=obstacleLocation[i];j<mazeDimension-1;j++)
           {
               if(maze[obstacleLocation[i]][j])
                break;
           }
        obstacleMovementLimitX_Y[i] = obstacleLocation[i];
        obstacleMovementLimitY_Y[i] = j;
        for( j=obstacleLocation[i];j>0;j--)
        {
            if(maze[obstacleLocation[i]][j])
                break;
        }
        obstacleMovementLimitX_Y[i+1] = obstacleLocation[i];
        obstacleMovementLimitY_Y[i+1] = j;
    }
    for (k=0;k<obstacleLocation.length;k+=2){
        var curve = new THREE.SplineCurve( [
            new THREE.Vector2( obstacleMovementLimitX_X[k]-0.75, obstacleLocation[k+1]-0.4 ),
            new THREE.Vector2( obstacleMovementLimitX_X[k+1]+0.85, obstacleLocation[k+1]-0.4),
            new THREE.Vector2( obstacleMovementLimitX_X[k+1]+0.85, obstacleLocation[k+1]+0.4),
            new THREE.Vector2( obstacleMovementLimitX_X[k]-0.75,  obstacleLocation[k+1]+0.4),
            new THREE.Vector2( obstacleMovementLimitX_X[k]-0.75, obstacleLocation[k+1]-0.4 )

        ] );
        var points = curve.getPoints( 30 );
        var geometry = new THREE.Geometry();
        for(i =0; i < points.length;i++){
            geometry.vertices.push(new THREE.Vector3(points[i].x,points[i].y,0));
        }
        var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        var splineObject = new THREE.Line( geometry, material );
    }
}
function animatingObstacle(){

    var obstacleObject;
    var level = Math.floor((mazeDimension-1)/2 - 4);
    obstacleMovememtValue = 0.01+(level*0.01)

    for (i=0;i<obstacleLocation.length;i+=2)
    {
        obstacleObject = scene.getChildByName("obstacleMesh"+(i))
        animatingTurret(obstacleObject)
        rotateWheel(obstacleObject.getChildByName("bodyMesh"))
        current_x_position = obstacleLocation[i];
        //console.log(i,obstacleMovementLimitX_X[i]-obstacleMovementLimitX_X[i+1])
        if((obstacleMovementLimitX_X[i]-obstacleMovementLimitX_X[i+1])>2)
        {
            if(flag[i] && (current_x_position <= obstacleMovementLimitX_X[i]-0.75))
            {
                obstacleObject.translateX(obstacleMovememtValue)
                current_x_position += obstacleMovememtValue
                obstacleLocation[i] = current_x_position

            }
            else
            {
                if(current_x_position>= obstacleMovementLimitX_X[i+1]+0.75)
                {
                    obstacleObject.translateX(-obstacleMovememtValue)
                    current_x_position -=obstacleMovememtValue
                    obstacleLocation[i] = current_x_position
                    flag[i]=false
                }
                else if( current_x_position < obstacleMovementLimitX_X[i+1]+0.75)
                    flag[i]=true


            }
        }
        else
        {
            current_x_position = obstacleLocation[i+1];

             if(flag[i] && (current_x_position <= obstacleMovementLimitY_Y[i]-0.75))
            {
                obstacleObject.translateY(obstacleMovememtValue)
                current_x_position += obstacleMovememtValue
                obstacleLocation[i+1] = current_x_position

            }
            else
            {
                if(current_x_position>= obstacleMovementLimitY_Y[i+1]+0.75)
                {
                    obstacleObject.translateY(-obstacleMovememtValue)
                    current_x_position -=obstacleMovememtValue
                    obstacleLocation[i+1] = current_x_position
                    flag[i]=false
                }
                else if( current_x_position < obstacleMovementLimitY_Y[i+1]+0.75)
                    flag[i]=true


            }

        }
    }
}
function animatingTurret(obstacleObjectMesh)
{
  bodyObject = obstacleObjectMesh.getChildByName("bodyMesh")
    turretPivot = bodyObject.getChildByName("turretPivot")

    prev_rot = turretPivot.rotation.y
    prev_rot+=0.09
    turretPivot.rotation.y=prev_rot
    return;
}



function rotateWheel(bodyObject)
{

    for(s=0;s<6;s++)
    {

        wheelObject = bodyObject.getChildByName("wheel"+s)
        last_rot = wheelObject.rotation.x
        last_rot+=0.08
        if (last_rot>15)
            last_rot=0
        wheelObject.rotation.x=last_rot;
        }
    return;
}