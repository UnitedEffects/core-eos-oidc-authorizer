# Core Authorizer for AWS Gateway

AWS Gateway Authorizer designed to work with Core EOS OIDC solution. This solution will validate both Opaque and JWT tokens, assuming appropriate Platform configuration for each.

## References

### Serverless Configuration to Protect Endpoint

https://www.serverless.com/framework/docs/providers/aws/events/apigateway#http-endpoints-with-custom-authorizers

## Build

This solution is built in ES6 Javascript and requires you to build before deploy. Lambda functionality will be served from the generated /dist directory. Specifically, the handler when deployed is at dist/index.handler

* yarn build

## Configs

The .env_sample directory has a .env.dev.json file which can be configured as necassary. This approach allows for multiple environment files to be created (e.g. .env.qa.json, .env.production.json). The .env.dev.json file must be present either in the .env_sample/ directory or preferably in a .env/ directory if you are doing deployments from your local work station. To configure for local work and local deployments:

* copy the .env_sample/ directory and create from it a new .env/ directory where you can save your work git will ignore values
* create a new .env json file for each environment you intend to manage: .env.dev.json, .env.qa.json, .env.production.json

Keep in mind, that the .env file is always a backup to local environment variables.

## Serverless Deploy

You can deploy this project manually (zipping it up yourself), through CI, or through Serverless locally from your workstation. In the case of manually or through CI, it is assumed that you have a process to set your environment variables. If you are deploying localy with the serverless framework, make sure the serverless.yaml file accounts for any changes you may have made to the code, ensure you have appropriately defined your .env configurations for the environments you require in the above "Configs" section, and follow the instructions below:

* yarn
* yarn deploy --stage=YOUR-DESIRED-ENV

For example, if you are deploying to a QA environment:

* yarn deploy --stage=qa
* This will use the file .env.qa.json to set your environment variables

