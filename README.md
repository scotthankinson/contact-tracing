# School Contact Tracing

A simple serverless UI + Backend to enable contact tracing given a contact list 


## Dev Setup

This project is developed against NodeJS 12.0.  To install, run 

``` 
npm install
```

Required configuration:
```
create a deploy.env.yml file with the following keys:

* IAM_ROLE - the IAM role for the notify lambda function which should include appropriate SES permissions
* SEND_EMAIL - boolean, set to false to avoid sending emails during testing
* MAPPING_FILE - the file name containing contacts under ./mappings/ to parse 
* SEND_FORM - the email address to send from (must be verified in SES)
* SEND_TO - the email addresses (comma separated) to notify (must be verified in SES if account is in Sandbox Mode)
```

Additional helpful commands:

```
npm run start - start the project using the Serverless Offline module for local testing.  Not very useful since there are no events hooked up to, but you can add a simple HTTP get to test invocation locally.

npm run test - run all unit tests

npm run cover - generate a Code Coverage report with Istanbul.  
    Open up ./coverage/html/index.html for helpful details and coverage analysis

npm run deploy - deploy the project using your locally configured AWS credentials
```