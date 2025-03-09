import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'sms-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  phoneNumber: string = '999-888-7777';
  message: string = 'test message';
  rateLimits: any[] = [];

  ngOnInit() {
    // we will do something here for the signleRConnection
  }

  checkRateLimit() {
    // we will do something here to check the rate limits
  }
}
