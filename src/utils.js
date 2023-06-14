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


export const asyncWithDisabled = callback => async event => {
    event.target.toggleAttribute('disabled');
    try {
        return await callback(event);
    } finally {
        event.target.toggleAttribute('disabled');
    }
};
