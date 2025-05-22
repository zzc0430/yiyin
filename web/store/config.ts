/* eslint-disable no-console */
import { Message } from '@ggchivalrous/db-ui';
import { writable } from 'svelte/store';

import type { IConfig } from '../main/interface'; // This IConfig will need videoWatermark

// Define interfaces for video watermark options
export interface VideoWatermarkTextOptions {
  text: string;
  fontPath: string; // Path to the font file
  fontSize: number;
  fontColor: string;
  x: number; // Position x
  y: number; // Position y
}

export interface VideoWatermarkImageOptions {
  imagePath: string; // Path to the watermark image
  x: number; // Position x
  y: number; // Position y
  scale?: number;
}

export interface VideoWatermarkConfig {
  type: 'text' | 'image' | 'none'; // 'none' or undefined for no watermark
  textOptions?: VideoWatermarkTextOptions;
  imageOptions?: VideoWatermarkImageOptions;
}


let initConfig = false;
let loadConfig = false;

export const config = writable<IConfig>({
  options: {
    iot: false,
    landscape: false,
    solid_bg: false,
    origin_wh_output: true,
    radius: 2.1,
    radius_show: true,
    shadow: 6,
    shadow_show: true,
    bg_rate_show: true,
    font: '',
    bg_rate: {
      w: 0,
      h: 0,
    },
  },
  videoWatermark: { // Default video watermark settings
    type: 'none', 
    textOptions: {
      text: 'Sample Watermark',
      fontPath: '', // User will need to select this
      fontSize: 24,
      fontColor: '#FFFFFF',
      x: 10,
      y: 10,
    },
    imageOptions: {
      imagePath: '', // User will need to select this
      x: 10,
      y: 10,
      scale: 1,
    }
  },
  fontMap: {},
  fontDir: '',
  tempFields: [],
  customTempFields: [],
  temps: [],
  output: '',
  staticDir: '',
});

function onConfigUpdate(v: IConfig, newConf: any) {
  v.options = newConf.options;
  v.output = newConf.output;
  v.fontMap = newConf.font.map;
  v.fontDir = newConf.font.dir;
  v.tempFields = newConf.tempFields;
  v.customTempFields = newConf.customTempFields;
  v.temps = newConf.temps;
  v.staticDir = newConf.staticDir;
  // Add this line
  v.videoWatermark = newConf.videoWatermark || v.videoWatermark; // Ensure it handles cases where it might be missing in older configs
  return v;
}

export async function getConfig() {
  loadConfig = true;
  const defConf = await window.api.getConfig();
  if (defConf.code === 0) {
    config.update((v) => onConfigUpdate(v, defConf.data));
    console.log('配置信息:', defConf.data);
    config.subscribe((v) => console.log('使用配置信息:', v))();
  }
  loadConfig = false;
}

export async function resetConfig() {
  const res = await window.api.resetConfig();
  if (res.code !== 0) {
    Message.error(`重置失败！！${res.message}`);
    return;
  }

  config.update((v) => onConfigUpdate(v, res.data));
  Message.success({ message: '重置成功' });
}

export const pathInfo = writable({
  public: '',
  logo: '',
});

config.subscribe(async (v) => {
  if (initConfig && !loadConfig) {
    console.log('持久化配置信息');

    const _conf = await window.api.setConfig(v);
    if (_conf.code !== 0) {
      console.log('持久化配置信息失败:', _conf.message);
      Message.error(`配置持久化失败!!${_conf.message}`);
      return;
    }

    console.log('配置信息:', _conf.data);
    config.subscribe((_v) => console.log('使用配置信息:', _v))();
  }
});

getConfig().then(() => { initConfig = true; });

async function getPathInfo() {
  const info = await window.api.pathInfo();
  if (info.code === 0) {
    pathInfo.set(info.data);
  }
}

getPathInfo();
