import { Component, OnInit } from '@angular/core';
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

export class DashboardComponent implements OnInit {
  phoneNumber: string = '';
  message: string = '';
  rateLimits: any[] = [];
  private hubConnection!: signalR.HubConnection;
  private readonly baseUrl = 'http://localhost:5130/';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startSmsHubConnection();
  }

  checkRateLimit() {
    this.http.get(`${this.baseUrl}api/sms/can-send-sms?phoneNumber=${this.phoneNumber}`)
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
        this.rateLimits[rateLimit.phoneNumber] = rateLimit;
      });
    });
  }
}
