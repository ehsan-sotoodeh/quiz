import { Routes } from '@angular/router';

import { QuizComponent } from './pages/quiz/quiz.component';

export const routes: Routes = [
  {
    path: '',
    component: QuizComponent
  },
  {
    path: 'quiz',
    component: QuizComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
