import { Injectable } from '@angular/core';

import { AnswerStatus, Quiz, QuizAnswer, QuizQuestion } from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  async loadQuizFromFile(file: File): Promise<Quiz> {
    const fileContents = await file.text();
    const parsedQuiz: unknown = JSON.parse(fileContents);

    return this.parseQuiz(parsedQuiz);
  }

  private parseQuiz(value: unknown): Quiz {
    if (!this.isRecord(value)) {
      throw new Error('Quiz file must contain a JSON object.');
    }

    const id = this.getRequiredString(value, 'id');
    const title = this.getRequiredString(value, 'title');
    const questionsValue = value['questions'];

    if (!Array.isArray(questionsValue)) {
      throw new Error('Quiz file must include a questions array.');
    }

    return {
      id,
      title,
      questions: questionsValue.map((question, index) => this.parseQuestion(question, index))
    };
  }

  private parseQuestion(value: unknown, index: number): QuizQuestion {
    if (!this.isRecord(value)) {
      throw new Error(`Question ${index + 1} must be a JSON object.`);
    }

    const id = this.getRequiredString(value, 'id');
    const question = this.getRequiredString(value, 'question');
    const answersValue = value['answers'];

    if (!Array.isArray(answersValue)) {
      throw new Error(`Question "${question}" must include an answers array.`);
    }

    return {
      id,
      question,
      answers: answersValue.map((answer, answerIndex) => this.parseAnswer(answer, question, answerIndex))
    };
  }

  private parseAnswer(value: unknown, question: string, index: number): QuizAnswer {
    if (!this.isRecord(value)) {
      throw new Error(`Answer ${index + 1} for question "${question}" must be a JSON object.`);
    }

    const id = this.getRequiredString(value, 'id');
    const answer = this.getRequiredString(value, 'answer');
    const statusValue = value['status'];
    const explanation = this.getRequiredString(value, 'explanation');

    if (!this.isAnswerStatus(statusValue)) {
      throw new Error(`Answer "${answer}" must have status "correct" or "incorrect".`);
    }

    return {
      id,
      answer,
      status: statusValue,
      explanation
    };
  }

  private getRequiredString(value: Record<string, unknown>, key: string): string {
    const propertyValue = value[key];

    if (typeof propertyValue !== 'string' || propertyValue.trim().length === 0) {
      throw new Error(`Quiz file has a missing or invalid "${key}" field.`);
    }

    return propertyValue;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isAnswerStatus(value: unknown): value is AnswerStatus {
    return value === 'correct' || value === 'incorrect';
  }
}
