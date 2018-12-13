import { NgModule } from '@angular/core';

import { DecimalPipe } from '@angular/common';

import {
  ActionSheetProvider,
  AddressBookProvider,
  AddressProvider,
  AndroidFingerprintAuth,
  AppIdentityProvider,
  AppProvider,
  BackupProvider,
  BitPayAccountProvider,
  BitPayCardProvider,
  BitPayProvider,
  BwcErrorProvider,
  BwcProvider,
  Clipboard,
  ClipboardProvider,
  CoinbaseProvider,
  ConfigProvider,
  DerivationPathHelperProvider,
  Device,
  DomProvider,
  DownloadProvider,
  ElectronProvider,
  EmailNotificationsProvider,
  ExternalLinkProvider,
  FCM,
  FeedbackProvider,
  FeeProvider,
  File,
  FilterProvider,
  GiftCardProvider,
  GlideraProvider,
  HomeIntegrationsProvider,
  IncomingDataProvider,
  LanguageProvider,
  LaunchReview,
  Logger,
  OnGoingProcessProvider,
  PayproProvider,
  PersistenceProvider,
  PlatformProvider,
  PopupProvider,
  Printer,
  ProfileProvider,
  PushNotificationsProvider,
  QRScanner,
  RateProvider,
  ReplaceParametersProvider,
  ScanProvider,
  ScreenOrientation,
  ShapeshiftProvider,
  SocialSharing,
  SplashScreen,
  StatusBar,
  TimeProvider,
  Toast,
  TouchID,
  TouchIdProvider,
  TxConfirmNotificationProvider,
  TxFormatProvider,
  UserAgent,
  Vibration,
  WalletProvider,
  WalletTabsProvider
} from './index';

@NgModule({
  providers: [
    ActionSheetProvider,
    AddressProvider,
    AddressBookProvider,
    AndroidFingerprintAuth,
    AppProvider,
    AppIdentityProvider,
    BackupProvider,
    BitPayProvider,
    BitPayCardProvider,
    BitPayAccountProvider,
    BwcProvider,
    BwcErrorProvider,
    ConfigProvider,
    CoinbaseProvider,
    Clipboard,
    ClipboardProvider,
    DerivationPathHelperProvider,
    Device,
    DomProvider,
    DownloadProvider,
    ExternalLinkProvider,
    FeedbackProvider,
    FCM,
    HomeIntegrationsProvider,
    FeeProvider,
    GiftCardProvider,
    GlideraProvider,
    IncomingDataProvider,
    LanguageProvider,
    LaunchReview,
    Logger,
    ElectronProvider,
    OnGoingProcessProvider,
    PayproProvider,
    PlatformProvider,
    Printer,
    ProfileProvider,
    PopupProvider,
    QRScanner,
    PushNotificationsProvider,
    RateProvider,
    ReplaceParametersProvider,
    ShapeshiftProvider,
    StatusBar,
    SplashScreen,
    ScanProvider,
    ScreenOrientation,
    SocialSharing,
    Toast,
    TouchID,
    Vibration,
    TimeProvider,
    TouchIdProvider,
    TxConfirmNotificationProvider,
    FilterProvider,
    TxFormatProvider,
    UserAgent,
    WalletProvider,
    EmailNotificationsProvider,
    DecimalPipe,
    PersistenceProvider,
    File,
    WalletTabsProvider
  ]
})
export class ProvidersModule {}
