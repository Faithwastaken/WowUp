import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TelemetryDialogComponent } from "./telemetry-dialog.component";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { TranslateCompiler, TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { httpLoaderFactory } from "../../app.module";
import { TranslateMessageFormatCompiler } from "ngx-translate-messageformat-compiler";

describe("TelemetryDialogComponent", () => {
  let component: TelemetryDialogComponent;
  let fixture: ComponentFixture<TelemetryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TelemetryDialogComponent],
      imports: [MatDialogModule, HttpClientModule, TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient],
        },
        compiler: {
          provide: TranslateCompiler,
          useClass: TranslateMessageFormatCompiler,
        },
      })],
      providers: [
        {provide: MatDialogRef, useValue: {} },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
