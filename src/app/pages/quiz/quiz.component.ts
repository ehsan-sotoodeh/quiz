import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { Quiz, QuizAnswer, QuizQuestion, QuizResult, UserAnswer } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-quiz',
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent {
  quiz: Quiz | null = null;
  currentQuestionIndex = 0;
  userAnswers: UserAnswer[] = [];
  loading = false;
  errorMessage: string | null = null;
  selectedFileName: string | null = null;
  hasStarted = false;
  isFinished = false;
  quizResult: QuizResult | null = null;

  private readonly quizService = inject(QuizService);

  async onQuizFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.selectedFileName = file.name;

    try {
      this.quiz = await this.quizService.loadQuizFromFile(file);
      this.resetQuizProgress(false);
    } catch (error) {
      this.quiz = null;
      this.selectedFileName = null;
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Unable to read the selected quiz file.';
    } finally {
      this.loading = false;
      input.value = '';
    }
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
      return;
    }

    this.userAnswers.push({
      questionId: question.id,
      selectedAnswerId: answerId
    });
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
      this.quizResult = this.calculateResult();
      this.isFinished = true;
    } catch {
      this.errorMessage = 'Unable to calculate the quiz result. Please check the quiz data.';
    }
  }

  restartQuiz(): void {
    this.resetQuizProgress(true);
  }

  clearQuiz(): void {
    this.quiz = null;
    this.selectedFileName = null;
    this.errorMessage = null;
    this.resetQuizProgress(false);
  }

  private resetQuizProgress(hasStarted: boolean): void {
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.hasStarted = hasStarted;
    this.isFinished = false;
    this.quizResult = null;
    this.errorMessage = null;
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
