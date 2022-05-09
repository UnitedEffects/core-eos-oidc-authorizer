const fs = require('fs');
const env = process.env.NODE_ENV || 'dev';
const dir = (fs.existsSync('./.env')) ? '.env' : '.env_sample';
const envVars = require(`../${dir}/env.${env}`);

const config = {
    ENV: process.env.NODE_ENV || envVars.NODE_ENV || 'dev',
    JWKS_URI: process.env.JWKS_URI || envVars.JWKS_URI || 'https://auth.unitedeffects.com/YOURAUTHGROUP/jwks',
    CORE_URI: process.env.CORE_URI || envVars.CORE_URI || 'https://auth.unitedeffects.com',
    AUTH_GROUP: process.env.AUTH_GROUP || envVars.AUTH_GROUP || 'YOURAUTHGROUP',
    AUD: process.env.AUD || envVars.AUD || null,
    PKCE: process.env.PKCE || envVars.PKCE || false,
    CLIENT_ID: process.env.CLIENT_ID || envVars.CLIENT_ID || null,
    CLIENT_SECRET: process.env.CLIENT_SECRET || envVars.CLIENT_SECRET || null,
    GET_USER: process.env.GET_USER || envVars.GET_USER || false,
};

module.exports = config;
