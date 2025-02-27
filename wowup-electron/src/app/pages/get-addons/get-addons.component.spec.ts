import { TranslateMessageFormatCompiler } from "ngx-translate-messageformat-compiler";
import { BehaviorSubject, Subject } from "rxjs";

import { OverlayModule } from "@angular/cdk/overlay";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TranslateCompiler, TranslateLoader, TranslateModule } from "@ngx-translate/core";

import { httpLoaderFactory } from "../../app.module";
import { WowClientType } from "../../../common/warcraft/wow-client-type";
import { ElectronService } from "../../services";
import { AddonService } from "../../services/addons/addon.service";
import { SessionService } from "../../services/session/session.service";
import { WarcraftService } from "../../services/warcraft/warcraft.service";
import { WowUpService } from "../../services/wowup/wowup.service";
import { GetAddonsComponent } from "./get-addons.component";
import { overrideIconModule } from "../../tests/mock-mat-icon";
import { SnackbarService } from "../../services/snackbar/snackbar.service";
import { WarcraftInstallationService } from "../../services/warcraft/warcraft-installation.service";
import { DownloadCountPipe } from "../../pipes/download-count.pipe";
import { RelativeDurationPipe } from "../../pipes/relative-duration-pipe";
import { MatModule } from "../../modules/mat-module";

describe("GetAddonsComponent", () => {
  let component: GetAddonsComponent;
  let fixture: ComponentFixture<GetAddonsComponent>;
  let electronServiceSpy: any;
  let wowUpServiceSpy: any;
  let sessionServiceSpy: any;
  let addonServiceSpy: any;
  let warcraftServiceSpy: any;
  let snackbarService: SnackbarService;
  let warcraftInstallationService: WarcraftInstallationService;

  beforeEach(async () => {
    wowUpServiceSpy = jasmine.createSpyObj("WowUpService", [""], {
      getGetAddonsHiddenColumns: () => [],
    });
    sessionServiceSpy = jasmine.createSpyObj("SessionService", [""], {
      selectedHomeTab$: new BehaviorSubject(0).asObservable(),
    });
    warcraftServiceSpy = jasmine.createSpyObj("WarcraftService", [""], {
      installedClientTypesSelectItems$: new BehaviorSubject<WowClientType[] | undefined>(undefined).asObservable(),
    });
    electronServiceSpy = jasmine.createSpyObj("ElectronService", [""], {
      isWin: false,
      isLinux: true,
      isMac: false,
    });
    addonServiceSpy = jasmine.createSpyObj("AddonService", [""], {
      searchError$: new Subject<Error>(),
    });

    snackbarService = jasmine.createSpyObj("SnackbarService", [""], {});

    warcraftInstallationService = jasmine.createSpyObj("WarcraftInstallationService", [""], {
      wowInstallations$: new BehaviorSubject<any[]>([]),
    });

    let testBed = TestBed.configureTestingModule({
      declarations: [GetAddonsComponent, RelativeDurationPipe, DownloadCountPipe],
      imports: [
        MatModule,
        OverlayModule,
        BrowserAnimationsModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: httpLoaderFactory,
            deps: [HttpClient],
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler,
          },
        }),
      ],
      providers: [MatDialog, RelativeDurationPipe, DownloadCountPipe],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    testBed = overrideIconModule(testBed).overrideComponent(GetAddonsComponent, {
      set: {
        providers: [
          { provide: AddonService, useValue: addonServiceSpy },
          { provide: SessionService, useValue: sessionServiceSpy },
          { provide: WowUpService, useValue: wowUpServiceSpy },
          { provide: SnackbarService, useValue: snackbarService },
          { provide: ElectronService, useValue: electronServiceSpy },
          { provide: WarcraftService, useValue: warcraftServiceSpy },
          { provide: WarcraftInstallationService, useValue: warcraftInstallationService },
        ],
      },
    });

    await testBed.compileComponents();

    fixture = TestBed.createComponent(GetAddonsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.debugElement.nativeElement.remove();
    fixture.destroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
