import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RbacApiService } from '../../../services/rbac-api.service';
import { I18nService } from '../../../services/i18n.service';
import { AuditLog } from '../../../models/rbac.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  private rbacApi = inject(RbacApiService);
  readonly i18n = inject(I18nService);

  readonly logs = signal<AuditLog[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalLogs = computed(() => this.logs().length);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.rbacApi.getAuditLogs(100).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.logs.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load audit logs');
      }
    });
  }

  getActionBadgeClass(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'badge badge--ok';
      case 'UPDATE': return 'badge badge--warn';
      case 'DELETE': return 'badge badge--bad';
      default: return 'badge badge--neutral';
    }
  }
}
