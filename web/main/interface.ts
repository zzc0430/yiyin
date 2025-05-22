import type { Exif } from '@modules/exiftool/interface';
import type { IConfig as Config } from '@src/interface';
import type { VideoWatermarkConfig } from '../store/config'; // Import the interface

export * from '@src/interface';

export interface IFileInfo {
  id?: string;
  path: string;
  name: string;
  type: 'image' | 'video'; // Added type
  progress?: number; // Added progress
}

export interface IConfig extends Pick<
  Config,
  'options' | 'tempFields' | 'customTempFields' | 'staticDir' | 'temps'
> {
  output: string;
  fontMap: Record<string, string>;
  fontDir: string;
  videoWatermark?: VideoWatermarkConfig; // Add videoWatermark to IConfig
}

export type TInputEvent = Event & {
  currentTarget: EventTarget & HTMLInputElement;
}

export interface ImgInfo extends IFileInfo {
  exif: Exif
  faild: boolean
  faildMsg: string
  // progress: number // progress is now in IFileInfo
  closeInterval: () => void
}
