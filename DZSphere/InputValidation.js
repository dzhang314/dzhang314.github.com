export function assertFiniteNumber(x) {
    if (!Number.isFinite(x)) {
        throw new TypeError("input must be a finite number")
    }
}


export function assertValidLength(n) {
    if (!(Number.isSafeInteger(n) && (n >= 0))) {
        throw new RangeError("invalid array length");
    }
}


function isNumericArray(x) {
    if (!(
        Array.isArray(x) ||
        (x instanceof Float32Array) ||
        (x instanceof Float64Array)
    )) {
        return false;
    }
    for (const entry of x) {
        if (!Number.isFinite(entry)) { return false; }
    }
    return true;
}


export function assertNumericArray3D(x) {
    if (!isNumericArray(x)) {
        throw new TypeError("input must be an array of finite numbers");
    }
    if (x.length % 3 !== 0) {
        throw new RangeError("input must have length divisible by 3");
    }
}


export function assertSameLength(x, y) {
    if (x.length !== y.length) {
        throw new RangeError("inputs must have the same length");
    }
}
