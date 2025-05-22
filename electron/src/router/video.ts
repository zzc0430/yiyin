import { Router } from '@modules/router';
import { VideoTool } from '@modules/video-tool';
import type { VideoToolOptions } from '@modules/video-tool/interface';
import routerConfig from '@root/router-config'; // You'll need to define video routes in this file later
import { mainApp } from '@src/common/app';
import { videoToolQueue } from '@src/common/queue';
import { config } from '@src/config'; // Assuming config stores output paths etc.
import { cpObj } from '@utils'; // Assuming cpObj is a deep copy utility

const r = new Router();

interface StartVideoTaskData {
  path: string;
  name: string;
  // You might want to include specific VideoToolOptions here or pass them when adding tasks
  // For simplicity, this example assumes options are fetched from a global config or similar
  // when the VideoTool instance is created.
  options?: Partial<VideoToolOptions>; 
}

interface VideoInfo {
  id: string;
  path: string;
  name: string;
}

// Define new router event names in router-config.ts, e.g.:
// addVideoTask: 'add-video-task',
// startVideoTask: 'start-video-task',
// onVideoProgress: 'on-video-progress',
// drainVideoQueue: 'drain-video-queue',

r.listen<StartVideoTaskData[], VideoInfo[]>(routerConfig.addVideoTask, async (fileUrlList) => {
  const videoList: VideoInfo[] = [];

  for (const fileInfo of fileUrlList) {
    // Ensure you have a way to get video-specific options,
    // possibly from global config or passed in `fileInfo.options`
    const videoOptions: VideoToolOptions = {
      // Example: these should come from your application's configuration
      outputPath: config.output.path, // Make sure 'config.output.path' is valid
      watermark: config.options.videoWatermark, // Example: fetch watermark settings from global config
      ...(fileInfo.options || {}),
    };
    
    const tool = new VideoTool(fileInfo.path, fileInfo.name, videoOptions);

    tool.on('progress', (id, progress) => {
      mainApp.win.webContents.send(routerConfig.onVideoProgress, { id, progress });
    });
    // You might want to listen for 'start', 'error', 'end' events as well
    // and forward them to the renderer process if needed.
    // tool.on('error', (id, err) => { ... });
    // tool.on('end', (id, outputPath) => { ... });

    videoList.push({ id: tool.id, path: fileInfo.path, name: fileInfo.name });
    videoToolQueue.add(tool);
  }

  return videoList;
});

r.listen<void, boolean>(routerConfig.startVideoTask, async () => {
  videoToolQueue.run();
  return true;
});

r.listen(routerConfig.drainVideoQueue, async () => videoToolQueue.drain());

// Add other video-related listeners if needed

export default r;
