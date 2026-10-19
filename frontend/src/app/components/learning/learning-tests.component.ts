import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { CourseView, QuestionView, TestDetail, TestInput, TestSummary } from '../../models/learning.model';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { LearningService } from '../../services/learning.service';
import { PermissionService } from '../../services/permission.service';
import { MathContentComponent } from '../common/math-content/math-content.component';
import { ModalComponent } from '../modals/modal/modal.component';

type DialogKind = 'editor' | 'delete' | null;

@Component({
  selector: 'app-learning-tests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MathContentComponent, ModalComponent],
  templateUrl: './learning-tests.component.html',
  styleUrl: './learning-tests.component.scss'
})
export class LearningTestsComponent implements OnInit {
  private readonly service = inject(LearningService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly permissions = inject(PermissionService);

  @ViewChild('testModal') testModal?: ModalComponent;
  @ViewChild('deleteModal') deleteModal?: ModalComponent;

  readonly tests = signal<TestSummary[]>([]);
  readonly courses = signal<CourseView[]>([]);
  readonly questions = signal<QuestionView[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly toast = signal<string | null>(null);
  readonly isStudent = computed(() => this.auth.userType() === 'STUDENT' && !this.auth.isSuperAdmin());
  readonly canCreate = computed(() => this.permissions.hasPermission('FN_TESTS_CREATE'));
  readonly canEdit = computed(() => this.permissions.hasPermission('FN_TESTS_EDIT')
    && this.permissions.hasPermission('FN_QUESTIONS_VIEW') && this.permissions.hasPermission('FN_TAXONOMY_VIEW'));
  readonly canPublish = computed(() => this.permissions.hasPermission('FN_TESTS_PUBLISH'));
  readonly canDelete = computed(() => this.permissions.hasPermission('FN_TESTS_DELETE'));
  readonly canAttempt = computed(() => this.permissions.hasPermission('FN_TESTS_ATTEMPT'));
  readonly canBuild = computed(() => this.canCreate() && this.permissions.hasPermission('FN_QUESTIONS_VIEW')
    && this.permissions.hasPermission('FN_TAXONOMY_VIEW'));
  readonly subjects = computed(() => this.courses().find(course => course.id === this.courseId())?.subjects ?? []);
  readonly selectableQuestions = computed(() => this.questions().filter(question =>
    question.courseId === this.courseId() && question.subjectId === this.subjectId()));
  readonly selectedCount = computed(() => this.selectedQuestionIds().length);

  readonly dialogKind = signal<DialogKind>(null);
  readonly editingId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);
  readonly title = signal('');
  readonly instructions = signal('');
  readonly courseId = signal<number | null>(null);
  readonly subjectId = signal<number | null>(null);
  readonly durationMinutes = signal(30);
  readonly availableFrom = signal('');
  readonly availableUntil = signal('');
  readonly selectedQuestionIds = signal<number[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      tests: this.service.getTests(),
      taxonomy: this.permissions.hasPermission('FN_TAXONOMY_VIEW') ? this.service.getTaxonomy() : of(null),
      questions: this.permissions.hasPermission('FN_QUESTIONS_VIEW') ? this.service.getQuestions() : of(null)
    }).subscribe({
      next: result => {
        this.tests.set(result.tests.data ?? []);
        this.courses.set(result.taxonomy?.data ?? []);
        this.questions.set(result.questions?.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.error.set(this.i18n.dict().learning_load_error); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.resetForm();
    this.dialogKind.set('editor');
    const firstCourse = this.courses()[0];
    this.courseId.set(firstCourse?.id ?? null);
    this.subjectId.set(firstCourse?.subjects[0]?.id ?? null);
    this.testModal?.open();
  }

  openEdit(test: TestSummary): void {
    this.resetForm();
    this.editingId.set(test.id);
    this.dialogKind.set('editor');
    this.saving.set(true);
    this.service.getTest(test.id).subscribe({
      next: response => {
        const detail = response.data;
        if (detail) this.populate(detail);
        this.saving.set(false);
        this.testModal?.open();
      },
      error: () => { this.saving.set(false); this.error.set(this.i18n.dict().learning_save_error); }
    });
  }

  onCourseChange(value: number | null): void {
    this.courseId.set(value);
    this.subjectId.set(this.courses().find(course => course.id === value)?.subjects[0]?.id ?? null);
    this.selectedQuestionIds.set([]);
  }

  onSubjectChange(value: number | null): void {
    this.subjectId.set(value);
    this.selectedQuestionIds.set([]);
  }

  toggleQuestion(questionId: number, checked: boolean): void {
    this.selectedQuestionIds.update(ids => checked
      ? ids.includes(questionId) ? ids : [...ids, questionId]
      : ids.filter(id => id !== questionId));
  }

  isSelected(questionId: number): boolean { return this.selectedQuestionIds().includes(questionId); }

  saveTest(): void {
    this.actionError.set(null);
    if (!this.title().trim() || !this.courseId() || !this.subjectId() || this.durationMinutes() < 1 || !this.selectedCount()) {
      this.actionError.set(this.i18n.dict().learning_required);
      return;
    }
    if (!Number.isFinite(this.durationMinutes()) || this.durationMinutes() > 600) {
      this.actionError.set(this.i18n.dict().learning_test_duration_invalid);
      return;
    }
    if (this.availableFrom() && this.availableUntil() && this.availableUntil() <= this.availableFrom()) {
      this.actionError.set(this.i18n.dict().learning_test_window_invalid);
      return;
    }
    const payload: TestInput = {
      title: this.title().trim(), instructions: this.instructions().trim(),
      courseId: this.courseId()!, subjectId: this.subjectId()!,
      durationMinutes: Number(this.durationMinutes()),
      availableFrom: this.toLocalDateTime(this.availableFrom()),
      availableUntil: this.toLocalDateTime(this.availableUntil()),
      questionIds: this.selectedQuestionIds()
    };
    this.saving.set(true);
    const request = this.editingId()
      ? this.service.updateTest(this.editingId()!, payload)
      : this.service.createTest(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.testModal?.close();
        this.toast.set(this.i18n.dict().learning_save_success);
        this.load();
      },
      error: () => { this.saving.set(false); this.actionError.set(this.i18n.dict().learning_save_error); }
    });
  }

  publish(test: TestSummary): void {
    this.actionError.set(null);
    this.service.publishTest(test.id).subscribe({
      next: () => { this.toast.set(this.i18n.dict().learning_save_success); this.load(); },
      error: () => this.actionError.set(this.i18n.dict().learning_save_error)
    });
  }

  requestDelete(test: TestSummary): void {
    this.deletingId.set(test.id);
    this.actionError.set(null);
    this.deleteModal?.open();
  }

  confirmDelete(): void {
    const id = this.deletingId();
    if (!id) return;
    this.saving.set(true);
    this.service.deleteTest(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleteModal?.close();
        this.toast.set(this.i18n.dict().learning_save_success);
        this.load();
      },
      error: () => { this.saving.set(false); this.actionError.set(this.i18n.dict().learning_save_error); }
    });
  }

  begin(test: TestSummary): void {
    this.actionError.set(null);
    this.service.startAttempt(test.id).subscribe({
      next: () => this.router.navigate(['/tests', test.id, 'attempt']),
      error: () => this.actionError.set(this.i18n.dict().learning_attempt_error)
    });
  }

  availability(test: TestSummary): 'upcoming' | 'closed' | 'open' {
    const now = Date.now();
    if (test.availableFrom && new Date(test.availableFrom).getTime() > now) return 'upcoming';
    if (test.availableUntil && new Date(test.availableUntil).getTime() < now) return 'closed';
    return 'open';
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(this.i18n.lang() === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  difficultyLabel(value: string): string {
    const dict = this.i18n.dict();
    if (value === 'EASY') return dict.learning_easy;
    if (value === 'HARD') return dict.learning_hard;
    return dict.learning_medium;
  }

  trackTest(_: number, test: TestSummary): number { return test.id; }

  private populate(test: TestDetail): void {
    this.title.set(test.title);
    this.instructions.set(test.instructions ?? '');
    this.courseId.set(test.courseId);
    this.subjectId.set(test.subjectId);
    this.durationMinutes.set(test.durationMinutes);
    this.availableFrom.set(this.toLocalInput(test.availableFrom));
    this.availableUntil.set(this.toLocalInput(test.availableUntil));
    this.selectedQuestionIds.set([...test.questionIds]);
  }

  private toLocalInput(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 16);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private toLocalDateTime(value: string): string | null {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.title.set('');
    this.instructions.set('');
    this.courseId.set(null);
    this.subjectId.set(null);
    this.durationMinutes.set(30);
    this.availableFrom.set('');
    this.availableUntil.set('');
    this.selectedQuestionIds.set([]);
    this.actionError.set(null);
  }
}
