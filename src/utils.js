const lock = new class {
    static locked = false;
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async acquire() {
        const cls = this.constructor;
        while (cls.locked) await this.delay(1000);
        cls.locked = true;
        return new Promise(resolve => resolve(null));
    }
    release() {
        const cls = this.constructor;
        cls.locked = false;
    }
};


export function withLock(callback) {
    return lock.acquire().then(() => callback()).finally(() => lock.release());
}


export function asycnWithDisabled(callback) {
    return async function (event) {
        event.target.toggleAttribute('disabled');
        return callback(event)
            .finally(() => event.target.toggleAttribute('disabled'));
    }
}
