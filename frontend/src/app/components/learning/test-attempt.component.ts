import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AttemptResult, AttemptStart } from '../../models/learning.model';
import { I18nService } from '../../services/i18n.service';
import { LearningService } from '../../services/learning.service';
import { MathContentComponent } from '../common/math-content/math-content.component';
import { ModalComponent } from '../modals/modal/modal.component';

@Component({
  selector: 'app-test-attempt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MathContentComponent, ModalComponent],
  templateUrl: './test-attempt.component.html',
  styleUrl: './test-attempt.component.scss'
})
export class TestAttemptComponent implements OnInit, OnDestroy {
  private readonly service = inject(LearningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  @ViewChild('submitModal') submitModal?: ModalComponent;

  readonly testId = Number(this.route.snapshot.paramMap.get('testId'));
  readonly attempt = signal<AttemptStart | null>(null);
  readonly result = signal<AttemptResult | null>(null);
  readonly answers = signal<Record<number, string>>({});
  readonly index = signal(0);
  readonly remainingSeconds = signal(0);
  readonly paletteOpen = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly expired = signal(false);
  readonly error = signal<string | null>(null);
  readonly savedNotice = signal<string | null>(null);
  readonly currentQuestion = computed(() => this.attempt()?.questions[this.index()] ?? null);
  readonly questionCount = computed(() => this.attempt()?.questions.length ?? 0);
  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly timeDisplay = computed(() => {
    const total = this.remainingSeconds();
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  private timerId?: ReturnType<typeof setInterval>;
  private autosaveId?: ReturnType<typeof setTimeout>;
  private dirty = false;
  private submitWhenSaved = false;
  private exitWhenSaved = false;

  ngOnInit(): void {
    if (!Number.isFinite(this.testId) || this.testId < 1) {
      this.error.set(this.i18n.dict().learning_attempt_error);
      this.loading.set(false);
      return;
    }
    this.service.startAttempt(this.testId).subscribe({
      next: response => {
        const attempt = response.data;
        if (!attempt) {
          this.error.set(this.i18n.dict().learning_attempt_error);
          this.loading.set(false);
          return;
        }
        this.attempt.set(attempt);
        this.answers.set({ ...attempt.answers });
        this.loading.set(false);
        this.refreshTimer();
        this.timerId = setInterval(() => this.refreshTimer(), 1000);
      },
      error: () => { this.error.set(this.i18n.dict().learning_attempt_error); this.loading.set(false); }
    });
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    if (this.autosaveId) clearTimeout(this.autosaveId);
  }

  choose(questionId: number, optionKey: string): void {
    if (this.result() || this.submitting()) return;
    this.answers.update(values => ({ ...values, [questionId]: optionKey }));
    this.dirty = true;
    this.savedNotice.set(null);
    if (this.autosaveId) clearTimeout(this.autosaveId);
    this.autosaveId = setTimeout(() => this.persistLatest(), 700);
  }

  goTo(questionIndex: number): void {
    if (questionIndex < 0 || questionIndex >= this.questionCount()) return;
    this.index.set(questionIndex);
    this.paletteOpen.set(false);
  }

  previous(): void { this.goTo(this.index() - 1); }
  next(): void { this.goTo(this.index() + 1); }

  saveProgress(): void {
    if (this.autosaveId) clearTimeout(this.autosaveId);
    this.persistLatest();
  }

  requestSubmit(): void { this.submitModal?.open(); }

  confirmSubmit(): void {
    this.submitModal?.close();
    this.submitWhenSaved = true;
    if (this.autosaveId) clearTimeout(this.autosaveId);
    this.persistLatest();
  }

  exitAttempt(): void {
    this.exitWhenSaved = true;
    if (this.dirty) this.persistLatest();
    else if (!this.saving()) this.router.navigate(['/tests']);
  }

  private refreshTimer(): void {
    const attempt = this.attempt();
    if (!attempt || this.result()) return;
    const startedAt = new Date(attempt.startedAt).getTime();
    const duration = attempt.durationMinutes * 60;
    const remaining = Math.max(0, duration - Math.floor((Date.now() - startedAt) / 1000));
    this.remainingSeconds.set(remaining);
    if (remaining === 0 && !this.expired()) {
      this.expired.set(true);
      this.submitWhenSaved = true;
      if (this.autosaveId) clearTimeout(this.autosaveId);
      this.persistLatest();
    }
  }

  private persistLatest(): void {
    const attempt = this.attempt();
    if (!attempt || this.result() || this.submitting()) return;
    if (this.saving()) return;
    if (!this.dirty) {
      if (this.submitWhenSaved) this.sendSubmission();
      else this.savedNotice.set(this.i18n.dict().learning_progress_saved);
      return;
    }
    this.dirty = false;
    this.saving.set(true);
    this.service.saveAnswers(this.testId, attempt.attemptId, this.answers()).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedNotice.set(this.i18n.dict().learning_progress_saved);
        if (this.dirty) this.persistLatest();
        else if (this.submitWhenSaved) this.sendSubmission();
        else if (this.exitWhenSaved) this.router.navigate(['/tests']);
      },
      error: () => {
        this.saving.set(false);
        this.dirty = true;
        this.error.set(this.i18n.dict().learning_attempt_error);
        this.submitWhenSaved = false;
        this.exitWhenSaved = false;
      }
    });
  }

  private sendSubmission(): void {
    const attempt = this.attempt();
    if (!attempt || this.submitting() || this.result()) return;
    this.submitting.set(true);
    this.service.submitAttempt(this.testId, attempt.attemptId).subscribe({
      next: response => {
        this.result.set(response.data ?? null);
        this.submitting.set(false);
        this.submitWhenSaved = false;
        if (this.timerId) clearInterval(this.timerId);
        if (!response.data) this.error.set(this.i18n.dict().learning_attempt_error);
      },
      error: () => {
        this.submitting.set(false);
        this.submitWhenSaved = false;
        this.error.set(this.i18n.dict().learning_attempt_error);
      }
    });
  }
}
