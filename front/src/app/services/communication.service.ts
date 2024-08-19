// communication.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private stopTestSubject = new Subject<number>();
  stopTest$ = this.stopTestSubject.asObservable();

  triggerStopTest(featureId: number) {
    console.log('Emitiendo stopTest con featureId:', featureId);
    this.stopTestSubject.next(featureId);
  }
}