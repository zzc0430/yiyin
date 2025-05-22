<script lang="ts">
  import './index.scss';
  import { Message } from '@ggchivalrous/db-ui';
  import { Message } from '@ggchivalrous/db-ui';
  import { ImageTool } from '@web/modules/image-tool';
  import type { ImageToolOption } from '@web/modules/image-tool/interface';
  import { TextTool } from '@web/modules/text-tool';
  import type { TextToolOption } from '@web/modules/text-tool/interface';
  import { config, pathInfo } from '@web/store/config';
  import { importFont } from '@web/util/util';
  // Ensure routerConfig is imported if used for API event names
  // import routerConfig from '@root/router-config'; 
  import type { IFontInfo } from '@web/util/util';

  import { Actions, ParamSetting, Footer, Header, TempSetting } from './components';
  import VideoParamSetting from './components/video-param-setting/index.svelte'; // Import new component
  import type { IFileInfo, TInputEvent } from './interface';

  let fileInfoList: IFileInfo[] = [];
  let processing = false; // Changed from const to let
  let fileSelectDom: HTMLInputElement = null;
  let showParamSetting = false;
  let showTempSetting = false;
  let showVideoParamSetting = false; // Add state for new component
  let fontList: IFontInfo[] = [];

  $: onFileInfoListChange(fileInfoList);
  $: onFontMap($config.fontMap);
  $: importFont(fontList);

  onFileDrop();

  // Listener for video progress
  // Assuming routerConfig.onVideoProgress holds the event name string e.g., 'on-video-progress'
  // If routerConfig is not available here, use the raw string.
  window.api['on:videoProgress']((data: { id: string; progress: any }) => {
    const item = fileInfoList.find(f => f.id === data.id);
    if (item) {
      // Assuming data.progress is an object like { percent: number }
      // Adjust if the structure of data.progress is different
      item.progress = typeof data.progress.percent === 'number' ? data.progress.percent : item.progress;
      fileInfoList = [...fileInfoList]; // Trigger Svelte reactivity
    }
    console.log(`Video progress for ${data.id}:`, data.progress);
  });

  window.api['on:genTextImg'](async (data: TextToolOption & { id: string }) => {
    const textTool = new TextTool(data.exif, data);
    const textImgList = await textTool.genTextImg().catch((e) => {
      console.log(e);
    });

    window.api.genTextImg({
      id: data.id,
      textImgList,
    });
  });

  window.api['on:genMainImgShadow'](async (data: ImageToolOption & { id: string }) => {
    const tool = new ImageTool(data);
    const _data = await tool.genMainImgShadow();
    window.api.genMainImgShadow({
      id: data.id,
      data: _data,
    });
  });

  async function onFileChange(ev: TInputEvent) {
    if (ev.currentTarget && ev.currentTarget.type === 'file') {
      const files = ev.currentTarget.files;
      const imageFiles: IFileInfo[] = [];
      const videoFiles: IFileInfo[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileInfoBase = { path: file.path, name: file.name, progress: 0 };
        if (file.type.startsWith('image/')) {
          imageFiles.push({ ...fileInfoBase, type: 'image' });
        } else if (file.type.startsWith('video/')) {
          videoFiles.push({ ...fileInfoBase, type: 'video' });
        } else {
          Message.error(`${file.name} 文件非图片或视频文件`);
        }
      }

      let newItems: IFileInfo[] = [];
      if (imageFiles.length > 0) {
        const res = await window.api.addTask(imageFiles); // addTask likely for images
        if (res.code === 0) {
          newItems.push(...res.data.map(item => ({ ...item, type: 'image', progress: 0 })));
        } else {
          Message.error(`图片添加失败: ${res.message}`);
        }
      }

      if (videoFiles.length > 0) {
        // Assuming addVideoTask returns a similar structure to addTask
        // { code: number, message?: string, data: IFileInfo[] }
        const res = await window.api.addVideoTask(videoFiles);
        if (res.code === 0) {
          // Ensure items from addVideoTask also get 'type' and 'progress'
          newItems.push(...res.data.map(item => ({ ...item, type: 'video', progress: 0 })));
        } else {
          Message.error(`视频添加失败: ${res.message}`);
        }
      }
      
      if (newItems.length > 0) {
        fileInfoList.unshift(...newItems.reverse()); // Keep existing behavior of reversing and unshifting
        fileInfoList = fileInfoList; // Trigger Svelte reactivity
      }
      
      if (fileSelectDom) fileSelectDom.value = ''; // Clear file input
    }
  }

  async function startTask() {
    processing = true;
    try {
      const imageRes = await window.api.startTask(); // For images
      if (imageRes.code !== 0) {
        Message.error(imageRes.message || '图片水印生成开启失败');
      }
      // Assuming startVideoTask exists and has a similar response structure
      const videoRes = await window.api.startVideoTask(); // For videos
      if (videoRes.code !== 0) {
        Message.error(videoRes.message || '视频水印生成开启失败');
      }
    } catch (error) {
      Message.error('任务开启时发生错误');
      console.error('Error starting tasks:', error);
    } finally {
      processing = false;
    }
  }

  // 监听文件放入，然后执行水印生成等后续操作
  function onFileDrop() {
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const imageFiles: IFileInfo[] = [];
      const videoFiles: IFileInfo[] = [];
      const files = e.dataTransfer.files;

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        const fileInfoBase = { name: file.name, path: file.path, progress: 0 };
        if (file.type.startsWith('image/')) {
          imageFiles.push({ ...fileInfoBase, type: 'image' });
        } else if (file.type.startsWith('video/')) {
          videoFiles.push({ ...fileInfoBase, type: 'video' });
        } else {
          Message.error(`${file.name} 文件非图片或视频文件`);
          continue; // Skip this file
        }
      }
      
      let newItems: IFileInfo[] = [];
      if (imageFiles.length > 0) {
        const res = await window.api.addTask(imageFiles);
        if (res.code === 0) {
          newItems.push(...res.data.map(item => ({ ...item, type: 'image', progress: 0 })));
        } else {
          Message.error(`图片添加失败: ${res.message}`);
        }
      }

      if (videoFiles.length > 0) {
        const res = await window.api.addVideoTask(videoFiles);
        if (res.code === 0) {
          newItems.push(...res.data.map(item => ({ ...item, type: 'video', progress: 0 })));
        } else {
          Message.error(`视频添加失败: ${res.message}`);
        }
      }

      if (newItems.length > 0) {
        fileInfoList.unshift(...newItems.reverse());
        fileInfoList = fileInfoList;
      }

      if ($config.options?.iot && newItems.length > 0) { // Only start if items were successfully added
        startTask();
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  function onFileInfoListChange(_: IFileInfo[]) {
    if ($config.options?.iot) {
      startTask();
    }
  }

  async function onFontMap(fontMap: Record<string, string>) {
    if (fontMap) {
      const list = [];
      for (const key in fontMap) {
        const data = await window.api.pathJoin([$config.fontDir, fontMap[key]]);
        if (data.code === 0) {
          list.push({
            name: key,
            path: `file://${data.data.replaceAll('\\', '\\\\')}`,
          });
        }
      }

      fontList = list;
    }
  }

  async function getGuideIconPath(arr: string[]) {
    const data = await window.api.pathJoin(arr);
    if (data.code === 0) {
      return data.data.replaceAll('\\', '\\\\');
    }
    return '';
  }
</script>

<Header />

<div id="root">
  {#await getGuideIconPath([$pathInfo.public, '/img/guide.svg']) then path}
    <div class="guide">
      <i style="background-image: url('file://{path}');"></i>
      白嫖指南(●°u°●)​ 」
    </div>
    <div class="desc">
      <i style="background-image: url('file://{path}');"></i>
      萌新指北(｡･ω･｡)
    </div>
  {/await}

  <input type="file" id="path" accept="image/*,video/*" bind:this={fileSelectDom} on:change={onFileChange} multiple class="hide" />

  <div class="body">
    <div class="content">
      <Actions bind:fileInfoList={fileInfoList} />
    </div>

    <div class="button-wrap">
      <label for="path" class="button grass">添加文件</label> <!-- Changed label -->
      <div class="button grass" on:click={startTask} on:keypress role="button" tabindex="-1">
        {#if processing}
          处理中...
        {:else}
          开始处理 <!-- Changed label -->
        {/if}
      </div>
      <div class="button grass" on:click={() => { showParamSetting = true; }} on:keypress role="button" tabindex="-1">图片参数</div>
      <div class="button grass" on:click={() => { showVideoParamSetting = true; }} on:keypress role="button" tabindex="-1">视频参数</div>
      <div class="button grass" on:click={() => { showTempSetting = true; }} on:keypress role="button" tabindex="-1">模板设置</div>
    </div>
  </div>

  <Footer />
  <ParamSetting bind:visible={showParamSetting} />
  <TempSetting bind:visible={showTempSetting} />
  <VideoParamSetting bind:visible={showVideoParamSetting} /> <!-- Add new component instance -->
</div>
