import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { QuizSessionService } from '../../services/quiz-session.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly samplePrompt = 'Generate a quiz JSON object with this structure: id, title, questions. Each question must have id, question, answers. Each answer must have id, answer, status as correct or incorrect, and explanation. Create 10 questions about Angular basics. Return only valid JSON.';

  uploadSuccessMessage: string | null = null;
  uploadErrorMessage: string | null = null;
  copyMessage: string | null = null;

  private readonly quizService = inject(QuizService);
  private readonly quizSession = inject(QuizSessionService);

  onQuizFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.uploadSuccessMessage = null;
    this.uploadErrorMessage = null;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const fileContents = typeof reader.result === 'string' ? reader.result : '';
        const parsedQuiz: unknown = JSON.parse(fileContents);

        this.validateBasicQuizShape(parsedQuiz);

        const quiz = this.quizService.parseQuizData(parsedQuiz);
        this.quizSession.setQuiz(quiz);
        this.uploadSuccessMessage = `"${quiz.title}" is ready.`;
      } catch (error) {
        this.quizSession.resetSession();
        this.uploadErrorMessage = error instanceof Error
          ? error.message
          : 'Unable to read the selected quiz file.';
      } finally {
        input.value = '';
      }
    };

    reader.onerror = () => {
      this.uploadErrorMessage = 'Unable to read the selected quiz file.';
      input.value = '';
    };

    reader.readAsText(file);
  }

  async copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.samplePrompt);
      this.copyMessage = 'Copied!';
    } catch {
      this.copyMessage = 'Copy failed.';
    }
  }

  private validateBasicQuizShape(value: unknown): asserts value is Quiz {
    if (!this.isRecord(value)) {
      throw new Error('Quiz JSON must be an object.');
    }

    if (typeof value['id'] !== 'string' || value['id'].trim().length === 0) {
      throw new Error('Quiz JSON must include an id.');
    }

    if (typeof value['title'] !== 'string' || value['title'].trim().length === 0) {
      throw new Error('Quiz JSON must include a title.');
    }

    if (!Array.isArray(value['questions'])) {
      throw new Error('Quiz JSON must include a questions array.');
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
