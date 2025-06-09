import { assertNumericArray3D, assertSameLength } from "./InputValidation.js";


export function calculateCoulombEnergy(points) {

    assertNumericArray3D(points);

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
            energy += 1.0 / Math.hypot(dx, dy, dz);
        }
    }
    return energy;
}


export function calculateCoulombForces(forces, points) {

    assertNumericArray3D(forces);
    assertNumericArray3D(points);
    assertSameLength(forces, points);

    for (let i = 0; i < points.length; i += 3) {
        let fx = 0.0;
        let fy = 0.0;
        let fz = 0.0;
        const xi = points[i];
        const yi = points[i + 1];
        const zi = points[i + 2];
        for (let j = 0; j < points.length; j += 3) {
            if (i !== j) {
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
        }
        forces[i] = fx;
        forces[i + 1] = fy;
        forces[i + 2] = fz;
    }
}


export function constrainForces(forces, points) {

    assertNumericArray3D(forces);
    assertNumericArray3D(points);
    assertSameLength(forces, points);

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

    assertNumericArray3D(forces);

    let sumForceSq = 0.0;
    for (const entry of forces) {
        sumForceSq += entry * entry;
    }
    return Math.sqrt(sumForceSq / (forces.length / 3.0));
}
