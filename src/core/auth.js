import jwt from 'jsonwebtoken';
import qs from 'querystring';
import jkwsClient from 'jwks-rsa';
import axios from 'axios';

const config = require('../config');

const jwtCheck = /^([A-Za-z0-9\-_~+\/]+[=]{0,2})\.([A-Za-z0-9\-_~+\/]+[=]{0,2})(?:\.([A-Za-z0-9\-_~+\/]+[=]{0,2}))?$/;
const CORE = config.CORE_URI;
const JWKS_URI = config.JWKS_URI;
const AUTH_GROUP = config.AUTH_GROUP;
const PKCE = config.PKCE;
const AUDIENCE = config.AUD;
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;
const GET_USER = config.GET_USER;

async function getUser(token) {
	const url = `${CORE}/${AUTH_GROUP}/me`;
	const options = {
		url,
		method: 'get',
		headers: {
			authorization: `bearer ${token}`
		}
	}
	const result = await axios(options);
	return result.data;
}

async function introspect(token) {
	if (!CLIENT_ID) throw new Error('Introspection not possible without a client id');
	const introspection = `${CORE}/${AUTH_GROUP}/token/introspection`;
	const options = (PKCE !== true) ? {
		url: introspection,
		method: 'post',
		auth: {
			username: CLIENT_ID,
			password: CLIENT_SECRET
		},
		data: qs.stringify({
			token,
			'token-hint': 'access_token'
		})
	} : {
		url: introspection,
		method: 'post',
		data: qs.stringify({
			token,
			'token-hint': 'access_token',
			client_id: CLIENT_ID
		})
	}
	const result = await axios(options);
	return result.data;
}

function isJWT(str) {
	return jwtCheck.test(str);
}

async function runDecodedChecks(token, issuer, decoded, authGroup, jwt) {
	if(decoded.nonce) {
		throw new Error('ID Tokens should not be used for API Access');
	}

	if(decoded.iss !== issuer) {
		throw new Error('Token issuer not recognized');
	}

	if(!decoded.group || decoded.group !== authGroup) {
		throw new Error('Auth Group does not match or is not present in the token');
	}

	if (AUDIENCE) {
		if(typeof decoded.aud === 'string') {
			if(decoded.aud !== AUDIENCE) {
				throw new Error('Token aud string is not valid');
			}
		}
		if(Array.isArray(decoded.aud)) {
			if(!decoded.aud.includes(AUDIENCE)) {
				throw new Error('Token aud array does not include required API audience');
			}
		}
	}

	if(CLIENT_ID) {
		if (!decoded.client_id || decoded.client_id !== CLIENT_ID) {
			throw new Error('Client ID validations requested - Client ID in token does not match');
		}
	}

	if(!decoded.sub) {
		throw new Error('Subject ID must be part of the token');
	}

	if(GET_USER && jwt !== true) {
		if(decoded.sub && decoded.client_id !== decoded.sub) {
			let user;
			if(decoded.email) {
				user = {
					sub: decoded.sub,
					email: decoded.email
				}
			} else {
				user = await getUser(token);
			}
			if(!user) throw new Error('Token should include email');
			return { clientCredential: false, user, decoded };
		}
	}

	if((decoded.client_id === decoded.sub) || (!decoded.sub && decoded.client_id)) {
		return { clientCredential: true, decoded };
	}

	return { clientCredential: false, decoded };
}

export default {
	async oidcValidate(token) {
		const authGroup = AUTH_GROUP;
		const issuer = `${CORE}/${AUTH_GROUP}`;
		const jwksUri = JWKS_URI;
		// jwt
		if(isJWT(token)){
			const client = jkwsClient({
				cache: true,
				rateLimit: true,
				jwksRequestsPerMinute: 10,
				jwksUri
			});
			const pre = jwt.decode(token, { complete: true });
			if (!pre || !pre.header || !pre.header.kid) {
				throw new Error('invalid token');
			}
			const key = await client.getSigningKey(pre.header.kid);
			const signingKey = key.getPublicKey() || key.rsaPublicKey();
			const decoded = await jwt.verify(token, signingKey);
			if(decoded) {
				return runDecodedChecks(token, issuer, decoded, authGroup, true);
			}
		}
		//opaque
		const inspect = await introspect(token);
		if(inspect) {
			if (inspect.active === false) throw new Error('unauthorized');
			return runDecodedChecks(token, issuer, inspect, authGroup, false);
		}
		throw new Error('unauthorized');
	}
};