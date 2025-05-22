<script lang="ts">
  import './index.scss'; // Create this file for styles
  import { config, VideoWatermarkConfig, VideoWatermarkTextOptions, VideoWatermarkImageOptions } from '@web/store/config';
  import { Drawer, Button, Input, Select, Option, Field } from '@ggchivalrous/db-ui';
  // You might need a file input component, or use a standard HTML one.
  // import FontSelect from '../font-select/index.svelte'; // If adaptable

  export let visible = false;

  let localVideoWatermark: VideoWatermarkConfig;

  // Initialize local state from store and update store on change
  $: localVideoWatermark = JSON.parse(JSON.stringify($config.videoWatermark || {
      type: 'none',
      textOptions: { text: '', fontPath: '', fontSize: 24, fontColor: '#FFFFFF', x: 10, y: 10 },
      imageOptions: { imagePath: '', x: 10, y: 10, scale: 1 }
  }));

  function updateConfig() {
    $config.videoWatermark = JSON.parse(JSON.stringify(localVideoWatermark));
  }

  // Handle file selection for font path
  function handleFontFile(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      localVideoWatermark.textOptions.fontPath = target.files[0].path; // Electron context allows path access
      updateConfig();
    }
  }

  // Handle file selection for watermark image path
  function handleImageFile(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      localVideoWatermark.imageOptions.imagePath = target.files[0].path;
      updateConfig();
    }
  }
</script>

<Drawer title="视频参数设置" bind:visible size="500px" direction="rtl" on:close={updateConfig} modal={false}>
  <div class="video-param-settings">
    <Field label="水印类型">
      <Select bind:value={localVideoWatermark.type} on:change={updateConfig}>
        <Option value="none">无</Option>
        <Option value="text">文字水印</Option>
        <Option value="image">图片水印</Option>
      </Select>
    </Field>

    {#if localVideoWatermark.type === 'text'}
      <Field label="水印文字">
        <Input bind:value={localVideoWatermark.textOptions.text} on:input={updateConfig} />
      </Field>
      <Field label="字体大小">
        <Input type="number" bind:value={localVideoWatermark.textOptions.fontSize} on:input={updateConfig} />
      </Field>
      <Field label="字体颜色">
        <Input type="color" bind:value={localVideoWatermark.textOptions.fontColor} on:input={updateConfig} />
      </Field>
      <Field label="字体文件">
        <!-- Basic file input; consider a more advanced font selector component -->
        <input type="file" accept=".ttf,.otf,.woff" on:change={handleFontFile} />
        {#if localVideoWatermark.textOptions.fontPath}
          <p>已选: {localVideoWatermark.textOptions.fontPath}</p>
        {/if}
      </Field>
      <Field label="X轴位置">
        <Input type="number" bind:value={localVideoWatermark.textOptions.x} on:input={updateConfig} />
      </Field>
      <Field label="Y轴位置">
        <Input type="number" bind:value={localVideoWatermark.textOptions.y} on:input={updateConfig} />
      </Field>
    {/if}

    {#if localVideoWatermark.type === 'image'}
      <Field label="水印图片">
        <input type="file" accept="image/*" on:change={handleImageFile} />
        {#if localVideoWatermark.imageOptions.imagePath}
          <p>已选: {localVideoWatermark.imageOptions.imagePath}</p>
        {/if}
      </Field>
      <Field label="X轴位置">
        <Input type="number" bind:value={localVideoWatermark.imageOptions.x} on:input={updateConfig} />
      </Field>
      <Field label="Y轴位置">
        <Input type="number" bind:value={localVideoWatermark.imageOptions.y} on:input={updateConfig} />
      </Field>
      <Field label="缩放比例 (可选)">
        <Input type="number" step="0.1" bind:value={localVideoWatermark.imageOptions.scale} on:input={updateConfig} />
      </Field>
    {/if}
  </div>
</Drawer>
