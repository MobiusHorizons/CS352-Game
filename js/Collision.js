window.Collision = {};
Collision.init = function(vertices, pixWidth, pixHeight, width, height){
  this.vertices   = vertices;
  this.width      = width;
  this.height     = height;
  this.pixWidth   = pixWidth;
  this.pixHeight  = pixHeight;
  this.Xscale     = pixWidth  / (width  - 1);
  this.Yscale     = pixHeight / (height - 1);
}

Collision.collides = function(pos, radius){
  var h  = Collision.getHeight(pos);
  return (!h || h <= 0)
}
/*
  var clock = new THREE.Clock();
  for (var i = 0; i < this.dir.length; i++){
    console.log("start: i = "+i,clock.getDelta());
    this.caster.set(pos, this.dir[i]);
    var col = this.caster.intersectObject(terrain);
    console.log("end:", clock.getDelta())
    if (col.length > 0 && col[0].distance <= radius){
      return true;
    }
  }
  return false;
}
*/
Collision.getHeight = function(pos){
  //console.log(pos);
  var X = Math.floor((pos.x + this.pixWidth /2)/this.Xscale);
  var Z = Math.floor((pos.z + this.pixHeight/2)/this.Yscale);
  //console.log(X,Z);
  var Y = this.vertices[(this.width * Z + X) * 3 + 1]
  /*
  console.log("x: ", this.vertices[(this.width * Z + X) * 3    ]);
  console.log("y: ", this.vertices[(this.width * Z + X) * 3 + 1]);
  console.log("z: ", this.vertices[(this.width * Z + X) * 3 + 2]);
  */
  return(pos.y-Y);
}
