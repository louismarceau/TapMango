import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up to 10 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp-down to 0 users over 30 seconds
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should be less than 10%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{status:200}': ['max>=0'],
    'http_req_duration{status:429}': ['max>=0'],
    'http_req_duration{status:400}': ['max>=0'],
    'http_req_duration{status:500}': ['max>=0'],
  },
  'summaryTrendStats': ['min', 'med', 'avg', 'p(90)', 'p(95)', 'max', 'count'],
};

export default function () {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6001&phoneNumber=403-867-5309';
  const res = http.get(url);

  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is less than 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!result);

  sleep(0.1); // Sleep for 100 milliseconds between request
}
