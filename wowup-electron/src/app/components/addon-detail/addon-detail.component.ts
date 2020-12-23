import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { first } from "lodash";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { BehaviorSubject, from, Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AddonChannelType } from "../../models/wowup/addon-channel-type";
import { AddonDependencyType } from "../../models/wowup/addon-dependency-type";
import { AddonSearchResultDependency } from "../../models/wowup/addon-search-result-dependency";
import * as SearchResult from "../../utils/search-result.utils";
import { AddonViewModel } from "../../business-objects/my-addon-list-item";
import { AddonSearchResult } from "../../models/wowup/addon-search-result";
import { AddonService } from "../../services/addons/addon.service";
import { ADDON_PROVIDER_UNKNOWN } from "../../../common/constants";
import { capitalizeString } from "../../utils/string.utils";
import { ElectronService } from "../../services";

export interface AddonDetailModel {
  listItem?: AddonViewModel;
  searchResult?: AddonSearchResult;
  channelType?: AddonChannelType;
}

@Component({
  selector: "app-addon-detail",
  templateUrl: "./addon-detail.component.html",
  styleUrls: ["./addon-detail.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddonDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild("descriptionContainer", { read: ElementRef }) descriptionContainer: ElementRef;
  @ViewChild("changelogContainer", { read: ElementRef }) changelogContainer: ElementRef;

  private readonly _subscriptions: Subscription[] = [];
  private readonly _dependencies: AddonSearchResultDependency[];
  private readonly _changelogSrc = new BehaviorSubject<string>("");

  public readonly changelog$ = this._changelogSrc.asObservable();
  public readonly capitalizeString = capitalizeString;

  constructor(
    @Inject(MAT_DIALOG_DATA) public model: AddonDetailModel,
    private _addonService: AddonService,
    private _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    private _electronService: ElectronService
  ) {
    this._dependencies = this.getDependencies();

    this._subscriptions.push(
      this._addonService.addonInstalled$
        .pipe(
          filter(
            (evt) =>
              evt.addon.id === this.model.listItem?.addon.id ||
              evt.addon.externalId === this.model.searchResult?.externalId
          )
        )
        .subscribe((evt) => {
          if (this.model.listItem) {
            this.model.listItem.addon = evt.addon;
            this.model.listItem.installState = evt.installState;
          }

          this._cdRef.detectChanges();
        }),
      from(this.getChangelog()).subscribe((changelog) => this._changelogSrc.next(changelog))
    );
  }

  ngOnInit(): void {}

  ngAfterViewChecked() {
    const descriptionContainer: HTMLDivElement = this.descriptionContainer?.nativeElement;
    const changelogContainer: HTMLDivElement = this.changelogContainer?.nativeElement;
    this.formatLinks(descriptionContainer);
    this.formatLinks(changelogContainer);
  }

  formatLinks(container: HTMLDivElement) {
    if (!container) {
      return;
    }

    const aTags = container.getElementsByTagName("a");
    for (let tag of Array.from(aTags)) {
      if (tag.getAttribute("clk")) {
        continue;
      }

      tag.setAttribute("clk", "1");
      tag.addEventListener("click", this.onOpenLink, false);
    }
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onOpenLink = (e: MouseEvent) => {
    e.preventDefault();

    // Go up the call chain to find the tag
    const path = (e as any).path as HTMLElement[];
    let anchor: HTMLAnchorElement = undefined;
    for (let element of path) {
      if (element.tagName !== "A") {
        continue;
      }

      anchor = element as HTMLAnchorElement;
      break;
    }

    if (!anchor) {
      console.warn("No anchor in path");
      return false;
    }

    this._electronService.shell.openExternal(anchor.href);
    return false;
  };

  isUnknownProvider() {
    return this.model.listItem?.addon?.providerName === ADDON_PROVIDER_UNKNOWN;
  }

  isMissingUnknownDependencies() {
    return this.model.listItem?.addon?.missingDependencies.length;
  }

  getMissingDependencies() {
    return this.model.listItem?.addon?.missingDependencies ?? [];
  }

  hasChangelog() {
    return !!this.model.listItem?.addon?.latestChangelog;
  }

  getDescription() {
    const summary = this.model.listItem?.addon?.summary || this.model.searchResult?.summary || "";

    const dom = new DOMParser().parseFromString(summary, "text/html");
    const aTags = dom.getElementsByTagName("a");
    for (let tag of Array.from(aTags)) {
      // tag.setAttribute("appExternalLink", "");
    }

    return summary;
  }

  async getChangelog() {
    if (this.model.listItem) {
      return await this.getMyAddonChangelog();
    } else if (this.model.searchResult) {
      return await this.getSearchResultChangelog();
    }

    return "";
  }

  private async getSearchResultChangelog() {
    const file = first(this.model.searchResult.files);
    const latestVersion = file.version;
    let changelog = file.changelog;
    if (!changelog) {
      changelog = await this._addonService.getChangelog(this.model.listItem?.addon);
    }

    return changelog;
  }

  private async getMyAddonChangelog() {
    const changelogVersion = this.model.listItem?.addon?.latestChangelogVersion;
    const latestVersion = this.model.listItem?.addon?.latestVersion;
    let changelog = this.model.listItem?.addon?.latestChangelog;
    console.debug(changelogVersion, latestVersion);
    if (!changelog || changelogVersion !== latestVersion) {
      changelog = await this._addonService.getChangelog(this.model.listItem?.addon);
    }

    return changelog;
  }

  get statusText() {
    if (!this.model.listItem) {
      return "";
    }

    if (this.model.listItem.isUpToDate) {
      return this._translateService.instant("COMMON.ADDON_STATE.UPTODATE");
    }

    return "";
  }

  get showInstallButton() {
    return !!this.model.searchResult;
  }

  get showUpdateButton() {
    return this.model.listItem;
  }

  get title() {
    return this.model.listItem?.addon?.name || this.model.searchResult?.name || "UNKNOWN";
  }

  get subtitle() {
    return this.model.listItem?.addon?.author || this.model.searchResult?.author || "UNKNOWN";
  }

  get provider() {
    return this.model.listItem?.addon?.providerName || this.model.searchResult?.providerName || "UNKNOWN";
  }

  get summary() {
    return this.model.listItem?.addon?.summary || this.model.searchResult?.summary || "";
  }

  get externalUrl() {
    return this.model.listItem?.addon?.externalUrl || this.model.searchResult?.externalUrl || "UNKNOWN";
  }

  get defaultImageUrl(): string {
    if (this.model.listItem?.addon) {
      // if (this.model.listItem?.addon?.screenshotUrls?.length) {
      //   return this.model.listItem?.addon.screenshotUrls[0];
      // }
      return this.model.listItem?.addon.thumbnailUrl || "";
    }

    if (this.model.searchResult) {
      // if (this.model.searchResult?.screenshotUrls?.length) {
      //   return this.model.searchResult.screenshotUrls[0];
      // }
      return this.model.searchResult?.thumbnailUrl || "";
    }

    return "";
  }

  onInstallUpdated() {
    this._cdRef.detectChanges();
  }

  getDependencies() {
    if (this.model.searchResult) {
      return SearchResult.getDependencyType(
        this.model.searchResult,
        this.model.channelType,
        AddonDependencyType.Required
      );
    } else if (this.model.listItem) {
      return this.model.listItem.getDependencies(AddonDependencyType.Required);
    }

    return [];
  }

  hasRequiredDependencies() {
    return this._dependencies.length > 0;
  }

  getRequiredDependencyCount() {
    return this._dependencies.length;
  }

  getVersion() {
    return this.model.searchResult
      ? this.getLatestSearchResultFile().version
      : this.model.listItem.addon.installedVersion;
  }

  getFundingLinks() {
    return this.model.listItem?.addon?.fundingLinks;
  }

  hasFundingLinks() {
    return !!this.model.listItem?.addon?.fundingLinks?.length;
  }

  getExternalId() {
    return this.model.searchResult ? this.model.searchResult.externalId : this.model.listItem.addon.externalId;
  }

  private getLatestSearchResultFile() {
    return SearchResult.getLatestFile(this.model.searchResult, this.model.channelType);
  }
}
