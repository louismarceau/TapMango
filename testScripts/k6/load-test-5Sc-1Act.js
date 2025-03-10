import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export const options = {
  scenarios: {
    A: {
      exec: 'A_endpoint',
      executor: 'constant-arrival-rate',
      preAllocatedVUs: 20,
      duration: '2m',
      rate: 50,
    },
    B: {
      exec: 'B_endpoint',
      executor: 'constant-arrival-rate',
      preAllocatedVUs: 20,
      duration: '2m',
      rate: 50,
    },
    C: {
      exec: 'C_endpoint',
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: 20,
      stages: [
        { target: 0, duration: '29s' },
        { target: 100, duration: '1s' },
        { target: 100, duration: '60s' },
        { target: 50, duration: '29s' },
        { target: 0, duration: '1s' },
      ]
    },
    D: {
      exec: 'D_endpoint',
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: 20,
      stages: [
        { target: 0, duration: '60s' },
        { target: 150, duration: '1s' },
        { target: 150, duration: '60s' },
        { target: 0, duration: '1s' },
      ]
    },
    E: {
      exec: 'E_endpoint',
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: 20,
      stages: [
        { target: 0, duration: '60s' },
        { target: 150, duration: '1s' },
        { target: 150, duration: '60s' },
        { target: 0, duration: '1s' },
      ]
    },
  },
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

export function A_endpoint() {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6051&phoneNumber=403-867-5309';
  const res = http.get(url);

  checkResult(res);
}

export function B_endpoint() {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6051&phoneNumber=403-999-2002';
  const res = http.get(url);

  checkResult(res);
}

export function C_endpoint() {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6051&phoneNumber=403-999-3003';
  const res = http.get(url);

  checkResult(res);
}

export function D_endpoint() {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6051&phoneNumber=403-999-4004';
  const res = http.get(url);

  checkResult(res);
}

export function E_endpoint() {
  const url = 'http://localhost:5130/api/sms/can-send-sms?accountNumber=K6051&phoneNumber=403-867-5309';
  const res = http.get(url);

  checkResult(res);
}

export function checkResult(res) {
  const result = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is less than 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!result);
}
