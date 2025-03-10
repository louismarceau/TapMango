#!/bin/bash

# Check if the number of iterations is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <number_of_iterations>"
  exit 1
fi

# Number of iterations
NUM_ITERATIONS=$1

URL="http://localhost:5130/api/sms/can-send-sms?accountNumber=AC3313&phoneNumber=3332229090"
URL2="http://localhost:5130/api/sms/can-send-sms?AccountNumber=AC3313&phoneNumber=5551113030"

for i in $(seq 1 $NUM_ITERATIONS)
do
  response=$(curl -s -w ": HTTP Status: %{http_code}" "$URL" )
  echo -e "$response\n"
  response2=$(curl -s -w ": HTTP Status: %{http_code}" "$URL2" )
  echo -e "$response2\n"
done

wait
