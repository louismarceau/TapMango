import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'sms-dashboard',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  private messageSubject = new BehaviorSubject<string>('');
  private rateLimitsSubject = new BehaviorSubject<{ [key: string]: any }>({});
  private filteredRateLimitsSubject = new BehaviorSubject<{ [key: string]: any }>({});
  private uniquePhoneNumbersSubject = new BehaviorSubject<string[]>([]);
  private uniqueAccountsSubject = new BehaviorSubject<string[]>([]);

  message$: Observable<string> = this.messageSubject.asObservable();
  rateLimits$: Observable<{ [key: string]: any }> = this.rateLimitsSubject.asObservable();
  filteredRateLimits$: Observable<{ [key: string]: any }> = this.filteredRateLimitsSubject.asObservable();
  uniqueAccounts$: Observable<string[]> = this.uniqueAccountsSubject.asObservable();
  uniquePhoneNumbers$: Observable<string[]> = this.uniquePhoneNumbersSubject.asObservable();

  phoneNumber: string = '';
  selectedAccountNumber: string = '';
  selectedPhoneNumber: string = '';

  private hubConnection!: signalR.HubConnection;
  private readonly baseUrl = 'http://localhost:5130/';
  private intervalId: any;
  private readonly tableCleanUpIntervalSeconds = 5;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startSmsHubConnection();
    this.startPeriodicTableCleanUp();
  }

  ngOnDestroy(): void {
    this.stopPeriodicTableCleanUp();
  }

  checkRateLimit() {
    this.http.get(`${this.baseUrl}api/sms/can-send-sms?accountNumber=SD0001&phoneNumber=${this.phoneNumber}`)
      .subscribe(
        (response: any) => this.messageSubject.next(response.message),
        error => this.messageSubject.next(error.error)
      );
  }

  startSmsHubConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}smsHub`)
      .build();

    this.hubConnection.start()
      .then(() => console.log('Connection started'))
      .catch(err => console.error('Error while starting connection: ', err));

    this.hubConnection.on('UpdateRateLimits', (data: any[]) => {
      const rateLimits = this.rateLimitsSubject.getValue();
      data.forEach((rateLimit: any) => {
        const key = `${rateLimit.accountNumber}|${rateLimit.phoneNumber}`;
        rateLimits[key] = rateLimit;
      });
      this.rateLimitsSubject.next(rateLimits);
      this.doRateLimitTableUpdates();
    });
  }

  startPeriodicTableCleanUp() {
    this.intervalId = setInterval(() => {
      this.doPeriodicTableCleanUp();
    }, this.tableCleanUpIntervalSeconds * 1000);
  }

  stopPeriodicTableCleanUp() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  doPeriodicTableCleanUp() {
    const currentTime = new Date().getTime();
    const rateLimits = this.rateLimitsSubject.getValue();

    Object.keys(rateLimits).forEach(key => {
      const rateLimit = rateLimits[key];
      const lastUpdatedTime = new Date(rateLimit.dateTime).getTime();
      const elapsedTime = (currentTime - lastUpdatedTime) / 1000;

      if (elapsedTime > this.tableCleanUpIntervalSeconds) {
        delete rateLimits[key];
      }
    });

    this.rateLimitsSubject.next(rateLimits);
    this.doRateLimitTableUpdates();
  }

  doRateLimitTableUpdates() {
    this.updateUniqueValues();
    this.filterRateLimits();
    this.sortRateLimits();
  }

  updateUniqueValues() {
    const rateLimits = this.rateLimitsSubject.getValue();
    const accounts = new Set<string>();
    const phoneNumbers = new Set<string>();

    Object.values(rateLimits).forEach(rateLimit => {
      accounts.add(rateLimit.accountNumber);
      phoneNumbers.add(rateLimit.phoneNumber);
    });

    this.uniqueAccountsSubject.next(Array.from(accounts));
    this.uniquePhoneNumbersSubject.next(Array.from(phoneNumbers));
  }

  filterRateLimits() {
    const rateLimits = this.rateLimitsSubject.getValue();
    const filteredRateLimits = Object.keys(rateLimits)
      .filter(key => {
        const rateLimit = rateLimits[key];
        return (
          (this.selectedAccountNumber === '' || rateLimit.accountNumber === this.selectedAccountNumber) &&
          (this.selectedPhoneNumber === '' || rateLimit.phoneNumber === this.selectedPhoneNumber)
        );
      })
      .reduce((obj: any, key) => {
        obj[key] = rateLimits[key];
        return obj;
      }, {});

    this.filteredRateLimitsSubject.next(filteredRateLimits);
  }

  sortRateLimits() {
    const filteredRateLimits = this.filteredRateLimitsSubject.getValue();
    const unsortedRateLimits = Object.values(filteredRateLimits);

    unsortedRateLimits.sort((a, b) => {
      if (a.accountNumber < b.accountNumber) {
        return -1;
      }
      if (a.accountNumber > b.accountNumber) {
        return 1;
      }
      if (a.phoneNumber < b.phoneNumber) {
        return -1;
      }
      if (a.phoneNumber > b.phoneNumber) {
        return 1;
      }
      return 0;
    });

    const sortedRateLimits: { [key: string]: any } = {};
    unsortedRateLimits.forEach((rateLimit) => {
      const key = `${rateLimit.accountNumber}|${rateLimit.phoneNumber}`;
      sortedRateLimits[key] = rateLimit;
    });

    this.filteredRateLimitsSubject.next(sortedRateLimits);
  }
}
