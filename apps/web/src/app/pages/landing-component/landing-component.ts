import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-component',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-component.html',
  styleUrl: './landing-component.scss',
})
export class LandingComponent {}
