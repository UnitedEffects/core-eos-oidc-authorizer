import core from './core/core';

module.exports.handler = async (event, context, done) => {
    try {
        return core.isAuthenticated(event);
    } catch (error) {
        console.log(error);
        return context.fail("Unauthorized");
    }
};
