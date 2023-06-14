const sync = {
    jobId: null,
    queue: [],
    trigger: () => {
        if (sync.jobId === null && sync.queue.length)
            sync.jobId = setTimeout(async () => {
                const {callback, args, elm} = sync.queue.shift();
                const result = await callback(...args);
                elm.dispatchEvent(new CustomEvent('result', {detail: result}));
                sync.jobId = null;
                sync.trigger();
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
    acquire: async () => {
        while (lock.isLocked) await new Promise(setTimeout);
        lock.isLocked = true;
    },
    release: () => {
        lock.isLocked = false;
    },
};


export const withLock = callback => async (...args) => {
    await lock.acquire();
    try {
        return callback(...args);
    } finally {
        lock.release();
    }
};


export const withDisabled = callback => event => {
    event.target.toggleAttribute('disabled');
    try {
        return callback(event);
    } finally {
        event.target.toggleAttribute('disabled');
    }
};
