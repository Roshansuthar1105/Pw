import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';

interface DemoAccount {
  label: string;
  badge: string;
  username: string;
  role: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);

  readonly username = signal<string>('superadmin');
  readonly password = signal<string>('Admin@123');
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly demoAccounts: DemoAccount[] = [
    { label: 'Super Admin', badge: 'Full Bypass', username: 'superadmin', role: 'ADMIN' },
    { label: 'Platform Admin', badge: 'Admin Role', username: 'admin_user', role: 'ADMIN' },
    { label: 'Faculty Teacher', badge: 'Teacher Group', username: 'teacher_demo', role: 'TEACHER' },
    { label: 'Enrolled Student', badge: 'Student Group', username: 'student_demo', role: 'STUDENT' },
    { label: 'Academic Mentor', badge: 'Mentor Group', username: 'mentor_demo', role: 'MENTOR' }
  ];

  selectDemoAccount(acc: DemoAccount): void {
    this.username.set(acc.username);
    this.password.set('Admin@123');
    this.submit();
  }

  submit(): void {
    const u = this.username().trim();
    const p = this.password().trim();

    if (!u || !p) {
      this.errorMessage.set('Please provide both username and password.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(u, p).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid username or password.');
      }
    });
  }
}
