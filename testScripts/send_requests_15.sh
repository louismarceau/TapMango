#!/bin/bash

URL="http://localhost:5130/api/sms/can-send-sms?phoneNumber=1234567890"

for i in {1..100}
do
  curl -s -o /dev/null -w "%{http_code}\n" "$URL" &
done

wait
