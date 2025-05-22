import { ImageTool } from '@modules/image-tool';
import { VideoTool } from '@modules/video-tool';
import { Queue, TaskQueue } from '@modules/queue';
import type { IImgFileInfo } from '@web/modules/text-tool/interface';

export const genTextImgQueue = new Queue<{
  id: string
  textImgList: IImgFileInfo[]
}>({ concurrency: 2 });

export const genMainImgShadowQueue = new Queue<{
  id: string
  data: string
}>({ concurrency: 2 });

export const imageToolQueue = new Queue<ImageTool>({ concurrency: 2, autoRun: false });
export const videoToolQueue = new TaskQueue<VideoTool>(1);
