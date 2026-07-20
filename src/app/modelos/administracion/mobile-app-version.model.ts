export interface MobileAppVersion {
  id?: number;
  packageName?: string;
  versionName?: string;
  versionCode?: number;
  descripcion?: string;
  forceUpdate?: boolean;
  activo?: boolean;
  archivoNombre?: string;
  archivoRuta?: string;
  contentType?: string;
  sizeBytes?: number;
  checksumSha256?: string;
  entorno?: string;
  hostName?: string;
  feccrea?: string;
  downloadUrl?: string;
}
