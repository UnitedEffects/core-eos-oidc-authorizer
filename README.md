# Core Authorizer for AWS Gateway

AWS Gateway [Custom Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html) designed to work with [Core EOS](https://unitedeffects.com)  OIDC solution to authorize OAuth2 bearer tokens. This solution will validate both Opaque and JWT tokens, assuming appropriate Platform configuration for each.

## What are Custom Authorizers Exactly?

the AWS API Gateway is an excellent resource that allows you to expose REST APIs to the outside world. To authorize incoming requests with API Gateway, you have 3 options:

1. Cognito User Pools - Natively built-in Oauth2 AWS solution.
2. Handled at the Origin - Meaning the services your Gateway is exposing handle authorization themelves without any upstream intervention.
3. Custom Authorizers - A solution whereby a Lambda function intercepts incoming requests to the Gateway, performs any kind of authorization you wish to encode, and then either allows the request to proceed or sends a 401 Unauthorized or 403 Forbidden response if authorization is not warrented.

This service is a Lambda function that can be used for the third option. It will...,

* Confirm that a bearer token has been passed using the Authorization header
* Validate the token whether it is JWT or Opaque
* Ensure that the token adheres to the standards outlined by the [Core EOS](https://unitedeffects.com) solution

## How Authorization Works

This service allows you to validate incoming bearer tokens of type JWT or Opaque which have been issued by Core EOS. The configuration files (see below under Configs Setup) determines how you validate.

### Configs Setup

The .env_sample directory has a .env.dev.json file which can be configured as necassary. This approach allows for multiple environment files to be created (e.g. .env.qa.json, .env.production.json). The .env.dev.json file must be present either in the .env_sample/ directory or preferably in a .env/ directory if you are doing deployments from your local work station. To configure for local work and local deployments:

* copy the .env_sample/ directory and create from it a new .env/ directory where you can save your work git will ignore values
* create a new .env json file for each environment you intend to manage: .env.dev.json, .env.qa.json, .env.production.json

```json
{
  "NODE_ENV": "dev",
  "JWKS_URI": "https://auth.unitedeffects.com/YOUR-AUTHGROUP-ID/jwks",
  "CORE_URI": "https://auth.unitedeffects.com",
  "AUTH_GROUP": "YOUR-CORE-EOS-AUTHGROUP-ID",
  "AUD": "yourgatewaydomain.com",
  "CLIENT_ID": "YOUR-CLIENT-ID",
  "CLIENT_SECRET": null,
  "GET_USER": false,
  "PKCE": false
}
```

Keep in mind, that the .env file is always a backup to local environment variables.

### Configs Overview

* **NODE_ENV**: This is used to specify the environment you are protecting and also as a stage label when used with the serverless framework (i.e. dev, qa, production, etc.).
* **CORE_URI**: In production this is always https://auth.unitedeffects.com or if you have custom OIDC domain setup, it would be that custom domain.
* **AUTH_GROUP**: This is the Platform AuthGroup ID fround in settings in your CORE EOS solution. NOTE, you should use the ID and not the alias here.
* **JWKS_URI**: This is the jwks link from the OIDC provider/issuer. For Core EOS in production, this will be CORE_URI/AUTH_GROUP/jwks. You can also find it by going to your CORE_URI/AUTH_GROUP/.well-known/openid-configuration.
* **AUD**: (optional - recommended) This is the audience value representing your API. When provided, the token is checked to make sure it is present. Typically this would be a URL representing your app or API such as a domain name (e.g. https://your-api-domain.com).
* **CLIENT_ID**: (optional - recommended) This is required if you want to pass and validate Opaque tokens. Otherwise it is optional and when present will provide an additional validation against the client ID used for the token.
* **CLIENT_SECRET**: (optional - not recommended) This is required if PKCE is false, opaque tokens are passed, and CLIENT_ID is provided. It is used to introspect opaque tokens. We typically recommend that you use PKCE Code Authorization flow (PKCE = true) to avoid having to pass secrets.
* **PKCE**: (optional - recommended true) Proof Key for Code Exchange, used during code authorization flow and allows a client to exchange a code for the token without having to pass a client secret. Examples below use the PKCE Code Authorization flow.
* **GET_USER**: (optional - not recommended) This will do a GET CORE_URI/AUTH_GROUP/me REST call using the token once validated to obtain scope limited user data. THIS WILL ONLY WORK WITH OPAQUE TOKENS AND IS OTHERWISE IGNORED.

## Build

This solution is built in ES6 Javascript and requires you to build before deploy. Lambda functionality will be served from the generated /dist directory. Specifically, the handler when deployed is at dist/index.handler

```
yarn build
```

## Serverless Deploy

You can deploy this project manually (zipping it up yourself), through CI, or through Serverless locally from your workstation. In the case of manually or through CI, it is assumed that you have a process to set your environment variables. If you are deploying localy with the serverless framework, make sure the serverless.yaml file accounts for any changes you may have made to the code, ensure you have appropriately defined your .env configurations for the environments you require in the above "Configs" section, and follow the instructions below:

```
yarn
yarn deploy --stage=YOUR-DESIRED-ENV
```

For example, if you are deploying to a QA environment:

```
yarn deploy --stage=qa
```
This will use the file .env.qa.json to set your environment variables

## Testing

### Issue a Token

There are a number of ways to issue OIDC tokens. For this example we will explain how to initiate a Code Authorization flow login using PKCE. PKCE is a system that allows you to avoid passing CLIENT_SECRET over a network or storing it in a client that you are not sure is secure. Instead of the CLIENT SECRET, you will generate and use a Code Challenge and Code Verifier.

#### ASSUMPTION

It is assumed you have a Core EOS account, you have created a Product, and you have created a Login Service setup for PKCE login with a client_id you can reference. For a quick DYI Demo of how to do all of that, check out this article: [CLICK HERE](https://blog.unitedeffects.com/core-eos-diy-demo-6751aa7f0d42)

To begin, run the codeChallenge.js Challenge and Verifier script provided for you under ./tools
```
node ./tools/codeChallenge.js
```
This will result in an output similar to the following:
```
VERIFIER: v97ajP9t4TfYVIds6Zs593dit5X7SI2T4cr2PZVn6mTVIOnI9cgjZ5PjAq9zuowQSmA
CHALLENGE: zqmMrGJtxS9DViX4Ts0Z0y9kdGwQPX8YMkHZm5Qv2hQ
```
**DO NOT USE THESE VALUES OR STORE THEM ANYWHERE FOR USE - GENERATE YOUR OWN**

1. Go to your Core EOS Product Login Service and copy the Client ID by using the copy icon next to the value. Also make note of the Redirect URL. Hold on to both.
2. Construct the following URL and paste it into your browser. Login and you will receive a code as a query parameter in the redirected URL:
```
https://auth.unitedeffects.com/YOUR_AUTH_GROUP_ALIAS_OR_ID/auth?
   response_type=code&
   client_id=YOUR_CLIENT_ID_FROM_STEP_1&
   redirect_uri=https://YOUR_REDIRECT_URI_FROM_STEP_1&
   scope=openid access email&
   state=123abc456&
   nonce=987xyz654&
   code_challenge=CHALLENGE_VALUE_ABOVE&
   code_challenge_method=S256&
   resource=https://YOUR_API_DOMAIN.com
```
3. Take the code from the redirected URL query parameter and use it in the following curl command. Also keep in mind this assumes you are using production where the OIDC API URL is auth.unitedeffects.com. If you are testing against a custom domain or different environment, make the appropriate change in the curl command.
```
curl -X 'POST' \
'https://auth.unitedeffects.com/YOUR_AUTH_GROUP_ID_OR_ALIAS/token'
-H 'accept: application/json' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'code_verifier=YOUR_VERIFY_VALUE_ABOVE&redirect_uri=YOUR_REDIRECT_URL&code=YOUR_CODE_FROM_STEP_2&resource=YOUR_RESOURCE_FROM_STEP_2&client_id=YOUR_CLIENT_ID_FROM_STEP_1&grant_type=authorization_code'
```
**NOTE: YOU CAN ALSO DO THIS IN SWAGGER AT [AUTH.UNITEDEFFECTS.COM/SWAGGER](https://auth.unitedeffects.com/swagger)**

4. This will result in the following response:
```json
{
  "access_token": "YOUR ACCESS TOKEN HERE",
  "expires_in": 3600,
  "id_token": "YOUR ID TOKEN HERE",
  "scope": "openid access",
  "token_type": "Bearer"
}
```
Your access_token in this example will be a JWT token which you can verify at [jwt.io](https://jwt.io). If you wish to obtain an opaque token, simply omit the "resource" property from both the login URL and the curl command.

### Test the Authorizer

1. Copy the event sample
    ```
    cp event_sample.json event.json
    ```
    It should look something like this:
    ```json
    {
      "type": "TOKEN",
      "authorizationToken": "Bearer YOUR_ACCESS_TOKEN_FROM_CORE_EOS",
      "methodArn": "arn:aws:execute-api:<Region id>:<Account id>:<API id>/<Stage>/<Method>/<Resource path>"
    }
    ```
2. Paste your "access_token" from the previous section (Issue a Token) response into the JSON file under the "authroizationToken" property.
3. Run the [local-lambda](https://www.npmjs.com/package/lambda-local) script
    ```
    yarn test
    ```
4. Validate the results which should look something like...
```json
{
     "principalId": "SUBJECT_ID_HERE",
     "policyDocument": {
             "Version": "2012-10-17",
             "Statement": [
                     {
                             "Action": "execute-api:Invoke",
                             "Effect": "Allow",
                             "Resource": "arn:aws:execute-api:us-east-1:1234567890:apiId/stage/method/resourcePath"
                     }
             ]
     },
     "context": {
             "group": "AUTH_GROUP_ID",
             "jti": "VALUE",
             "sub": "SUBJECT_ID_HERE",
             "iat": 1652133384,
             "exp": 1652136984,
             "scope": "openid access",
             "client_id": "CLIENT_ID_USED",
             "iss": "https://auth.unitedeffects.com/AUTH_GROUP_ID",
             "aud": "https://YOUR_API_DOMAIN.com"
     }
}
```


## Additional References

### Serverless Configuration to Protect Endpoint

https://www.serverless.com/framework/docs/providers/aws/events/apigateway#http-endpoints-with-custom-authorizers

## United Effects Core EOS

[Core EOS, by United Effects](https://unitedeffects.com), is a technology platform that integrates disconnected products and data so that businesses can focus on revenue, competition, and accelerate market opportunities. As part of this solution, Core EOS provides a full OIDC solution to manage Users, Customers, Roles, and fine-grained Permissions across all of your Products. The Core EOS OIDC solution is built on top of [UE Auth by United Effects](https://github.com/UnitedEffects/ueauth).

### Sign up Today

You can get started today with [Core EOS and sign-up at unitedeffects.com](https://unitedeffects.com) where our Beta release is free to use, and there will always be a free tier. Sign up and try our DIY quick start to see how things work - [click here](https://blog.unitedeffects.com/core-eos-diy-demo-6751aa7f0d42).

Alternatively, feel free to contact us at [solution@unitedeffects.com](mailto:solution@unitedeffects.com) to discuss a custom approach for your organization.

### Support

If you're looking for help with a commercial solution, you may contact us at [help@unitedeffects.com](mailto:help@unitedeffects.com).