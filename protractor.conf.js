exports.config = {
  allScriptsTimeout: 11000,
  specs: ['./e2e/**/*.e2e-spec.ts'],
  // Available deviceNames for mobileEmulation: https://chromium.googlesource.com/chromium/src/+/master/third_party/WebKit/Source/devtools/front_end/emulated_devices/module.json
  multiCapabilities: [
    {
      browserName: 'chrome',
      chromeOptions: {
        args: [
          '--headless',
          '--high-dpi-support=1',
          '--force-device-scale-factor=2',
          '--window-size=1024,720'
        ]
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        args: [
          '--headless',
          '--high-dpi-support=1',
          '--force-device-scale-factor=2',
          '--window-size=800,600'
        ]
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        args: [
          '--headless',
          '--high-dpi-support=1',
          '--force-device-scale-factor=2',
          '--window-size=1920,1080'
        ]
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPhone X'
        },
        args: ['--headless']
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPhone 8'
        },
        args: ['--headless']
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPad'
        },
        args: ['--headless']
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'iPad Pro'
        },
        args: ['--headless']
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'Nexus 6P'
        },
        args: ['--headless']
      }
    },
    {
      browserName: 'chrome',
      chromeOptions: {
        mobileEmulation: {
          deviceName: 'Nexus 5X'
        },
        args: ['--headless']
      }
    }
  ],
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  useAllAngular2AppRoots: true,
  beforeLaunch: function() {
    require('connect')()
      .use(require('serve-static')('www'))
      .listen(4200);
  },
  onPrepare() {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
    var jasmineReporters = require('jasmine-reporters');
    jasmine.getEnv().addReporter(
      new jasmineReporters.TerminalReporter({
        verbosity: 3,
        color: true,
        showStack: true
      })
    );
    jasmine.getEnv().addReporter(
      new jasmineReporters.JUnitXmlReporter({
        savePath: process.env.JUNIT_REPORT_PATH,
        outputFile: process.env.JUNIT_REPORT_NAME,
        consolidateAll: true
      })
    );
  }
};
