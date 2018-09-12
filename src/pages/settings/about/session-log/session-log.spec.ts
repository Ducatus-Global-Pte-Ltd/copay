import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestUtils } from '../../../../test';

import { ModalMock } from 'ionic-mocks';
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { SessionLogPage } from './session-log';

// Providers
import { PersistenceProvider } from '../../../../providers/persistence/persistence';

describe('SessionLogPage', () => {
  let fixture: ComponentFixture<SessionLogPage>;
  let instance;
  let testBed: typeof TestBed;
  let persistenceProvider: PersistenceProvider;

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([SessionLogPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      testBed = testEnv.testBed;
      fixture.detectChanges();

      persistenceProvider = testBed.get(PersistenceProvider);
      persistenceProvider.load();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should set correct filter value when config has log weight', () => {
        spyOn(instance.logger, 'getWeight').and.returnValue({ weight: 21 });

        instance.config = {
          log: {
            weight: 100
          }
        };

        instance.ionViewWillEnter();
        expect(instance.filterValue).toEqual(21);
      });
      it('should set default filter value when config does not have log weight', () => {
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.filterValue).toEqual(10);
      });
      it('should call setOptionSelected with correct param', () => {
        spyOn(instance, 'setOptionSelected');
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.setOptionSelected).toHaveBeenCalledWith(10);
      });
      it('should call filterLogs with correct param', () => {
        spyOn(instance, 'filterLogs');
        spyOn(instance.logger, 'getDefaultWeight').and.returnValue({
          weight: 10
        });

        instance.config = {};

        instance.ionViewWillEnter();

        expect(instance.filterLogs).toHaveBeenCalledWith(10);
      });
    });
    describe('ionViewDidLoad', () => {
      it('should log debug info', () => {
        spyOn(instance.logger, 'info');
        instance.ionViewDidLoad();
        expect(instance.logger.info).toHaveBeenCalledWith(
          'ionViewDidLoad SessionLogPage'
        );
      });
    });
  });
  describe('Methods', () => {
    describe('#filterLogs', () => {
      it('should set filtered logs correctly', () => {
        spyOn(instance.logger, 'get').and.returnValue({
          weight: 10
        });
        instance.filterLogs(21);
        expect(instance.logger.get).toHaveBeenCalledWith(21);
        expect(instance.filteredLogs).toEqual([10]);
      });
    });
    describe('#setOptionSelected', () => {
      it('should call filterLogs with correct param', () => {
        spyOn(instance, 'filterLogs');

        instance.setOptionSelected(21);

        expect(instance.filterLogs).toHaveBeenCalledWith(21);
      });
      it('should set config with correct opts', () => {
        spyOn(instance.configProvider, 'set');
        const opts = {
          log: {
            weight: 10
          }
        };

        instance.setOptionSelected(10);

        expect(instance.configProvider.set).toHaveBeenCalledWith(opts);
      });
    });
    describe('#preparePersistenceLogs', () => {
      it('should return correct log from persistence provider', () => {
        let promise = Promise.resolve({
          '01/07/2008': {
            level: 1,
            msg: 'msg',
            timestamp: '01/07/2008'
          }
        });
        spyOn(persistenceProvider, 'getLogs').and.returnValue(promise);

        instance.preparePersistenceLogs().then(logs => {
          expect(logs).toEqual(
            'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n\n\n[01/07/2008][1]msg\n'
          );
        });
      });
    });
    describe('#sendLogs', () => {
      it('should send logs', () => {
        let promise = Promise.resolve(
          'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n\n\n[01/07/2008][1]msg\n'
        );

        spyOn(instance, 'preparePersistenceLogs').and.returnValue(promise);
        spyOn(instance.socialSharing, 'shareViaEmail');

        instance.sendLogs();

        expect(instance.preparePersistenceLogs).toHaveBeenCalled();
      });
    });
    describe('#showOptionsMenu', () => {
      it('should create actionSheet', () => {
        instance.showOptionsMenu();

        expect(instance.actionSheetCtrl.create).toHaveBeenCalled();
      });
    });
    describe('#showWarningModal', () => {
      it('should create warning modal', () => {
        const actionSheetProvider: ActionSheetProvider = testBed.get(
          ActionSheetProvider
        );
        const modal = ModalMock.instance();
        spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue(modal);
        instance.showWarningModal();
        expect(modal.present).toHaveBeenCalled();
        expect(modal.onDidDismiss).toHaveBeenCalled();
      });
    });
  });
});
