import { fail, error } from '@sveltejs/kit';

function wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitDefault() {
        const randomDelay = 3800 + Math.floor(Math.random() * 400); 
        await wait(randomDelay);
}

export async function defaultFail(err: number, message: string) {
    await waitDefault();
    return fail(err, {
        message: message,
    });
};
               
export async function defaultError(err: number, message: string) {
    await waitDefault();
    throw error(err, {
        message: message,
    });
};
