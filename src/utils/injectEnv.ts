export const injectEnv = (env: Env) => {
    for (const key in env) {
        process.env[key] = env[key as keyof Env];
    }
};
