			if ( ! Detector.webgl ) {

				Detector.addGetWebGLMessage();
				document.getElementById( 'container' ).innerHTML = "";

			}

			var container, stats;

			var camera, controls, scene, renderer;

			var mesh, texture;
			//for collision detection.
			var plane, planeGroup;
			var raycaster = new THREE.Raycaster();

			var worldWidth = 812, worldDepth = 812,		//modified to 812 instead of 512. I think it looks good still.
			worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

			var clock = new THREE.Clock();
			//attempt to add plane model for nose cone.
			// prepare loader and load the model
			this.loadModel(function(obj){
				plane = obj;
				init();
				animate();
			});

			function init() {

				container = document.getElementById( 'container' );

				camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 5000 );

				//controls = new THREE.FirstPersonFlightControls( camera );
				//controls.lookSpeed = 0.1;
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

				var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
				directionalLight.position.set( 0, 1, 0 );
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
				//texture = new THREE.Texture( generateTexture( data, worldWidth, worldDepth ), THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping );
				//texture.needsUpdate = true;

				//Attempt to add rock texture to the terrain.
				texture = THREE.ImageUtils.loadTexture( 'resources/rock4.jpg');
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

				container.appendChild( renderer.domElement );

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
        var cubemap = THREE.ImageUtils.loadTextureCube(urls);

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
					plane.rotation.x += 5; //causes you to flip around when you fly through things
					plane.position.z = -20
					planeGroup.position.z -= 20;
					controls.velocity = new THREE.Vector3(0,0,0);
					//camera.rotation.y = 180; //makes you turn around and fly the other way.
					//controls.velocity.z = controls.velocity.z * -1; //causes you to fly backwards when you hit things.
// feeble attempt to display a "game over" screen by drawing a box in front of the camera with a plane exploding image as a texture.
				var img = document.createElement('img');
	 		  img.src = 'resources/Plane_Crash.png';
				document.replase
				img.wrapS = img.wrapT = THREE.RepeatWrapping;
				// img.repeat.set(6,6);
				var m = THREE.Mesh(new THREE.PlaneGeometry(100,100,1,1), img);
				camera.add(m);
				m.position.z = -10;
				// var cube = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 200), img);

				  //    cube.overdraw = true;
				   //   camera.add(cube);
					//cube.position = new THREE.Vector3(0,0,0);

				}


			}
