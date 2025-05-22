import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import * as path from 'path';
import { VideoToolOptions, VideoWatermarkTextOptions, VideoWatermarkImageOptions } from './interface';

// It's good practice to allow users to specify the path to ffmpeg
// especially in packaged Electron apps.
// You might want to bundle ffmpeg or guide users to install it.
// For now, we'll assume ffmpeg is in the system PATH.
// import { FFMPEG_PATH, FFPROBE_PATH } from '@src/path'; // Example if you manage paths
// if (FFMPEG_PATH) ffmpeg.setFfmpegPath(FFMPEG_PATH);
// if (FFPROBE_PATH) ffmpeg.setFfprobePath(FFPROBE_PATH);


export class VideoTool extends EventEmitter {
  private videoPath: string;
  private videoName: string;
  private options: VideoToolOptions;
  public readonly id: string; // Unique ID for the task

  constructor(videoPath: string, videoName: string, options: VideoToolOptions) {
    super();
    this.videoPath = videoPath;
    this.videoName = videoName;
    this.options = options;
    this.id = `${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`; // Simple unique ID
  }

  public async applyWatermark(): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputFileName = this.options.outputFileName || `watermarked_${this.videoName}`;
      const outputPath = path.join(this.options.outputPath, outputFileName);

      const command = ffmpeg(this.videoPath);

      if (this.options.watermark) {
        const { type, options } = this.options.watermark;
        if (type === 'text') {
          const textOpts = options as VideoWatermarkTextOptions;
          // Example: drawtext=fontfile=/path/to/font.ttf:text='Watermark':fontcolor=white:fontsize=24:x=10:y=10
          // Adjust fontPath, text content, color, size, and position (x,y) as needed.
          // FFmpeg's drawtext filter has many options for positioning (e.g., main_w-text_w-10 for right alignment).
          command.videoFilters({
            filter: 'drawtext',
            options: {
              fontfile: textOpts.fontPath,
              text: textOpts.text,
              fontsize: textOpts.fontSize,
              fontcolor: textOpts.fontColor,
              x: textOpts.position.x,
              y: textOpts.position.y,
            },
          });
        } else if (type === 'image') {
          const imageOpts = options as VideoWatermarkImageOptions;
          // Example: overlay=10:10 for top-left position.
          // For scaling, you might need a complex filter graph: [1:v]scale=iw*0.5:-1[wm];[0:v][wm]overlay=10:10
          // This example assumes the image watermark path is added as a second input.
          command.input(imageOpts.imagePath); // Add the watermark image as an input
          
          let overlayOptions = `${imageOpts.position.x}:${imageOpts.position.y}`;
          let complexFilterString = `overlay=${overlayOptions}`;

          if (imageOpts.scale && imageOpts.scale !== 1) {
             // [1:v] is the second input (the watermark image)
             // iw*scale makes watermark width relative to its own width
             // -1 preserves aspect ratio for height
             // [wm] is an arbitrary name for the scaled watermark output pad
             // [0:v] is the main video input
             // [0:v][wm] means take the main video and the scaled watermark as inputs to overlay
             complexFilterString = `[1:v]scale=iw*${imageOpts.scale}:-1[wm];[0:v][wm]overlay=${overlayOptions}`;
          }
          command.complexFilter(complexFilterString);
        }
      }

      command
        .on('start', (commandLine) => {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
          this.emit('start', this.id, commandLine);
        })
        .on('progress', (progress) => {
          // progress object contains frames, currentFps, currentKbps, targetSize, timemark, percent
          this.emit('progress', this.id, progress);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Cannot process video: ' + err.message);
          console.error('ffmpeg stdout:', stdout);
          console.error('ffmpeg stderr:', stderr);
          this.emit('error', this.id, err);
          reject(err);
        })
        .on('end', (stdout, stderr) => {
          console.log('Transcoding succeeded !');
          this.emit('end', this.id, outputPath);
          resolve(outputPath);
        })
        .save(outputPath);
    });
  }
}
