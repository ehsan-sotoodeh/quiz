import { Injectable } from '@angular/core';

import { Quiz, QuizResult, UserAnswer } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizSessionService {
  private quiz: Quiz | null = null;
  private userAnswers: UserAnswer[] = [];
  private quizResult: QuizResult | null = null;

  setQuiz(quiz: Quiz): void {
    this.quiz = quiz;
    this.userAnswers = [];
    this.quizResult = null;
  }

  getQuiz(): Quiz | null {
    return this.quiz;
  }

  setUserAnswers(answers: UserAnswer[]): void {
    this.userAnswers = answers.map((answer) => ({ ...answer }));
  }

  getUserAnswers(): UserAnswer[] {
    return this.userAnswers.map((answer) => ({ ...answer }));
  }

  setQuizResult(result: QuizResult): void {
    this.quizResult = result;
  }

  getQuizResult(): QuizResult | null {
    return this.quizResult;
  }

  resetProgress(): void {
    this.userAnswers = [];
    this.quizResult = null;
  }

  resetSession(): void {
    this.quiz = null;
    this.userAnswers = [];
    this.quizResult = null;
  }
}
