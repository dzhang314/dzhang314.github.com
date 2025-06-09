import { isNumericArray } from "./IsNumericArray.js";


export function calculateCoulombEnergy(points) {

    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }

    let energy = 0.0;
    for (let i = 0; i < points.length; i += 3) {
        const xi = points[i];
        const yi = points[i + 1];
        const zi = points[i + 2];
        for (let j = i + 3; j < points.length; j += 3) {
            const xj = points[j];
            const yj = points[j + 1];
            const zj = points[j + 2];
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const distSq = dx * dx + dy * dy + dz * dz;
            energy += 1.0 / Math.sqrt(distSq);
        }
    }
    return energy;
}


export function calculateCoulombForces(forces, points) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }
    if (forces.length !== points.length) {
        throw new RangeError("forces and points must have the same length");
    }

    for (let i = 0; i < points.length; i += 3) {
        let fx = 0.0;
        let fy = 0.0;
        let fz = 0.0;
        const xi = points[i];
        const yi = points[i + 1];
        const zi = points[i + 2];
        for (let j = 0; j < points.length; j += 3) {
            if (i === j) {
                continue;
            }
            const xj = points[j];
            const yj = points[j + 1];
            const zj = points[j + 2];
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const distSq = dx * dx + dy * dy + dz * dz;
            const invDistCb = 1.0 / (distSq * Math.sqrt(distSq));
            fx += invDistCb * dx;
            fy += invDistCb * dy;
            fz += invDistCb * dz;
        }
        forces[i] = fx;
        forces[i + 1] = fy;
        forces[i + 2] = fz;
    }
}


export function constrainForces(forces, points) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (!isNumericArray(points)) {
        throw new TypeError("points must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }
    if (points.length % 3 !== 0) {
        throw new RangeError("points must have length divisible by 3");
    }
    if (forces.length !== points.length) {
        throw new RangeError("forces and points must have the same length");
    }

    for (let i = 0; i < forces.length; i += 3) {
        const fx = forces[i];
        const fy = forces[i + 1];
        const fz = forces[i + 2];
        const px = points[i];
        const py = points[i + 1];
        const pz = points[i + 2];
        const overlap = fx * px + fy * py + fz * pz;
        forces[i] = fx - overlap * px;
        forces[i + 1] = fy - overlap * py;
        forces[i + 2] = fz - overlap * pz;
    }
}


export function calculateRmsForce(forces) {

    if (!isNumericArray(forces)) {
        throw new TypeError("forces must be an array of finite numbers");
    }
    if (forces.length % 3 !== 0) {
        throw new RangeError("forces must have length divisible by 3");
    }

    let sumForceSq = 0.0;
    for (let i = 0; i < forces.length; i++) {
        sumForceSq += forces[i] * forces[i];
    }
    return Math.sqrt(sumForceSq / (forces.length / 3.0));
}
