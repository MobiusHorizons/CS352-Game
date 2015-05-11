			if ( ! Detector.webgl ) {

				Detector.addGetWebGLMessage();
				document.getElementById( 'container' ).innerHTML = "";

			}

			var container, stats;

			var camera, controls, scene, renderer;
			var mesh, texture;
			var gameOver = false;
			//for collision detection.
			var plane, planeGroup;

			var worldWidth = 812, worldDepth = 812,		//modified to 812 instead of 512. I think it looks good still.
			worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

			var clock;
			//attempt to add plane model for nose cone.
			// prepare loader and load the model
			this.loadModel(function(obj){
				plane = obj;
				init(function(){
					animate();
				});
			});

			function init(cb) {

				this.clock = new THREE.Clock();
				container = document.getElementById( 'container' );
				var ready = 0;

				var localCB = function(){
					console.log(ready);
					ready ++;
					if (ready == 2){
						container.appendChild( renderer.domElement );
						cb();
					}
				};

				camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );

				planeGroup = new THREE.Object3D();
				plane.rotation.set(.1,2.36,0);
				plane.position.set(0, -2 ,-7);
				planeGroup.add(plane);
				planeGroup.add(camera);

				controls = new THREE.FlyControls(camera, planeGroup);
				controls.movementSpeed 	= 100;
				controls.velocity 			= new THREE.Vector3(0,0,25);
				controls.rollSpeed 			=  0.7;
				controls.dragToLook 		= true;
				controls.invertControls = true;

				scene = new THREE.Scene();
				//scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0015 );
				scene.fog = new THREE.FogExp2(0x8888AA, 0.0015);

				//added directional light

				var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
				directionalLight.position.set( 0, 1000, 0 );
				scene.add( directionalLight );

				scene.add(planeGroup);

				data = generateHeight( worldWidth, worldDepth );

				planeGroup.position.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] * 10 + 500;
				var geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
				geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

				var vertices = geometry.attributes.position.array;


				for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

					vertices[ j + 1 ] = data[ i ] * 10;

				}

				Collision.init(vertices, 7500,7500, worldWidth, worldDepth);

				//Attempt to add rock texture to the terrain.
				texture = THREE.ImageUtils.loadTexture( 'resources/rock4.jpg', {}, localCB);
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(6,6);

				//Attempt to add rock texture to the terrain.
				//There are three pictures, they all look a little wierd, but maybe more interesting thaqn procedural color.
				//var Rocktexture = THREE.ImageUtils.loadTexture( "resources/rock3.jpg" );
				//Rocktexture.wrapS = THREE.ClampToEdgeWrapping;
				//Rocktexture.wrapT = THREE.ClampToEdgeWrapping;
				//Rocktexture.repeat.set( 2, 2 );



				mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: texture } ) );
				terrain = mesh;

				scene.add( mesh );

				renderer = new THREE.WebGLRenderer();
				renderer.setClearColor( 0x7799ff );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );

				container.innerHTML = "";



				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				container.appendChild( stats.domElement );


				//adding skybox code.


        // urls of the images,
        // one per half axis
        var urls = [
              'resources/pos-x.png',
              'resources/neg-x.png',
              'resources/pos-y.png',
              'resources/neg-y.png',
              'resources/pos-z.png',
              'resources/neg-z.png'
            ];

        // wrap it up into the object that we need
        var cubemap = THREE.ImageUtils.loadTextureCube(urls, {}, localCB);

        // set the format, likely RGB
        // unless you've gone crazy
        //cubemap.format = THREE.RGBFormat;

        // following code from https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_cubemap.html
        var shader = THREE.ShaderLib[ "cube" ];
        shader.uniforms[ "tCube" ].value = cubemap;

        var skyBoxMaterial = new THREE.ShaderMaterial( {

          fragmentShader: shader.fragmentShader,
          vertexShader: shader.vertexShader,
          uniforms: shader.uniforms,
          depthWrite: false,
		//added from example, makes walls show up.
		side: THREE.BackSide


        });

        var skybox = new THREE.Mesh( new THREE.BoxGeometry( 7500, 7500, 7500 ), skyBoxMaterial );
        skybox.flipSided = true;

	 scene.add(skybox);


				window.addEventListener( 'resize', onWindowResize, false );

			}



			function loadModel(cb){

				var oLoader = new THREE.OBJMTLLoader();
				oLoader.load('model/TY-444.obj', 'model/TY-444.mtl', function(object) {
						//object.rotation.x = 0.1;
						//object.rotation.y = 14.85;

						//for collision detection.
						plane = object;
						if (cb){
							cb(object);
						}
				});
			}

			function generateHeight( width, height ) {

				var size = width * height, data = new Uint8Array( size ),
				perlin = new ImprovedNoise(), quality = 1, z = Math.random() * 100;

				for ( var j = 0; j < 4; j ++ ) {

					for ( var i = 0; i < size; i ++ ) {

						var x = i % width, y = ~~ ( i / width );
						data[ i ] += Math.abs( perlin.noise( x / quality, y / quality, z ) * quality * 1.75 );

					}

					quality *= 5;

				}

				return data;

			}

			function generateTexture( data, width, height ) {

				var canvas, canvasScaled, context, image, imageData,
				level, diff, vector3, sun, shade;

				vector3 = new THREE.Vector3( 0, 0, 0 );

				sun = new THREE.Vector3( 1, 1, 1 );
				sun.normalize();

				canvas = document.createElement( 'canvas' );
				canvas.width = width;
				canvas.height = height;

				context = canvas.getContext( '2d' );
				context.fillStyle = '#000';
				context.fillRect( 0, 0, width, height );

				image = context.getImageData( 0, 0, canvas.width, canvas.height );
				imageData = image.data;

				for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

					vector3.x = data[ j - 2 ] - data[ j + 2 ];
					vector3.y = 2;
					vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
					vector3.normalize();

					shade = vector3.dot( sun );

					imageData[ i ] = ( 96 + shade * 128 ) * ( 0.5 + data[ j ] * 0.007 );
					imageData[ i + 1 ] = ( 32 + shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );
					imageData[ i + 2 ] = ( shade * 96 ) * ( 0.5 + data[ j ] * 0.007 );

				}

				context.putImageData( image, 0, 0 );

				// Scaled 4x

				canvasScaled = document.createElement( 'canvas' );
				canvasScaled.width = width * 4;
				canvasScaled.height = height * 4;

				context = canvasScaled.getContext( '2d' );
				context.scale( 4, 4 );
				context.drawImage( canvas, 0, 0 );

				image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
				imageData = image.data;

				for ( var i = 0, l = imageData.length; i < l; i += 4 ) {

					var v = ~~ ( Math.random() * 5 );

					imageData[ i ] += v;
					imageData[ i + 1 ] += v;
					imageData[ i + 2 ] += v;

				}

				context.putImageData( image, 0, 0 );

				return canvasScaled;

			}

			//

			function animate() {
				if (gameOver) return;
				requestAnimationFrame( animate );

				render();
				stats.update();

			}


			function render() {

				controls.update( clock.getDelta() );
				//attempt at collision detection!
				checkForCollision();
				renderer.render( scene, camera );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

				controls.handleResize();

			}

//attempt at collision detection!
			function checkForCollision(){

				if(Collision.collides(planeGroup.position)){
					//collision!!!
					//plane.rotation.x += 5; //causes you to flip around when you fly through things
					gameOver = true;
					var time = 0;
					var ms = 1000/60;
					var intervalID;
					var distance = 0;

					var animateGameOver = function(){
						//console.log(plane.position);
						if (distance > -20){
							var delta = (20.7 - distance)/2 * ms/1000;
							distance -= delta;
							plane.position.z = distance;
							//plane.translateZ(-1* delta);
							planeGroup.translateZ(delta);
							renderer.render(scene, camera);
						} else if(intervalID){
							clearInterval(intervalID);
							window.addEventListener('keydown', restart, false);
						}
					};

					intervalID = setInterval(animateGameOver, ms);

					document.getElementById("game-over").classList.remove('hidden');
					function restart(e){
						gameOver = false;
						document.getElementById("game-over").classList.add('hidden');
						e.target.removeEventListener('keydown', restart, false);
						window.location.reload();
					}
				}
			}
