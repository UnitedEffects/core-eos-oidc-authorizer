# Core Authorizer for AWS Gateway

AWS Gateway Authorizer designed to work with Core EOS OIDC solution. This solution will validate both Opaque and JWT tokens, assuming appropriate Platform configuration for each.

## How Authorization Works

This service allows you to validate incoming bearer tokens of type JWT or Opaque which have been issued by Core EOS. The configuration files (see below under Configs Setup) determines how you validate.

### Configs Setup

The .env_sample directory has a .env.dev.json file which can be configured as necassary. This approach allows for multiple environment files to be created (e.g. .env.qa.json, .env.production.json). The .env.dev.json file must be present either in the .env_sample/ directory or preferably in a .env/ directory if you are doing deployments from your local work station. To configure for local work and local deployments:

* copy the .env_sample/ directory and create from it a new .env/ directory where you can save your work git will ignore values
* create a new .env json file for each environment you intend to manage: .env.dev.json, .env.qa.json, .env.production.json

Keep in mind, that the .env file is always a backup to local environment variables.

### Configs Overview

* **ENV**: This is used to specify the environment you are protecting and also as a stage label when used with the serverless framework (i.e. dev, qa, production, etc.).
* **CORE_URI**: In production this is always https://auth.unitedeffects.com or if you have custom OIDC domain setup, it would be that custom domain.
* **AUTH_GROUP**: This is the Platform AuthGroup ID fround in settings in your CORE EOS solution. NOTE, you should use the ID and not the alias here.
* **JWKS_URI**: This is the jwks link from the OIDC provider/issuer. For Core EOS in production, this will be CORE_URI/AUTH_GROUP/jwks. You can also find it by going to your CORE_URI/AUTH_GROUP/.well-known/openid-configuration.
* **AUD**: (optional - recommended) This is the audience value representing your API. When provided, the token is checked to make sure it is present. Typically this would be a URL representing your app or API such as a domain name (e.g. https://your-api-domain.com).
* **CLIENT_ID**: (optional - recommended) This is required if you want to pass and validate Opaque tokens. Otherwise it is optional and when present will provide an additional validation against the client ID used for the token.
* **CLIENT_SECRET**: (optional - not recommended) This is required if PKCE is false, opaque tokens are passed, and CLIENT_ID is provided. It is used to introspect opaque tokens. We typically recommend that you use PKCE Code Authorization flow (PKCE = true) to avoid having to pass secrets.
* **PKCE**: (optional - recommended true) Proof Key for Code Exchange, used during code authorization flow and allows a client to exchange a code for the token without having to pass a client secret. Examples below use the PKCE Code Authorization flow.
* **GET_USER**: (optional - not recommended) This will do a GET CORE_URI/AUTH_GROUP/me REST call using the token once validated to obtain scope limited user data. While this has been provided as an option, it is not currently passing data to the API as part of the handler so a change would be required to fully utilized. PRs welcomed.

## Build

This solution is built in ES6 Javascript and requires you to build before deploy. Lambda functionality will be served from the generated /dist directory. Specifically, the handler when deployed is at dist/index.handler

* yarn build

## Serverless Deploy

You can deploy this project manually (zipping it up yourself), through CI, or through Serverless locally from your workstation. In the case of manually or through CI, it is assumed that you have a process to set your environment variables. If you are deploying localy with the serverless framework, make sure the serverless.yaml file accounts for any changes you may have made to the code, ensure you have appropriately defined your .env configurations for the environments you require in the above "Configs" section, and follow the instructions below:

* yarn
* yarn deploy --stage=YOUR-DESIRED-ENV

For example, if you are deploying to a QA environment:

* yarn deploy --stage=qa
* This will use the file .env.qa.json to set your environment variables

## References

### Serverless Configuration to Protect Endpoint

https://www.serverless.com/framework/docs/providers/aws/events/apigateway#http-endpoints-with-custom-authorizers

