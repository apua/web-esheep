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


export const asyncWithLock = callback => async (...args) => {
    await lock.acquire();
    try {
        return await callback(...args);
    } finally {
        lock.release();
    }
};


export const asyncWithDisabled = callback => async event => {
    event.target.toggleAttribute('disabled');
    try {
        return await callback(event);
    } finally {
        event.target.toggleAttribute('disabled');
    }
};
