import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Quiz, QuizAnswer, QuizQuestion, QuizResult, UserAnswer } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { QuizSessionService } from '../../services/quiz-session.service';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit {
  quiz: Quiz | null = null;
  currentQuestionIndex = 0;
  userAnswers: UserAnswer[] = [];
  loading = true;
  errorMessage: string | null = null;
  hasStarted = false;

  private readonly quizService = inject(QuizService);
  private readonly quizSession = inject(QuizSessionService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const sessionQuiz = this.quizSession.getQuiz();

    if (sessionQuiz) {
      this.quiz = sessionQuiz;
      this.userAnswers = this.quizSession.getUserAnswers();
      this.hasStarted = this.userAnswers.length > 0;
      this.loading = false;
      return;
    }

    this.quizService.loadDefaultQuiz().subscribe({
      next: (quiz) => {
        this.quizSession.setQuiz(quiz);
        this.quiz = quiz;
        this.userAnswers = [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load the default quiz. You can upload a quiz from the home page.';
        this.loading = false;
      }
    });
  }

  get currentQuestion(): QuizQuestion | null {
    return this.quiz?.questions[this.currentQuestionIndex] ?? null;
  }

  get isLastQuestion(): boolean {
    if (!this.quiz) {
      return false;
    }

    return this.currentQuestionIndex === this.quiz.questions.length - 1;
  }

  get quizValidationMessage(): string | null {
    if (!this.quiz) {
      return null;
    }

    if (this.quiz.questions.length === 0) {
      return 'This quiz does not have any questions yet.';
    }

    const questionWithoutAnswers = this.quiz.questions.find((question) => question.answers.length === 0);

    if (questionWithoutAnswers) {
      return `Question "${questionWithoutAnswers.question}" does not have any answers yet.`;
    }

    const questionWithoutCorrectAnswer = this.quiz.questions.find(
      (question) => !question.answers.some((answer) => answer.status === 'correct')
    );

    if (questionWithoutCorrectAnswer) {
      return `Question "${questionWithoutCorrectAnswer.question}" does not have a correct answer configured.`;
    }

    return null;
  }

  get selectedAnswerId(): string | null {
    const question = this.currentQuestion;

    if (!question) {
      return null;
    }

    return this.getUserAnswer(question.id)?.selectedAnswerId ?? null;
  }

  selectAnswer(answerId: string): void {
    const question = this.currentQuestion;

    if (!question || !question.answers.some((answer) => answer.id === answerId)) {
      return;
    }

    const existingAnswer = this.getUserAnswer(question.id);

    if (existingAnswer) {
      existingAnswer.selectedAnswerId = answerId;
    } else {
      this.userAnswers.push({
        questionId: question.id,
        selectedAnswerId: answerId
      });
    }

    this.quizSession.setUserAnswers(this.userAnswers);
  }

  getUserAnswer(questionId: string): UserAnswer | undefined {
    return this.userAnswers.find((answer) => answer.questionId === questionId);
  }

  hasSelectedCurrentQuestion(): boolean {
    return this.selectedAnswerId !== null;
  }

  startQuiz(): void {
    if (!this.quiz || this.quizValidationMessage) {
      return;
    }

    this.errorMessage = null;
    this.hasStarted = true;
  }

  goToPreviousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex -= 1;
    }
  }

  goToNextQuestion(): void {
    if (!this.quiz || !this.hasSelectedCurrentQuestion()) {
      return;
    }

    const nextQuestionIndex = this.currentQuestionIndex + 1;

    if (nextQuestionIndex < this.quiz.questions.length) {
      this.currentQuestionIndex = nextQuestionIndex;
    }
  }

  getProgressPercentage(): number {
    if (!this.quiz || this.quiz.questions.length === 0) {
      return 0;
    }

    return ((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100;
  }

  finishQuiz(): void {
    if (!this.quiz || !this.isLastQuestion || !this.hasSelectedCurrentQuestion()) {
      return;
    }

    try {
      const result = this.calculateResult();
      this.quizSession.setQuizResult(result);
      void this.router.navigate(['/report']);
    } catch {
      this.errorMessage = 'Unable to calculate the quiz result. Please check the quiz data.';
    }
  }

  calculateResult(): QuizResult {
    if (!this.quiz) {
      throw new Error('Cannot calculate result before the quiz is loaded.');
    }

    const questionResults = this.quiz.questions.map((question) => {
      const userAnswer = this.getUserAnswer(question.id);
      const selectedAnswer = userAnswer
        ? question.answers.find((answer) => answer.id === userAnswer.selectedAnswerId)
        : undefined;
      const correctAnswer = this.getCorrectAnswer(question.answers);
      const isCorrect = selectedAnswer?.status === 'correct';

      return {
        questionId: question.id,
        question: question.question,
        selectedAnswerId: userAnswer?.selectedAnswerId ?? null,
        selectedAnswerText: selectedAnswer?.answer ?? null,
        correctAnswerId: correctAnswer.id,
        correctAnswerText: correctAnswer.answer,
        isCorrect,
        explanation: selectedAnswer?.explanation ?? null
      };
    });

    const totalQuestions = this.quiz.questions.length;
    const correctAnswers = questionResults.filter((result) => result.isCorrect).length;

    return {
      quizId: this.quiz.id,
      quizTitle: this.quiz.title,
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      scorePercentage: totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100),
      questionResults
    };
  }

  private getCorrectAnswer(answers: QuizAnswer[]): QuizAnswer {
    const correctAnswer = answers.find((answer) => answer.status === 'correct');

    if (!correctAnswer) {
      throw new Error('Quiz question is missing a correct answer.');
    }

    return correctAnswer;
  }
}
