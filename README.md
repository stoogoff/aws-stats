
# AWS Logs and Reports

Simple logging and reports for static websites hosted on S3. This project provides two AWS Lambda functions, one to convert S3 website logs to a DynamoDB database and one to email a report to a user.

## Logger




## Reporter

```
{
  "domain": "www.example.com",
  "emailTo": ["reporter@example.com"]
}
```

