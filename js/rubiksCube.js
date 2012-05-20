/**
 * @date 20120519
 * @author flyhuang
 * @desc 基于threejs 实现的魔方object
 */
(function(w){

	//魔方六面的颜色
	//普通情况下：红对橙 黄对白  绿对蓝
	//红 0xFF0033
	//蓝 0x000CC
	//橙 0xFF6600
	//黄 0xFFFF33
	//绿 0x00CC33
	//白 0xFFFFFF
	var cubicColors = {
		'x+' : 0xFF0033,
		'x-' : 0xFF6600,
		'y+' : 0xFFFF33,
		'y-' : 0xFFFFF,
		'z+' : 0x00CC33,
		'z-' : 0x000CC
	}

	var rotateColors = {
		'x+' : {
			'y+' : 'z+',
			'y-' : 'z-',
			'z+' : 'y-',
			'z-' : 'y+',
			'x+' : 'x+',
			'x-' : 'x-'
		},
		'x-' : {
			'y+' : 'z-',
			'y-' : 'z+',
			'z+' : 'y+',
			'z-' : 'y-',
			'x+' : 'x+',
			'x-' : 'x-'
		},
		'y+' : {
			'x+' : 'z-',
			'x-' : 'z+',
			'z+' : 'x+',
			'z-' : 'x-',
			'y+' : 'y+',
			'y-' : 'y-'
		},
		'y-' : {
			'x+' : 'z+',
			'x-' : 'z-',
			'z+' : 'x-',
			'z-' : 'x+',
			'y+' : 'y+',
			'y-' : 'y-'
		},
		'z+' : {
			'x+' : 'y+',
			'x-' : 'y-',
			'y+' : 'x-',
			'y-' : 'x+',
			'z+' : 'z+',
			'z-' : 'z-'
		},
		'z-' : {
			'x+' : 'y-',
			'x-' : 'y+',
			'y+' : 'x+',
			'y-' : 'x-',
			'z+' : 'z+',
			'z-' : 'z-'
		}
	}

	var debug = true;

	var log = function(str){
		window.console && debug && window.console.log(str);
	}

	/**
	 * [0,1,2] * [[],[],[]]
	 */
	var ApplyMatris = function(vector , matris){
		
		var result = [];

		for(var i = 0 ; i < vector.length; i++) {
			var temp = 0;
			for(var j = 0; j < vector.length; j++) {
				temp+= vector[j] * matris[j][i];
			}
			result[i] = temp;
		}

		return result;
	}

	var RotateX = function(vector , angle){

		var matris = [[1 , 0 , 0],
					  [0, Math.cos(angle) ,-Math.sin(angle)],
					  [0, Math.sin(angle) , Math.cos(angle)]];

		var v = [vector.x , vector.y , vector.z];
		var pos = ApplyMatris(v , matris);

		return {
			x : pos[0], 
			y : pos[1], 
			z : pos[2] 
		};
	}

	var RotateY = function(vector , angle){

		var matris = [[Math.cos(angle) , 0 , Math.sin(angle)],
					  [0, 1 , 0],
					  [-Math.sin(angle), 0 , Math.cos(angle)]];

		var v = [vector.x , vector.y , vector.z];
		var pos = ApplyMatris(v , matris);
		
		return {
			x : pos[0], 
			y : pos[1], 
			z : pos[2] 
		};

	}

	var RotateZ = function(vector , angle){

		var matris = [[Math.cos(angle) ,  -Math.sin(angle) , 0],
					  [Math.sin(angle), Math.cos(angle) , 0],
					  [0, 0 , 1]];

		var v = [vector.x , vector.y , vector.z];
		var pos = ApplyMatris(v , matris);

		return {
			x : pos[0], 
			y : pos[1], 
			z : pos[2] 
		};
	}

	var Animate = function(options){
		this.opts = {
			time    : options.time , 
			from    : options.from , 
			to      : options.to ,  
			process : options.process 
		}
		this.intervel = 25;
		this.times = Math.floor(this.opts.time / this.intervel);
		this.step = 0;
		this.diff = (this.opts.to - this.opts.from) / this.times;
	}

	Animate.prototype.start = function(callback){
		var self = this;
		if(this.step >= this.times) {
			callback && callback();
		} else {
			setTimeout(function(){
				var value = self.opts.from + self.diff * (self.step + 1) ;
				self.opts.process(self.step++ , value , self.diff);
				self.start(callback);
			},this.opts.intervel);
		}
	}

	
	/**
	 * @param level 魔方的阶数
     * @param size  魔方每个小块的大小
	 * @param options 魔方的设置参数 
	 * @todo 支持魔方指定任意位置
	 */
	w.RubiksCubeObject = function(level , size , options){
		
		this.level = level || 3;
		this.size = size || 50;

		//三维数组
		this.cubes = [];

		this.opts = options || {};

		this._createCubes();
	}

	w.RubiksCubeObject.prototype._createMaterials = function(colors){
		var directions = ['x+','x-','y+','y-','z+','z-'];
		var materials = [];
		
		for(var i = 0 ; i < directions.length; i++) {
			var drection = directions[i];
			if(colors[drection]) {
				materials.push( new THREE.MeshBasicMaterial( { color:colors[drection] } ) );
			} else {
				materials.push( new THREE.MeshBasicMaterial( { color: 0xFFFFFF } ) );
			}
		}
		return materials;
	}

	w.RubiksCubeObject.prototype.addToScene = function(scene){
		for(var i = 0 , len = this.cubes.length; i < len; i++) {
			scene.add(this.cubes[i]);
		}

		this.scene = scene;
	}

	w.RubiksCubeObject.prototype._createCubes = function(){
		var cubes  = this.cubes = [] ; 
		var width = this.size;

		var halfWidth = width / 2;
		var level = this.level;	
		var halfIndex = Math.floor(this.level / 2);

		for(var gridx = -halfIndex; gridx <=halfIndex; gridx++) {		
			for(var gridy = -halfIndex; gridy <= halfIndex; gridy++) {
				for(var gridz = -halfIndex; gridz <= halfIndex; gridz++) {
					var marerials = this._createMaterials(cubicColors);

					//if(gridx == -1 && gridy == -1 && gridz == -1) {
						var cube = new THREE.Mesh( new THREE.CubeGeometry( width , width , width , 1, 1, 1, marerials ), new THREE.MeshFaceMaterial() );
						cube.position.y = gridy * width;
						cube.position.x = gridx * width;
						cube.position.z = gridz * width;
						
						/*
						cube.rotation['dx'] = 'x';
						cube.rotation['dy'] = 'y';
						cube.rotation['dz'] = 'z';
						*/
						cubes.push(cube);
					//}
				}
			}	
		}

		this.cubes = cubes;

		return this.cubes;
	}

	w.RubiksCubeObject.prototype._getXCubes = function(index){
		var level2 = this.level * this.level; 
		var offset = index * level2;
		var cubes = [];
		for(var i = offset , len = offset + level2; i < len; i++) {
			cubes.push(this.cubes[i]);
		}
		return cubes;
	}
	
	w.RubiksCubeObject.prototype._getYCubes = function(index){
		var level2 = this.level * this.level; 
		var cubes = [];
		for(var i = 0 ; i < this.level; i++) {
			var offset = i * level2 + index * this.level;
			for(var j =  offset; j < offset + this.level; j++) {
				cubes.push(this.cubes[j]);
			}
		}
		return cubes;
	}

	w.RubiksCubeObject.prototype._getZCubes = function(index){
		var offset = index * this.level * this.level;
		var cubes = [];

		for(var i = index , len = this.cubes.length; i < len; i+=this.level) {
			cubes.push(this.cubes[i]);
		}
		return cubes;
	}

	w.RubiksCubeObject.prototype._rotateSide = function(colors , dimension , direction){
		direction = direction==1 ? '+' : '-';
		var map = rotateColors[dimension + direction];
		var newColors = {};
		for(var key in map) {
			var from = key ;
			var to = map[key];
			newColors[from] = colors[to];
		}
		return newColors;
	}

	w.RubiksCubeObject.prototype._rotateCube = function(i, dimension , direction){

		var cube =  this.cubes[i];
		var width = this.size;
		
		var colors = cube.rubiksColors || cubicColors;
		var rotateColors = this._rotateSide(colors , dimension , direction);
		var marerials = this._createMaterials(rotateColors);

		var newCube = new THREE.Mesh( new THREE.CubeGeometry( width , width , width , 1, 1, 1, marerials ), new THREE.MeshFaceMaterial() );
		newCube.position.x = cube.position.x;
		newCube.position.y = cube.position.y;
		newCube.position.z = cube.position.z;


		newCube.rubiksColors = rotateColors;
		
		this.scene.remove(cube);
		this.scene.add(newCube);

		this.cubes[i] = newCube;
	}

	w.RubiksCubeObject.prototype._rotateRubiks = function(dimension , direction , index , animate){
		animate = typeof(animate) != 'undefined' ? animate : true;
		
		var cubes = this.cubes;
		var angle = direction * Math.PI / 2;
		var haflIndex = Math.floor(this.level/2);
		var posTarget = (index - haflIndex ) * this.size;
		var all = isNaN(index) ? true : false;
		var collectCubes = [];
		var self = this;

		for(var i = 0 ; i < cubes.length; i++) {
			var cube = cubes[i];
			var ontarget = Math.round(cube.position[dimension]) == posTarget;

			if(ontarget || all) {
				if(animate) {
					cube.oriposition = {
						x : cube.position.x, 
						y : cube.position.y, 
						z : cube.position.z
					}
					collectCubes.push(cube);
				} else {
					var pos ;		

					if(cube.oriposition) {
						cube.position.x = cube.oriposition.x;
						cube.position.y = cube.oriposition.y;
						cube.position.z = cube.oriposition.z;
					}
					switch(dimension){
						case 'x' : pos = RotateX(cube.position , angle);break;
						case 'y' : pos = RotateY(cube.position , angle);break;
						case 'z' : pos = RotateZ(cube.position , angle);break;
					}
					cube.position.x = pos.x;
					cube.position.y = pos.y;
					cube.position.z = pos.z;
					this._rotateCube(i , dimension , direction );
				}
			}
		}

		if(animate) {
			new Animate({
				time    : 1000 , 
				from    : 0, 
				to      : -angle,  
				process : function(time , value , diff){
					for(var i = 0 ; i < collectCubes.length; i++) {
						var cube = collectCubes[i];
						var pos;	
						switch(dimension){
							case 'x' : pos = RotateX(cube.position , -diff);break;
							case 'y' : pos = RotateY(cube.position , -diff);break;
							case 'z' : pos = RotateZ(cube.position , -diff);break;
						}
						cube.position.x = pos.x;
						cube.position.y = pos.y;
						cube.position.z = pos.z;
						cube.rotation[dimension] = value;
					}
				},
			}).start(function(){
				self._rotateRubiks(dimension , direction , index , false);
			});
		}
	}


	w.RubiksCubeObject.prototype.rotateX = function(direction , index , animate){
		this._rotateRubiks('x' , direction , index , animate);
	}

	w.RubiksCubeObject.prototype.rotateY = function(direction , index , animate){
		this._rotateRubiks('y' , direction , index , animate);
	}

	w.RubiksCubeObject.prototype.rotateZ = function(direction , index , animate){
		this._rotateRubiks('z' , direction , index , animate);
	}

	/**
	 * 将魔方某一个轴的其中一面绕该轴旋转
	 * @param dimension 方向轴 : x , y ,z
	 * @param direction 逆时针或者顺时针：1 -1 
	 * @param index 沿着该轴某一面的下标 ，非数字即表示旋转整个面
	 * @param animate 旋转时是否使用动画
	 */
	w.RubiksCubeObject.prototype.rotate = function(dimension  , direction , index , animate){
		if(dimension == 'x') {
			this.rotateX(direction , index , animate);
		} else if(dimension == 'y') {
			this.rotateY(direction , index , animate);
		} else if(dimension == 'z') {
			this.rotateZ(direction , index , animate);
		}
	}



})(window.THREE);