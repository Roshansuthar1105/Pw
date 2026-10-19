import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import {
  CourseView, Difficulty, QuestionImportDraft, QuestionInput, QuestionView,
  ResourceInput, ResourceType, ResourceView, SubjectView, TopicView
} from '../../models/learning.model';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { LearningService } from '../../services/learning.service';
import { PermissionService } from '../../services/permission.service';
import { MathContentComponent } from '../common/math-content/math-content.component';
import { ModalComponent } from '../modals/modal/modal.component';

type HubSection = 'resources' | 'questions' | 'taxonomy';
type EditorKind = 'resource' | 'question' | 'taxonomy' | 'confirm' | null;
type TaxonomyKind = 'course' | 'subject' | 'topic';
type DeleteKind = 'resource' | 'question' | TaxonomyKind;

@Component({
  selector: 'app-learning-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent, MathContentComponent],
  templateUrl: './learning-hub.component.html',
  styleUrl: './learning-hub.component.scss'
})
export class LearningHubComponent implements OnInit {
  private readonly service = inject(LearningService);
  readonly i18n = inject(I18nService);
  readonly permissions = inject(PermissionService);
  readonly auth = inject(AuthService);

  @ViewChild('editorModal') editorModal?: ModalComponent;
  @ViewChild('importModal') importModal?: ModalComponent;

  readonly section = signal<HubSection>('resources');
  readonly courses = signal<CourseView[]>([]);
  readonly resources = signal<ResourceView[]>([]);
  readonly questions = signal<QuestionView[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly toast = signal<string | null>(null);
  readonly search = signal('');
  readonly resourceFilter = signal<'ALL' | ResourceType>('ALL');
  readonly filterCourseId = signal<number | null>(null);
  readonly filterSubjectId = signal<number | null>(null);

  readonly canViewQuestions = computed(() => this.permissions.hasPermission('FN_QUESTIONS_VIEW'));
  readonly canManageResources = computed(() => this.permissions.hasPermission('FN_RESOURCES_CREATE')
    && this.permissions.hasPermission('FN_TAXONOMY_VIEW'));
  readonly canAddQuestion = computed(() => this.permissions.hasPermission('FN_QUESTIONS_CREATE')
    && this.permissions.hasPermission('FN_TAXONOMY_VIEW'));
  readonly canManageQuestions = computed(() => this.permissions.hasPermission('FN_QUESTIONS_CREATE')
    || this.permissions.hasPermission('FN_QUESTIONS_EDIT') || this.permissions.hasPermission('FN_QUESTIONS_DELETE'));
  readonly canManageTaxonomy = computed(() => this.permissions.hasPermission('FN_TAXONOMY_MANAGE'));
  readonly subjectsForForm = computed(() => this.courses().find(c => c.id === this.courseId())?.subjects ?? []);
  readonly topicsForForm = computed(() => this.subjectsForForm().find(s => s.id === this.subjectId())?.topics ?? []);
  readonly filteredResources = computed(() => this.resources().filter(r => {
    const q = this.search().trim().toLowerCase();
    return (this.resourceFilter() === 'ALL' || r.type === this.resourceFilter())
      && (!this.filterCourseId() || r.courseId === this.filterCourseId())
      && (!this.filterSubjectId() || r.subjectId === this.filterSubjectId())
      && (!q || `${r.title} ${r.description ?? ''} ${r.courseName} ${r.subjectName}`.toLowerCase().includes(q));
  }));
  readonly filteredQuestions = computed(() => this.questions().filter(q => {
    const search = this.search().trim().toLowerCase();
    return (!this.filterCourseId() || q.courseId === this.filterCourseId())
      && (!this.filterSubjectId() || q.subjectId === this.filterSubjectId())
      && (!search || `${q.prompt} ${q.explanation ?? ''} ${q.courseName} ${q.subjectName}`.toLowerCase().includes(search));
  }));
  readonly editorHeading = computed(() => {
    const dict = this.i18n.dict();
    if (this.editorKind() === 'resource') return this.editId() ? dict.learning_edit_resource : dict.learning_add_resource;
    if (this.editorKind() === 'question') return this.editId() ? dict.learning_edit_question : dict.learning_add_question;
    if (this.editorKind() === 'confirm') return dict.dlg_delete_title;
    if (this.taxonomyKind() === 'course') return this.editId() ? dict.learning_edit_course : dict.learning_add_course;
    if (this.taxonomyKind() === 'subject') return this.editId() ? dict.learning_edit_subject : dict.learning_add_subject;
    return this.editId() ? dict.learning_edit_topic : dict.learning_add_topic;
  });

  readonly editorKind = signal<EditorKind>(null);
  readonly editId = signal<number | null>(null);
  readonly taxonomyKind = signal<TaxonomyKind>('course');
  readonly deleteKind = signal<DeleteKind>('resource');
  readonly deleteId = signal<number | null>(null);
  readonly formError = signal<string | null>(null);

  readonly courseId = signal<number | null>(null);
  readonly subjectId = signal<number | null>(null);
  readonly topicId = signal<number | null>(null);
  readonly name = signal('');
  readonly courseDescription = signal('');

  readonly resourceType = signal<ResourceType>('NOTES');
  readonly resourceTitle = signal('');
  readonly resourceDescription = signal('');
  readonly resourceUrl = signal('');
  readonly resourcePublished = signal(true);

  readonly prompt = signal('');
  readonly imageUrl = signal('');
  readonly explanation = signal('');
  readonly marks = signal(1);
  readonly difficulty = signal<Difficulty>('MEDIUM');
  readonly optionTexts = signal<string[]>(['', '', '', '']);
  readonly correctOption = signal('A');

  readonly importFileName = signal('');
  readonly importPreviewing = signal(false);
  readonly importRows = signal<QuestionImportDraft[]>([]);
  readonly importError = signal<string | null>(null);
  readonly importCourseId = signal<number | null>(null);
  readonly importSubjectId = signal<number | null>(null);
  readonly importTopicId = signal<number | null>(null);
  readonly importSubjects = computed(() => this.courses().find(c => c.id === this.importCourseId())?.subjects ?? []);
  readonly importTopics = computed(() => this.importSubjects().find(s => s.id === this.importSubjectId())?.topics ?? []);
  readonly importHasErrors = computed(() => this.importRows().some(row => row.errors.length > 0));

  ngOnInit(): void { this.load(); }

  setSection(section: HubSection): void {
    this.section.set(section);
    this.search.set('');
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      resources: this.service.getResources(),
      taxonomy: this.permissions.hasPermission('FN_TAXONOMY_VIEW') ? this.service.getTaxonomy() : of(null),
      questions: this.canViewQuestions() ? this.service.getQuestions() : of(null)
    }).subscribe({
      next: result => {
        this.resources.set(result.resources.data ?? []);
        this.courses.set(result.taxonomy?.data ?? []);
        this.questions.set(result.questions?.data ?? []);
        if (this.courseId() === null && this.courses().length) this.courseId.set(this.courses()[0].id);
        if (this.subjectId() === null && this.subjectsForForm().length) this.subjectId.set(this.subjectsForForm()[0].id);
        this.loading.set(false);
      },
      error: err => { this.error.set(this.errorMessage(err)); this.loading.set(false); }
    });
  }

  openResource(resource?: ResourceView): void {
    this.resetEditor();
    this.editorKind.set('resource');
    if (resource) {
      this.editId.set(resource.id);
      this.courseId.set(resource.courseId);
      this.subjectId.set(resource.subjectId);
      this.topicId.set(resource.topicId ?? null);
      this.resourceType.set(resource.type);
      this.resourceTitle.set(resource.title);
      this.resourceDescription.set(resource.description ?? '');
      this.resourceUrl.set(resource.url);
      this.resourcePublished.set(resource.published);
    } else this.selectFirstTaxonomy();
    this.editorModal?.open();
  }

  openQuestion(question?: QuestionView): void {
    this.resetEditor();
    this.editorKind.set('question');
    if (question) {
      this.editId.set(question.id);
      this.courseId.set(question.courseId);
      this.subjectId.set(question.subjectId);
      this.topicId.set(question.topicId ?? null);
      this.prompt.set(question.prompt);
      this.imageUrl.set(question.imageUrl ?? '');
      this.explanation.set(question.explanation ?? '');
      this.marks.set(question.marks);
      this.difficulty.set(question.difficulty);
      this.optionTexts.set(question.options.map(option => option.content));
      this.correctOption.set(question.correctOption);
    } else this.selectFirstTaxonomy();
    this.editorModal?.open();
  }

  openTaxonomy(kind: TaxonomyKind, parentId?: number, item?: CourseView | SubjectView | TopicView): void {
    this.resetEditor();
    this.editorKind.set('taxonomy');
    this.taxonomyKind.set(kind);
    this.name.set(item?.name ?? '');
    this.editId.set(item?.id ?? null);
    if (kind === 'course') {
      this.courseId.set(parentId ?? null);
      this.courseDescription.set((item as CourseView | undefined)?.description ?? '');
    } else if (kind === 'subject') {
      this.courseId.set(parentId ?? null);
    } else {
      this.subjectId.set(parentId ?? null);
      const course = this.courses().find(c => c.subjects.some(s => s.id === parentId));
      this.courseId.set(course?.id ?? null);
    }
    this.editorModal?.open();
  }

  requestDelete(kind: DeleteKind, id: number): void {
    this.deleteKind.set(kind);
    this.deleteId.set(id);
    this.formError.set(null);
    this.editorKind.set('confirm');
    this.editorModal?.open();
  }

  confirmDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    let request;
    switch (this.deleteKind()) {
      case 'resource': request = this.service.deleteResource(id); break;
      case 'question': request = this.service.deleteQuestion(id); break;
      case 'course': request = this.service.archiveCourse(id); break;
      case 'subject': request = this.service.archiveSubject(id); break;
      case 'topic': request = this.service.archiveTopic(id); break;
    }
    this.runSave(request);
  }

  submitEditor(): void {
    this.formError.set(null);
    if (this.editorKind() === 'resource') this.saveResource();
    else if (this.editorKind() === 'question') this.saveQuestion();
    else if (this.editorKind() === 'taxonomy') this.saveTaxonomy();
  }

  saveResource(): void {
    if (!this.courseId() || !this.subjectId() || !this.resourceTitle().trim()) {
      this.formError.set(this.i18n.dict().learning_required);
      return;
    }
    if (this.resourceType() === 'VIDEO' && !this.validYoutube(this.resourceUrl())) {
      this.formError.set(this.i18n.dict().learning_invalid_video_link);
      return;
    }
    if (this.resourceType() === 'NOTES' && !this.validHttps(this.resourceUrl())) {
      this.formError.set(this.i18n.dict().learning_invalid_link);
      return;
    }
    const payload: ResourceInput = {
      courseId: this.courseId()!, subjectId: this.subjectId()!, topicId: this.topicId(),
      type: this.resourceType(), title: this.resourceTitle().trim(), description: this.resourceDescription().trim(),
      url: this.resourceUrl().trim(), published: this.resourcePublished()
    };
    const request = this.editId() ? this.service.updateResource(this.editId()!, payload) : this.service.createResource(payload);
    this.runSave(request);
  }

  saveQuestion(): void {
    const enteredOptions = this.optionTexts().map((content, index) => ({ key: this.optionKey(index), content: content.trim() }));
    const filledOptions = enteredOptions.filter(option => option.content);
    const selectedIndex = filledOptions.findIndex(option => option.key === this.correctOption());
    const options = filledOptions.map((option, index) => ({ key: this.optionKey(index), content: option.content }));
    if (!Number.isFinite(this.marks()) || this.marks() < 1 || this.marks() > 1000) {
      this.formError.set(this.i18n.dict().learning_row_marks_invalid);
      return;
    }
    if (!this.courseId() || !this.subjectId() || !this.prompt().trim() || options.length < 2 || selectedIndex < 0) {
      this.formError.set(this.i18n.dict().learning_required);
      return;
    }
    if (this.imageUrl().trim() && !this.validHttps(this.imageUrl())) { this.formError.set(this.i18n.dict().learning_invalid_link); return; }
    const payload: QuestionInput = {
      courseId: this.courseId()!, subjectId: this.subjectId()!, topicId: this.topicId(),
      prompt: this.prompt().trim(), imageUrl: this.imageUrl().trim() || null,
      explanation: this.explanation().trim() || null, correctOption: this.optionKey(selectedIndex),
      marks: Number(this.marks()), difficulty: this.difficulty(), options: options.filter(o => o.content)
    };
    const request = this.editId() ? this.service.updateQuestion(this.editId()!, payload) : this.service.createQuestion(payload);
    this.runSave(request);
  }

  saveTaxonomy(): void {
    if (!this.name().trim()) { this.formError.set(this.i18n.dict().learning_required); return; }
    let request;
    const id = this.editId();
    if (this.taxonomyKind() === 'course') {
      const payload = { name: this.name().trim(), description: this.courseDescription().trim() };
      request = id ? this.service.updateCourse(id, payload) : this.service.createCourse(payload);
    } else if (this.taxonomyKind() === 'subject') {
      if (!this.courseId()) { this.formError.set(this.i18n.dict().learning_required); return; }
      const payload = { courseId: this.courseId()!, name: this.name().trim() };
      request = id ? this.service.updateSubject(id, payload) : this.service.createSubject(payload);
    } else {
      if (!this.subjectId()) { this.formError.set(this.i18n.dict().learning_required); return; }
      const payload = { subjectId: this.subjectId()!, name: this.name().trim() };
      request = id ? this.service.updateTopic(id, payload) : this.service.createTopic(payload);
    }
    this.runSave(request);
  }

  addOption(): void { if (this.optionTexts().length < 6) this.optionTexts.update(values => [...values, '']); }
  removeOption(index: number): void {
    if (this.optionTexts().length <= 2) return;
    const values = this.optionTexts().filter((_, i) => i !== index);
    const oldCorrectIndex = this.correctOption().charCodeAt(0) - 65;
    this.optionTexts.set(values);
    if (index === oldCorrectIndex) this.correctOption.set('A');
    else if (index < oldCorrectIndex) this.correctOption.set(String.fromCharCode(64 + oldCorrectIndex));
  }
  setOption(index: number, value: string): void { this.optionTexts.update(values => values.map((item, i) => i === index ? value : item)); }
  optionKey(index: number): string { return String.fromCharCode(65 + index); }
  difficultyLabel(value: string): string {
    const dict = this.i18n.dict();
    if (value === 'EASY') return dict.learning_easy;
    if (value === 'HARD') return dict.learning_hard;
    return dict.learning_medium;
  }

  startImport(): void {
    this.importRows.set([]);
    this.importError.set(null);
    this.importFileName.set('');
    this.importPreviewing.set(false);
    this.importCourseId.set(this.courses()[0]?.id ?? null);
    const firstSubject = this.courses()[0]?.subjects[0];
    this.importSubjectId.set(firstSubject?.id ?? null);
    this.importTopicId.set(null);
    this.importModal?.open();
  }

  onImportFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importFileName.set(file.name);
    this.importError.set(null);
    this.importRows.set([]);
    this.importPreviewing.set(true);
    this.service.previewImport(file).subscribe({
      next: response => {
        this.importRows.set((response.data?.questions ?? []).map(row => ({ ...row, options: [...row.options], errors: [...row.errors] })));
        this.importPreviewing.set(false);
      },
      error: err => { this.importPreviewing.set(false); this.importError.set(this.errorMessage(err)); }
    });
  }

  updateImportRow(index: number, field: keyof QuestionImportDraft, value: unknown): void {
    const rows = [...this.importRows()];
    const row = { ...rows[index], [field]: value } as QuestionImportDraft;
    rows[index] = { ...row, errors: this.validateImportRow(row) };
    this.importRows.set(rows);
  }
  updateImportOption(rowIndex: number, optionIndex: number, value: string): void {
    const rows = [...this.importRows()];
    const row = { ...rows[rowIndex], options: [...rows[rowIndex].options] };
    row.options[optionIndex] = { ...row.options[optionIndex], content: value };
    rows[rowIndex] = { ...row, errors: this.validateImportRow(row) };
    this.importRows.set(rows);
  }
  saveImportedQuestions(): void {
    if (!this.importCourseId() || !this.importSubjectId() || !this.importRows().length || this.importHasErrors()) {
      this.importError.set(this.i18n.dict().learning_required);
      return;
    }
    this.saving.set(true);
    this.service.saveImport({ courseId: this.importCourseId()!, subjectId: this.importSubjectId()!, topicId: this.importTopicId(), questions: this.importRows() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.importModal?.close();
        this.toast.set(this.i18n.dict().learning_import_success);
        this.load();
      },
      error: err => { this.saving.set(false); this.importError.set(this.errorMessage(err)); }
    });
  }

  private validateImportRow(row: QuestionImportDraft): string[] {
    const errors: string[] = [];
    const dict = this.i18n.dict();
    if (!row.prompt?.trim()) errors.push(dict.learning_row_prompt_missing);
    if (row.options.length < 2 || row.options.length > 6 || row.options.some(o => !o.content.trim())) errors.push(dict.learning_row_options_invalid);
    if (!row.options.some(o => o.key === row.correctOption)) errors.push(dict.learning_row_answer_invalid);
    if (!row.marks || row.marks < 1 || row.marks > 1000) errors.push(dict.learning_row_marks_invalid);
    if (!['EASY', 'MEDIUM', 'HARD'].includes(row.difficulty)) errors.push(dict.learning_row_difficulty_invalid);
    if (row.imageUrl?.trim() && !this.validHttps(row.imageUrl)) errors.push(dict.learning_invalid_link);
    return errors;
  }

  private runSave(request: Observable<unknown>): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editorModal?.close();
        this.toast.set(this.i18n.dict().learning_save_success);
        this.load();
      },
      error: err => { this.saving.set(false); this.formError.set(this.errorMessage(err)); }
    });
  }

  private selectFirstTaxonomy(): void {
    const course = this.courses()[0];
    this.courseId.set(course?.id ?? null);
    this.subjectId.set(course?.subjects[0]?.id ?? null);
    this.topicId.set(null);
  }
  private resetEditor(): void {
    this.editId.set(null);
    this.formError.set(null);
    this.name.set('');
    this.courseDescription.set('');
    this.resourceType.set('NOTES');
    this.resourceTitle.set('');
    this.resourceDescription.set('');
    this.resourceUrl.set('');
    this.resourcePublished.set(true);
    this.prompt.set('');
    this.imageUrl.set('');
    this.explanation.set('');
    this.marks.set(1);
    this.difficulty.set('MEDIUM');
    this.optionTexts.set(['', '', '', '']);
    this.correctOption.set('A');
    this.courseId.set(null);
    this.subjectId.set(null);
    this.topicId.set(null);
  }
  private validHttps(value: string): boolean {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
  }
  private validYoutube(value: string): boolean {
    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      return url.protocol === 'https:' && (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be');
    } catch { return false; }
  }
  private errorMessage(error: unknown): string {
    const payload = error as { error?: { message?: string } };
    const message = payload?.error?.message ?? '';
    if (/pdf|scan|text|csv|xlsx|file/i.test(message)) return this.i18n.dict().learning_import_failed;
    return this.i18n.dict().learning_save_error;
  }
}
