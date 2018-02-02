import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import * as _ from "lodash";

//providers
import { ConfigProvider } from '../../../providers/config/config';
import { AppProvider } from '../../../providers/app/app';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { PopupProvider } from '../../../providers/popup/popup';

//pages
import { FeedbackCompletePage } from '../feedback-complete/feedback-complete';
import { HomePage } from '../../home/home';


@Component({
  selector: 'page-send-feedback',
  templateUrl: 'send-feedback.html',
})
export class SendFeedbackPage {

  public feedback: string;
  public score: number;
  public reaction: string;
  public comment: string;
  public justFeedback: boolean;
  public appName: string;
  public feedbackForm: FormGroup;

  constructor(
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private appProvider: AppProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private feedbackProvider: FeedbackProvider,
    private formBuilder: FormBuilder,
    private popupProvider: PopupProvider,
    private translate: TranslateService
  ) {
    this.feedbackForm = this.formBuilder.group({
      comment: ['', Validators.compose([Validators.minLength(1), Validators.required])]
    });
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewWillEnter() {

    switch (this.score) {
      case 1:
        this.reaction = this.translate.instant("Ouch!");
        this.comment = this.translate.instant("There's obviously something we're doing wrong. How could we improve your experience?");
        break;
      case 2:
        this.reaction = this.translate.instant("Oh no!");
        this.comment = this.translate.instant("There's obviously something we're doing wrong. How could we improve your experience?");
        break;
      case 3:
        this.reaction = this.translate.instant("Hmm...");
        this.comment = this.translate.instant("We'd love to do better. How could we improve your experience?");
        break;
      case 4:
        this.reaction = this.translate.instant("Thanks!");
        this.comment = this.translate.instant("That's exciting to hear. We'd love to earn that fifth star from you – how could we improve your experience?");
        break;
      case 5:
        this.reaction = this.translate.instant("Thank you!");
        this.comment = this.translate.instant("We're always looking for ways to improve {{appName}}. Is there anything we could do better?", { appName: this.appName });
        break;
      default:
        this.justFeedback = true;
        this.comment = this.translate.instant("We're always looking for ways to improve {{appName}}. How could we improve your experience?", { appName: this.appName });
        break;
    }
  }

  public sendFeedback(feedback: string, goHome: boolean): void {

    let config: any = this.configProvider.get();

    let dataSrc = {
      "email": _.values(config.emailFor)[0] || ' ',
      "feedback": goHome ? ' ' : feedback,
      "score": this.score || ' ',
      "appVersion": this.appProvider.info.version,
      "platform": 'platform', //TODO ionic.Platform.platform()
      "deviceVersion": 'version' //TODO ionic.Platform.version()
    };

    if (!goHome) this.onGoingProcessProvider.set('sendingFeedback', true);
    this.feedbackProvider.send(dataSrc).then(() => {
      if (goHome) return;
      this.onGoingProcessProvider.set('sendingFeedback', false);
      if (!this.score) {
        let title = this.translate.instant('Thank you!');
        let message = this.translate.instant('A member of the team will review your feedback as soon as possible.');
        let okText = this.translate.instant('Finish');
        this.popupProvider.ionicAlert(title, message, okText).then(() => {
          this.feedback = '';
          this.navCtrl.pop();
        });
      }
      else {
        this.navCtrl.push(FeedbackCompletePage, { score: this.score })
      }
    }).catch((err) => {
      if (goHome) return;
      this.onGoingProcessProvider.set('sendingFeedback', false);
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Feedback could not be submitted. Please try again later.');
      this.popupProvider.ionicAlert(title, subtitle);
    });
    if (goHome) this.navCtrl.push(HomePage);
  }

  public goBack(): void {
    this.navCtrl.pop();
  }
}
