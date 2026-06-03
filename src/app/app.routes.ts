import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { QuizComponent } from './pages/quiz/quiz.component';
import { ReportComponent } from './pages/report/report.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'quiz',
    component: QuizComponent
  },
  {
    path: 'report',
    component: ReportComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
