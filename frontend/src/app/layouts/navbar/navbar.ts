import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../services/auth.service';

declare const google: any;

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
 
  public authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}