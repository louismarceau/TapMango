import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';

@Component({
  selector: 'sms-dashboard',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit, OnDestroy {
  phoneNumber: string = '';
  message: string = '';
  rateLimits: { [key: string]: any } = {} as { [key: string]: any };;
  filteredRateLimits: { [key: string]: any } = {} as { [key: string]: any };
  uniqueAccounts: string[] = [];
  uniquePhoneNumbers: string[] = [];
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
        (response: any) => this.message = response.message,
        error => this.message = error.error
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
      data.forEach((rateLimit: any) => {
        var key = `${rateLimit.accountNumber}|${rateLimit.phoneNumber}`
        this.rateLimits[key] = rateLimit;
      });

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
    const rateLimits = this.rateLimits;

    Object.keys(rateLimits).forEach(key => {
      const rateLimit = rateLimits[key];
      const lastUpdatedTime = new Date(rateLimit.dateTime).getTime();
      const elapsedTime = (currentTime - lastUpdatedTime) / 1000;

      if (elapsedTime > this.tableCleanUpIntervalSeconds) {
        delete this.rateLimits[key];
      }
    });

    this.doRateLimitTableUpdates();
  }
  
  doRateLimitTableUpdates()
  {
    this.updateUniqueValues();
    this.filterRateLimits();
    this.sortRateLimits();
  }

  updateUniqueValues() {
    const accounts = new Set<string>();
    const phoneNumbers = new Set<string>();

    Object.values(this.rateLimits).forEach(rateLimit => {
      accounts.add(rateLimit.accountNumber);
      phoneNumbers.add(rateLimit.phoneNumber);
    });

    this.uniqueAccounts = Array.from(accounts);
    this.uniquePhoneNumbers = Array.from(phoneNumbers);
  }

  filterRateLimits() {
    this.filteredRateLimits = Object.keys(this.rateLimits)
      .filter(key => {
        const rateLimit = this.rateLimits[key];
        return (
          (this.selectedAccountNumber === '' || rateLimit.accountNumber === this.selectedAccountNumber) &&
          (this.selectedPhoneNumber === '' || rateLimit.phoneNumber === this.selectedPhoneNumber)
        );
      })
      .reduce((obj: any, key) => {
        obj[key] = this.rateLimits[key];
        return obj;
      }, {});
  }

  sortRateLimits() {
    const unsortedRateLimits = Object.values(this.filteredRateLimits);

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
    })

    const sortedRateLimits: { [key: string]: any } = {};
    unsortedRateLimits.forEach((rateLimit) => {
      var key = `${rateLimit.accountNumber}|${rateLimit.phoneNumber}`
      sortedRateLimits[key] = rateLimit;
    });

    this.filteredRateLimits = sortedRateLimits;
  }
}
