export interface VideoWatermarkTextOptions {
  text: string;
  fontPath: string;
  fontSize: number;
  fontColor: string;
  position: { x: number; y: number }; // Or a string like 'top-left', 'center', etc.
}

export interface VideoWatermarkImageOptions {
  imagePath: string;
  position: { x: number; y: number }; // Or a string like 'top-left', 'center', etc.
  scale?: number; // Optional scaling for the image watermark
}

export interface VideoToolOptions {
  watermark?: {
    type: 'text' | 'image';
    options: VideoWatermarkTextOptions | VideoWatermarkImageOptions;
  };
  outputPath: string; // Directory to save the output video
  outputFileName?: string; // Optional custom output file name
}
