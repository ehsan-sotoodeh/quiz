import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { QuizSessionService } from '../../services/quiz-session.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  topic = 'Angular components and routing';
  numberOfQuestions = 10;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'mixed' = 'medium';

  uploadSuccessMessage: string | null = null;
  uploadErrorMessage: string | null = null;
  copyMessage: string | null = null;

  private readonly quizService = inject(QuizService);
  private readonly quizSession = inject(QuizSessionService);

  get samplePrompt(): string {
    const topic = this.topic.trim() || 'Angular components and routing';
    const numberOfQuestions = this.numberOfQuestions > 0 ? this.numberOfQuestions : 10;

    return `Generate a quiz as a valid JSON object compatible with my Angular quiz app.

Topic: ${topic}
Number of questions: ${numberOfQuestions}
Difficulty level: ${this.difficultyLevel}

Return only valid JSON. Do not include markdown, explanations outside the JSON, comments, or code fences.

The JSON must follow this exact structure:

{
"id": "string-id-for-the-quiz",
"title": "Human readable quiz title",
"questions": [
{
"id": "q1",
"question": "Question text goes here",
"answers": [
{
"id": "q1-a1",
"answer": "Answer option text",
"status": "correct",
"explanation": "Explain why this answer is correct."
},
{
"id": "q1-a2",
"answer": "Answer option text",
"status": "incorrect",
"explanation": "Explain why this answer is incorrect."
}
]
}
]
}

Rules:

The root object must have exactly: id, title, questions.
questions must be an array.
Each question must have exactly: id, question, answers.
Each answer must have exactly: id, answer, status, explanation.
status must be either "correct" or "incorrect".
Each question must have exactly one answer with status "correct".
Each question should have 4 answer options.
All ids must be strings.
Use ids like q1, q2, q3 for questions.
Use ids like q1-a1, q1-a2, q1-a3, q1-a4 for answers.
Explanations must clearly explain why the selected answer is correct or incorrect.
Do not use trailing commas.
Do not include any text before or after the JSON.
Put inside a code block and a JSON file if possible.
`;
  }

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
