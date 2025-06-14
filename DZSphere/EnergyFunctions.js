/** @import { NumericArray } from "./InputValidation.js" */
import { assertNumericArray3D, assertSameLength } from "./InputValidation.js";


/**
 * Compute the Coulomb (electrostatic) energy of a configuration of unit point
 * charges in 3D Euclidean space. The energy is computed in natural units
 * where the Coulomb constant k = 1 / (4 * pi * epsilon_0) is set to 1.
 *
 * @param {NumericArray} points - The coordinates of the point charges in the
 * format [x_0, y_0, z_0, x_1, y_1, z_1, ...]. All point charges are assumed to
 * have unit charge (q = 1).
 *
 * @returns {number} The Coulomb (electrostatic) energy of the point charge
 * configuration in natural units.
 */
export function computeCoulombEnergy(points) {

    assertNumericArray3D(points);

    const numPoints = points.length / 3;
    let energy = 0.0;
    for (let i = 0; i < numPoints; i++) {
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        for (let j = i + 1; j < numPoints; j++) {
            const xj = points[3 * j + 0];
            const yj = points[3 * j + 1];
            const zj = points[3 * j + 2];
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            energy += 1.0 / Math.hypot(dx, dy, dz);
        }
    }
    return energy;
}


/**
 * Compute the Coulomb (electrostatic) forces on a configuration of unit point
 * charges in 3D Euclidean space. The forces are computed in natural units
 * where the Coulomb constant k = 1 / (4 * pi * epsilon_0) is set to 1.
 *
 * The computed forces are written to a preallocated output array.
 *
 * @param {NumericArray} forces - Preallocated output array to receive the
 * computed forces in the format [F0_x, F0_y, F0_z, F1_x, F1_y, F1_z, ...].
 *
 * @param {NumericArray} points - The coordinates of the point charges in the
 * format [x_0, y_0, z_0, x_1, y_1, z_1, ...]. All point charges are assumed to
 * have unit charge (q = 1).
 *
 * @returns {void}
 */
export function computeCoulombForces(forces, points) {

    assertNumericArray3D(forces);
    assertNumericArray3D(points);
    assertSameLength(forces, points);

    const numPoints = points.length / 3;
    for (let i = 0; i < numPoints; i++) {
        let fx = 0.0;
        let fy = 0.0;
        let fz = 0.0;
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        for (let j = 0; j < numPoints; j++) {
            if (i !== j) {
                const xj = points[3 * j + 0];
                const yj = points[3 * j + 1];
                const zj = points[3 * j + 2];
                const dx = xi - xj;
                const dy = yi - yj;
                const dz = zi - zj;
                const distSq = dx * dx + dy * dy + dz * dz;
                const invDistCb = 1.0 / (distSq * Math.sqrt(distSq));
                fx += invDistCb * dx;
                fy += invDistCb * dy;
                fz += invDistCb * dz;
            }
        }
        forces[3 * i + 0] = fx;
        forces[3 * i + 1] = fy;
        forces[3 * i + 2] = fz;
    }
}


/**
 * Compute a Hessian-vector product (HVP) of the Coulomb (electrostatic) energy
 * function evaluated at a given configuration of unit point charges in 3D
 * Euclidean space. The entries of the Hessian are computed in natural units
 * where the Coulomb constant k = 1 / (4 * pi * epsilon_0) is set to 1.
 *
 * The Hessian-vector product is written to a preallocated output array.
 *
 * @param {NumericArray} result - Preallocated output array to receive the
 * computed Hessian-vector product.
 *
 * @param {NumericArray} points - The coordinates of the point charges in the
 * format [x_0, y_0, z_0, x_1, y_1, z_1, ...]. All point charges are assumed to
 * have unit charge (q = 1).
 *
 * @param {NumericArray} vector - The vector to multiply the Hessian by.
 *
 * @returns {void}
 */
export function computeCoulombHVP(result, points, vector) {

    assertNumericArray3D(result);
    assertNumericArray3D(points);
    assertNumericArray3D(vector);
    assertSameLength(result, points);
    assertSameLength(result, vector);

    const numPoints = points.length / 3;
    for (let i = 0; i < numPoints; i++) {
        let rx = 0.0;
        let ry = 0.0;
        let rz = 0.0;
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        const ui = vector[3 * i + 0];
        const vi = vector[3 * i + 1];
        const wi = vector[3 * i + 2];
        for (let j = 0; j < numPoints; j++) {
            if (i !== j) {
                const xj = points[3 * j + 0];
                const yj = points[3 * j + 1];
                const zj = points[3 * j + 2];
                const uj = vector[3 * j + 0];
                const vj = vector[3 * j + 1];
                const wj = vector[3 * j + 2];
                const dx = xi - xj;
                const dy = yi - yj;
                const dz = zi - zj;
                const du = ui - uj;
                const dv = vi - vj;
                const dw = wi - wj;
                const overlap = dx * du + dy * dv + dz * dw;
                const distSq = dx * dx + dy * dy + dz * dz;
                const dist = Math.sqrt(distSq);
                const distCb = distSq * dist;
                const alpha = -1.0 / distCb;
                const beta = (overlap + overlap + overlap) / (distSq * distCb);
                rx += alpha * du + beta * dx;
                ry += alpha * dv + beta * dy;
                rz += alpha * dw + beta * dz;
            }
        }
        result[3 * i + 0] = rx;
        result[3 * i + 1] = ry;
        result[3 * i + 2] = rz;
    }
}


/**
 * @param {(distSq: number) => number} radialEnergyFunction
 * @param {NumericArray} points
 */
export function computePairwiseRadialEnergy(radialEnergyFunction, points) {

    assertNumericArray3D(points);

    const numPoints = points.length / 3;
    let energy = 0.0;
    for (let i = 0; i < numPoints; i++) {
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        for (let j = i + 1; j < numPoints; j++) {
            const xj = points[3 * j + 0];
            const yj = points[3 * j + 1];
            const zj = points[3 * j + 2];
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const distSq = dx * dx + dy * dy + dz * dz;
            energy += radialEnergyFunction(distSq);
        }
    }
    return energy;

}


/**
 * @param {NumericArray} forces
 * @param {(distSq: number) => number} radialEnergyDerivative
 * @param {NumericArray} points
 */
export function computePairwiseRadialForces(
    forces,
    radialEnergyDerivative,
    points,
) {

    assertNumericArray3D(forces);
    assertNumericArray3D(points);
    assertSameLength(forces, points);

    const numPoints = points.length / 3;
    for (let i = 0; i < numPoints; i++) {
        let fx = 0.0;
        let fy = 0.0;
        let fz = 0.0;
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        for (let j = 0; j < numPoints; j++) {
            if (i !== j) {
                const xj = points[3 * j + 0];
                const yj = points[3 * j + 1];
                const zj = points[3 * j + 2];
                const dx = xi - xj;
                const dy = yi - yj;
                const dz = zi - zj;
                const distSq = dx * dx + dy * dy + dz * dz;
                const firstDerivative = radialEnergyDerivative(distSq);
                const forceStrength = firstDerivative + firstDerivative;
                fx -= forceStrength * dx;
                fy -= forceStrength * dy;
                fz -= forceStrength * dz;
            }
        }
        forces[3 * i + 0] = fx;
        forces[3 * i + 1] = fy;
        forces[3 * i + 2] = fz;
    }
}


/**
 * @param {NumericArray} result
 * @param {(distSq: number) => number} radialEnergyDerivative
 * @param {(distSq: number) => number} radialEnergySecondDerivative
 * @param {NumericArray} points
 * @param {NumericArray} vector
 */
export function computePairwiseRadialHVP(
    result,
    radialEnergyDerivative,
    radialEnergySecondDerivative,
    points,
    vector,
) {

    assertNumericArray3D(result);
    assertNumericArray3D(points);
    assertNumericArray3D(vector);
    assertSameLength(result, points);
    assertSameLength(result, vector);

    const numPoints = points.length / 3;
    for (let i = 0; i < numPoints; i++) {
        let rx = 0.0;
        let ry = 0.0;
        let rz = 0.0;
        const xi = points[3 * i + 0];
        const yi = points[3 * i + 1];
        const zi = points[3 * i + 2];
        const ui = vector[3 * i + 0];
        const vi = vector[3 * i + 1];
        const wi = vector[3 * i + 2];
        for (let j = 0; j < numPoints; j++) {
            if (i !== j) {
                const xj = points[3 * j + 0];
                const yj = points[3 * j + 1];
                const zj = points[3 * j + 2];
                const uj = vector[3 * j + 0];
                const vj = vector[3 * j + 1];
                const wj = vector[3 * j + 2];
                const dx = xi - xj;
                const dy = yi - yj;
                const dz = zi - zj;
                const du = ui - uj;
                const dv = vi - vj;
                const dw = wi - wj;
                const overlap = dx * du + dy * dv + dz * dw;
                const distSq = dx * dx + dy * dy + dz * dz;
                const firstDerivative = radialEnergyDerivative(distSq);
                const secondDerivative = radialEnergySecondDerivative(distSq);
                const alpha = firstDerivative + firstDerivative;
                let beta = overlap * secondDerivative;
                beta += beta;
                beta += beta;
                rx += alpha * du + beta * dx;
                ry += alpha * dv + beta * dy;
                rz += alpha * dw + beta * dz;
            }
        }
        result[3 * i + 0] = rx;
        result[3 * i + 1] = ry;
        result[3 * i + 2] = rz;
    }
}


/**
 * @param {NumericArray} forces
 * @param {NumericArray} points
 * @returns {void}
 */
export function constrainForces(forces, points) {

    assertNumericArray3D(forces);
    assertNumericArray3D(points);
    assertSameLength(forces, points);

    const numPoints = forces.length / 3;
    for (let i = 0; i < numPoints; i++) {
        const fx = forces[3 * i + 0];
        const fy = forces[3 * i + 1];
        const fz = forces[3 * i + 2];
        const px = points[3 * i + 0];
        const py = points[3 * i + 1];
        const pz = points[3 * i + 2];
        const overlap = fx * px + fy * py + fz * pz;
        forces[3 * i + 0] = fx - overlap * px;
        forces[3 * i + 1] = fy - overlap * py;
        forces[3 * i + 2] = fz - overlap * pz;
    }
}


/**
 * @param {NumericArray} forces
 * @returns {number}
 */
export function computeRmsForce(forces) {

    assertNumericArray3D(forces);

    const numForces = forces.length / 3;
    let sumForceSq = 0.0;
    for (const entry of forces) {
        sumForceSq += entry * entry;
    }
    return Math.sqrt(sumForceSq / numForces);
}
