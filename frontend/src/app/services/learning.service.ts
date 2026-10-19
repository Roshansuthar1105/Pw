import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  AttemptResult, AttemptStart, CourseView, QuestionImportDraft, QuestionImportPreview,
  QuestionInput, QuestionView, ResourceInput, ResourceView, TestDetail, TestInput, TestSummary
} from '../models/learning.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = '/api';

  private options() { return { headers: this.auth.getAuthHeaders() }; }

  getTaxonomy(): Observable<ApiResponse<CourseView[]>> {
    return this.http.get<ApiResponse<CourseView[]>>(`${this.base}/learning/taxonomy`, this.options());
  }
  createCourse(payload: { name: string; description: string }): Observable<ApiResponse<CourseView>> {
    return this.http.post<ApiResponse<CourseView>>(`${this.base}/learning/taxonomy/courses`, payload, this.options());
  }
  updateCourse(id: number, payload: { name: string; description: string }): Observable<ApiResponse<CourseView>> {
    return this.http.put<ApiResponse<CourseView>>(`${this.base}/learning/taxonomy/courses/${id}`, payload, this.options());
  }
  archiveCourse(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/learning/taxonomy/courses/${id}`, this.options());
  }
  createSubject(payload: { courseId: number; name: string }): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/learning/taxonomy/subjects`, payload, this.options());
  }
  updateSubject(id: number, payload: { courseId: number; name: string }): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/learning/taxonomy/subjects/${id}`, payload, this.options());
  }
  archiveSubject(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/learning/taxonomy/subjects/${id}`, this.options());
  }
  createTopic(payload: { subjectId: number; name: string }): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/learning/taxonomy/topics`, payload, this.options());
  }
  updateTopic(id: number, payload: { subjectId: number; name: string }): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/learning/taxonomy/topics/${id}`, payload, this.options());
  }
  archiveTopic(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/learning/taxonomy/topics/${id}`, this.options());
  }

  getResources(filters: { type?: string; courseId?: number; subjectId?: number; q?: string } = {}): Observable<ApiResponse<ResourceView[]>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value)); });
    return this.http.get<ApiResponse<ResourceView[]>>(`${this.base}/resources`, { ...this.options(), params });
  }
  createResource(payload: ResourceInput): Observable<ApiResponse<ResourceView>> {
    return this.http.post<ApiResponse<ResourceView>>(`${this.base}/resources`, payload, this.options());
  }
  updateResource(id: number, payload: ResourceInput): Observable<ApiResponse<ResourceView>> {
    return this.http.put<ApiResponse<ResourceView>>(`${this.base}/resources/${id}`, payload, this.options());
  }
  deleteResource(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/resources/${id}`, this.options());
  }

  getQuestions(filters: { q?: string; courseId?: number; subjectId?: number; topicId?: number } = {}): Observable<ApiResponse<QuestionView[]>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value)); });
    return this.http.get<ApiResponse<QuestionView[]>>(`${this.base}/questions`, { ...this.options(), params });
  }
  createQuestion(payload: QuestionInput): Observable<ApiResponse<QuestionView>> {
    return this.http.post<ApiResponse<QuestionView>>(`${this.base}/questions`, payload, this.options());
  }
  updateQuestion(id: number, payload: QuestionInput): Observable<ApiResponse<QuestionView>> {
    return this.http.put<ApiResponse<QuestionView>>(`${this.base}/questions/${id}`, payload, this.options());
  }
  deleteQuestion(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/questions/${id}`, this.options());
  }
  previewImport(file: File): Observable<ApiResponse<QuestionImportPreview>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<QuestionImportPreview>>(`${this.base}/questions/import/preview`, formData, this.options());
  }
  saveImport(payload: { courseId: number; subjectId: number; topicId: number | null; questions: QuestionImportDraft[] }): Observable<ApiResponse<QuestionView[]>> {
    return this.http.post<ApiResponse<QuestionView[]>>(`${this.base}/questions/import/save`, payload, this.options());
  }

  getTests(): Observable<ApiResponse<TestSummary[]>> {
    return this.http.get<ApiResponse<TestSummary[]>>(`${this.base}/tests`, this.options());
  }
  getTest(id: number): Observable<ApiResponse<TestDetail>> {
    return this.http.get<ApiResponse<TestDetail>>(`${this.base}/tests/manage/${id}`, this.options());
  }
  createTest(payload: TestInput): Observable<ApiResponse<TestDetail>> {
    return this.http.post<ApiResponse<TestDetail>>(`${this.base}/tests`, payload, this.options());
  }
  updateTest(id: number, payload: TestInput): Observable<ApiResponse<TestDetail>> {
    return this.http.put<ApiResponse<TestDetail>>(`${this.base}/tests/${id}`, payload, this.options());
  }
  publishTest(id: number): Observable<ApiResponse<TestSummary>> {
    return this.http.post<ApiResponse<TestSummary>>(`${this.base}/tests/${id}/publish`, {}, this.options());
  }
  deleteTest(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/tests/${id}`, this.options());
  }
  startAttempt(testId: number): Observable<ApiResponse<AttemptStart>> {
    return this.http.post<ApiResponse<AttemptStart>>(`${this.base}/tests/${testId}/attempts`, {}, this.options());
  }
  saveAnswers(testId: number, attemptId: number, answers: Record<number, string>): Observable<ApiResponse<AttemptResult>> {
    return this.http.put<ApiResponse<AttemptResult>>(`${this.base}/tests/${testId}/attempts/${attemptId}`, { answers }, this.options());
  }
  submitAttempt(testId: number, attemptId: number): Observable<ApiResponse<AttemptResult>> {
    return this.http.post<ApiResponse<AttemptResult>>(`${this.base}/tests/${testId}/attempts/${attemptId}/submit`, {}, this.options());
  }
}
