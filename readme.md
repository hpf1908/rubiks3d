rubiksCube : 学习 three.js 实现的一个在线魔方

```js
/**
 * @param level 魔方的阶数
 * @param size  魔方每个小块的大小
 * @param options 魔方的设置参数 
 * @todo 支持魔方指定任意位置
 */
var rubiksCube = new THREE.RubiksCubeObject(level , size);
rubiksCube.addToScene(scene);

/**
 * 将魔方某一个轴的其中一面绕该轴旋转
 * @param dimension 方向轴 : x , y ,z
 * @param direction 逆时针或者顺时针：1 -1 
 * @param index 沿着该轴某一面的下标 ，非数字即表示旋转整个面
 * @param animate 旋转时是否使用动画
 */
rubiksCube.rotate('x' , 1 , 0 , true );
```