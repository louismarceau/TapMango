# Sms Rate Limiter & Dashboard
This project includes a microservice that can be used as a gatekeeper, deciding weather a message can be sent from a given phone number while respecting the providers per phone number limit and per account limit.

A dashboard web app is enclude to monitor phone numbers which are being processed.

## Dependencies and Frameworks
- .NET SDK 9.0.200
- Microsoft.AspNetCore.App 9.0.2
- Microsoft.NETCore.App 9.0.2
- Redis Server 7.0.15
- StackExchange.Redis
- Microsoft.AspNetCore.SignalR
- Angular 19.2.1
- Node 22.14.0
- Package Manager: npm 10.9.2
- k6 v0.57.0 

## SmsRateLimiter
SmsRateLimiter is the microservice and provides the following endpoint:
- http://localhost:5130//api/sms/can-send-sms?accountNumber=T0001&phoneNumber=1234567890

Where the **accountNumber** and **phoneNumber** are vairable query parameters.

### SmsRateLimiter - Configuration
Within appsettings.json there is the follow configuration:

```json
"RateLimiter": {
    "PerNumber": 4,
    "Global": 9
}
```
These values control the provider limits used in the service.

### SmsRateLimiter - Redis
A Redis Server is used as the in-memory data store to track each phone number against the provider limits. The transactions are set to expire within a fixed (or floating) 1 second window, inorder to handle resource management and prevent tracking of unnecessary phone numbers.

### SmsRateLimiter - SingleR
SingleR is used to provide real time update to the SmsDashboard web app, providing updates on the phone numbers being processed, message attempts, and message limits.

## Sms-dashboard
A simple Angular web app which primarly provides insight to the phone numbers being processed, message attempts, and message limits.

The web app can be accessed from
- http://127.0.0.1:4200/

## Load Testing
Load testing scripts can be found in the **/testScripts** directory. Included are:
- k6 test script: **/testScripts/k6/load-test.js**
- curl test script: **/testScripts/curl/send_reqeust_load_test_01.sh**

### Curl Test Script
The curl test script is a bash script that will use curl to send multiple requests to the API. It takes one arugment for the number of iterations to preform.

```console
./send_reqeust_load_test_01.sh 100
```
Where **100** is the number of iterations the script will preform.

### k6 Test Script
k6 is a tool from Grafana Labs for preforming load testing.

```console
k6 load-test.js
```