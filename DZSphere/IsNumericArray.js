export function isNumericArray(x) {
    if (!(
        Array.isArray(x) ||
        (x instanceof Float16Array) ||
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
