import auth from './auth';

const config = require('../config');

function policy (effect, resource) {
    return {
        Version: '2012-10-17',
        Statement: [{
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
        }]
    };
}

function findToken (event) {
    if (!event.type || event.type !== 'TOKEN') {
        throw new Error('Event Type does not include TOKEN');
    }

    if (!event?.authorizationToken) {
        throw new Error('event.authorizationToken is missing');
    }

    const bearer = event.authorizationToken.match(/^Bearer (.*)$/);
    if (!bearer || bearer.length < 2) {
        throw new Error(`Invalid Authorization token - make sure it includes "Bearer YOURTOKEN" - received ${event.authorizationToken}`);
    }
    return bearer[1];
}

export default {
    async isAuthenticated (event) {
        if(config.ENV !== 'production') console.info(event); // for debug
        const token = findToken(event);
        const validated = await auth.oidcValidate(token);
        return {
            principalId: validated.decoded.sub,
            policyDocument: policy('Allow', event.methodArn),
            context: { scope: validated.decoded?.scope }
        }
    }
}