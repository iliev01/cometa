import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StopFeaturesService {
  private stopTestSubject = new Subject<number>();

  stopTest$ = this.stopTestSubject.asObservable();

  triggerStopTest(featureId: number) {
    this.stopTestSubject.next(featureId);
  }
}