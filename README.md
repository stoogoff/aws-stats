
# AWS Logs and Reports

Simple logging and reports for static websites hosted on S3. This project provides the following AWS Lambda functions:

- logger
- reporter
- location

AWS services used:

- S3
- Lambda
- DynamoDB
- CloudWatch
- SES

## Logger

Logger copies access logs from an S3 bucket and saves them in a DynamoDB database. The Lambda function should be set to run whenever a log file is saved to the S3 bucket used for logging website requests. It reads config options from a `aws.json` file which has the following options:

```
{
  "table": "logs",
  "extensions": [".html", ".mp3", ".xml"]
}
```

- **table** (string) the name of the DynamoDB table to save data to.
- **extensions** (array of strings) list of extensions of files to log. If this is omitted all files are logged.

## Reporter

Reporter reads log data from DynamoDB and generates a report of the previous week's traffic which is emailed to a specified email address. It reads config options from a `aws.json` file which has the following options:

```
{
  "logTable": "logs",
  "addressTable": "ipaddress-location",
  "templates": "reports",
  "emailFrom": "reports@example.com"
}
```

- **logTable** (string) the name of the DynamoDB table to read logs from.
- **addressTable** (string) the name of the DynamoDB table to read IP addresses from.
- **templates** (string) the name of the S3 bucket which contains the email template files.
- **emailFrom** (string) the email address to send the report from. The email address must be validated (domain or address) in SES to work.

The Lambda function should be set to run from a CloudWatch scheduled task, ideally once per week. As multiple different domains can save logs to the same S3 bucket, reporter needs to know which domain to report and who to send it to. This can be provided as JSON event data like so:

```
{
  "domain": "www.example.com",
  "emailTo": ["reporter@example.com"]
}
```

- **domain** (string) the domain to report on.
- **emailTo** (array of strings) list of email addresses to send the report to. Email addresses must be validated (domain or address) in SES to work.

## Location

Location reads IP addresses from the log DynamoDB database, compares it with what exists in the address database. Any IP addresses which appear in the first database but not the second have their location data looked up using [ipapi](https://ipapi.co/). The resulting information is stored in the address database. Location reads config options from a `aws.json` file which has the following options:

```
{
  "readTable": "logs",
  "writeTable": "ipaddress-location",
  "maxProcess": 200
}
```

- **readTable** (string) the DynamoDB table to read IP addresses from.
- **writeTable** (string) the DynamoDB table to write location data to.
- **maxProcess** (number) the maximum number of IP addresses to process in one function call.

To avoid hammering ipapi location only makes requests to the service every 250 milliseconds and will only process up to `maxProcess` addresses at a time. The higher you set `maxProcess` the higher you'll need to set the Lambda timeout.

# TODO

- Details on the DynamoDB databases and their indexes.
- aws.json files need to be created by the developer
- setting up the different AWS parts