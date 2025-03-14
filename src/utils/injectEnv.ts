export const injectEnv = (env: Env) => {
    for (const key in env) {
        if (typeof env[key as keyof Env] === "string") {
            process.env[key] = env[key as keyof Env] as string;
        }
    }
};
