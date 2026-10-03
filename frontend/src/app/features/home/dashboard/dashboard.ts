import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService)

  logout(): void {
    this.authService.logout()
  }
}
