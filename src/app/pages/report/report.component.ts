import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { QuizResult } from '../../models/quiz.model';
import { QuizSessionService } from '../../services/quiz-session.service';

@Component({
  selector: 'app-report',
  imports: [CommonModule, RouterLink],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent {
  private readonly quizSession = inject(QuizSessionService);
  private readonly router = inject(Router);

  get quizResult(): QuizResult | null {
    return this.quizSession.getQuizResult();
  }

  downloadReport(): void {
    const result = this.quizResult;

    if (!result) {
      return;
    }

    const report = {
      quizId: result.quizId,
      quizTitle: result.quizTitle,
      generatedAt: new Date().toISOString(),
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      scorePercentage: result.scorePercentage,
      questions: result.questionResults.map((questionResult) => ({
        questionId: questionResult.questionId,
        question: questionResult.question,
        selectedAnswerId: questionResult.selectedAnswerId,
        selectedAnswerText: questionResult.selectedAnswerText,
        correctAnswerId: questionResult.correctAnswerId,
        correctAnswerText: questionResult.correctAnswerText,
        isCorrect: questionResult.isCorrect,
        explanation: questionResult.explanation
      }))
    };

    const reportJson = JSON.stringify(report, null, 2);
    const blob = new Blob([reportJson], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `quiz-report-${this.getSafeFileName(result.quizId)}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  retakeQuiz(): void {
    this.quizSession.resetProgress();
    void this.router.navigate(['/quiz']);
  }

  private getSafeFileName(value: string): string {
    const safeValue = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');

    return safeValue.length > 0 ? safeValue : 'quiz';
  }
}
