import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { HealthStatus } from '../../models/api-response.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly itemService = inject(ItemService);

  readonly health = signal<HealthStatus | null>(null);
  readonly isLoadingHealth = signal<boolean>(false);
  readonly healthError = signal<string | null>(null);

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.isLoadingHealth.set(true);
    this.healthError.set(null);

    this.itemService.getHealth().subscribe({
      next: (status) => {
        this.health.set(status);
        this.isLoadingHealth.set(false);
      },
      error: (err) => {
        this.healthError.set('Backend not reachable or running on another port');
        this.isLoadingHealth.set(false);
      }
    });
  }
}
