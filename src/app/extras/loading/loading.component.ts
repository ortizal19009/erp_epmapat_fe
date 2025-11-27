import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from 'src/app/servicios/loading.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent implements OnInit {
  frames = [
    'assets/img/loader1.png',
    'assets/img/loader2.png',
    'assets/img/loader3.png',

  ];
  currentFrame = this.frames[0];
  frameIndex = 0;
  intervalId: any;

  // isLoading: Observable<boolean>;
  isLoading$ = this.loadingService.isLoading$;

  constructor(private loadingService: LoadingService) { }

  ngOnInit(): void {
    //this.isLoading = this.loadingService.isLoading$;
    this.intervalId = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.currentFrame = this.frames[this.frameIndex];
    }, 350); // velocidad (en ms)
  }
  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
