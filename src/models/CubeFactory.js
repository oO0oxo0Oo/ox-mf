import { useCube as useCube3 } from './cube3.js';
import { useCube as useCube2 } from './cube2.js';

const createCubeFactory = () => {
  const cubeTypes = new Map();

  const register = (type, createCubeFn) => {
    cubeTypes.set(type, createCubeFn);
  }

  const createCube = (type, scene) => {
    const createCubeFn = cubeTypes.get(type);

    if (!createCubeFn) {
      return null;
    }

    return createCubeFn(scene);
  }

  const getAvailableTypes = () => {
    return Array.from(cubeTypes.keys());
  }

  // 注册魔方类型
  register('cube3', useCube3);
  register('cube2', useCube2);

  return {
    register,
    createCube,
    getAvailableTypes,
  }
}

export const cubeFactory = createCubeFactory();