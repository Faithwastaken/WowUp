export interface Toc {
  fileName: string;
  filePath: string;
  interface: string;
  title?: string;
  author?: string;
  website?: string;
  version?: string;
  partOf?: string;
  category?: string;
  localizations?: string;
  dependencies?: string;
  curseProjectId?: string;
  wowInterfaceId?: string;
  tukUiProjectId?: string;
  tukUiProjectFolders?: string;
  loadOnDemand?: string;
  dependencyList: string[];
  addonProvider?: string;
  notes?: string;
}
