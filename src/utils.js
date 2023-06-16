const sync = {
    jobId: null,
    queue: [],
    trigger: function() {
        if (this.jobId === null && this.queue.length)
            this.jobId = setTimeout(async() => {
                const {callback, args, elm} = this.queue.shift();
                const result = await callback(...args);
                elm.dispatchEvent(new CustomEvent('result', {detail: result}));
                this.jobId = null;
                this.trigger();
            });
    },
};


export const withSync = callback => (...args) => {
    const elm = document.createElement('br');
    sync.queue.push({callback: callback, args: args, elm: elm});
    sync.trigger();
    return new Promise(resolve => elm.addEventListener('result', resolve)).then(event => event.detail);
}


const lock = {
    isLocked: false,
    acquire: async function() {
        while (this.isLocked) await new Promise(setTimeout);
        this.isLocked = true;
    },
    release: function() {
        this.isLocked = false;
    },
};


export const withLock = callback => async (...args) => {
    await lock.acquire();
    try {
        return await callback(...args);
    } finally {
        lock.release();
    }
};


export const withDisabled = callback => async event => {
    event.target.toggleAttribute('disabled');
    try {
        return await callback(event);
    } finally {
        event.target.toggleAttribute('disabled');
    }
};
