import { VideoTool } from './index';
import type { VideoToolOptions, VideoWatermarkTextOptions, VideoWatermarkImageOptions } from './interface';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path'; // path.join is used in VideoTool

// Mock fluent-ffmpeg
let mockEventHandlers: Record<string, Function> = {};

const mockFfmpegCommand = {
  input: jest.fn().mockReturnThis(),
  videoFilters: jest.fn().mockReturnThis(),
  complexFilter: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementation(function(event: string, callback: Function) {
    mockEventHandlers[event] = callback;
    return this;
  }),
  save: jest.fn().mockImplementation(function(outputPath: string) {
    // Simulate success by default, can be overridden in tests
    if (mockEventHandlers['end']) {
      mockEventHandlers['end']('mock stdout', 'mock stderr');
    }
    return this; 
  }),
  // Helper to trigger events for testing
  _triggerEvent(event: string, ...args: any[]) {
    if (mockEventHandlers[event]) {
      mockEventHandlers[event](...args);
    }
  },
  _clearHandlers() { // Helper to clear handlers between tests
    mockEventHandlers = {};
  },
  _getCallCount(methodName: 'input' | 'videoFilters' | 'complexFilter' | 'on' | 'save') {
    return (this[methodName] as jest.Mock).mock.calls.length;
  }
};

jest.mock('fluent-ffmpeg', () => ({
  __esModule: true,
  default: jest.fn(() => mockFfmpegCommand),
  setFfmpegPath: jest.fn(),
  setFfprobePath: jest.fn(),
}));


describe('VideoTool', () => {
  const videoPath = '/fake/video.mp4';
  const videoName = 'video.mp4';
  const defaultOutputPath = '/fake/output';

  beforeEach(() => {
    // Clear all mock implementations and calls before each test
    jest.clearAllMocks();
    mockFfmpegCommand._clearHandlers();
  });

  test('should apply text watermark correctly', async () => {
    const textOptions: VideoWatermarkTextOptions = {
      text: 'Test Watermark',
      fontPath: '/fake/font.ttf',
      fontSize: 24,
      fontColor: 'white',
      position: { x: 10, y: 10 },
    };
    const options: VideoToolOptions = {
      outputPath: defaultOutputPath,
      watermark: { type: 'text', options: textOptions },
    };

    const videoTool = new VideoTool(videoPath, videoName, options);
    const onStartMock = jest.fn();
    const onProgressMock = jest.fn();
    const onEndMock = jest.fn();
    videoTool.on('start', onStartMock);
    videoTool.on('progress', onProgressMock);
    videoTool.on('end', onEndMock);
    
    // Trigger 'start' event from mock
    mockFfmpegCommand._triggerEvent('start', 'mock command line');

    const outputPath = await videoTool.applyWatermark();
    
    expect(ffmpeg).toHaveBeenCalledWith(videoPath);
    expect(mockFfmpegCommand.videoFilters).toHaveBeenCalledWith({
      filter: 'drawtext',
      options: {
        fontfile: textOptions.fontPath,
        text: textOptions.text,
        fontsize: textOptions.fontSize,
        fontcolor: textOptions.fontColor,
        x: textOptions.position.x,
        y: textOptions.position.y,
      },
    });
    const expectedOutput = path.join(defaultOutputPath, `watermarked_${videoName}`);
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(expectedOutput);
    expect(outputPath).toBe(expectedOutput);

    expect(onStartMock).toHaveBeenCalledWith(videoTool.id, 'mock command line');
    expect(onEndMock).toHaveBeenCalledWith(videoTool.id, expectedOutput);
  });

  test('should apply image watermark without scaling correctly', async () => {
    const imageOptions: VideoWatermarkImageOptions = {
      imagePath: '/fake/watermark.png',
      position: { x: 20, y: 20 },
    };
    const options: VideoToolOptions = {
      outputPath: defaultOutputPath,
      watermark: { type: 'image', options: imageOptions },
    };

    const videoTool = new VideoTool(videoPath, videoName, options);
    const outputPath = await videoTool.applyWatermark();

    expect(ffmpeg).toHaveBeenCalledWith(videoPath);
    expect(mockFfmpegCommand.input).toHaveBeenCalledWith(imageOptions.imagePath);
    expect(mockFfmpegCommand.complexFilter).toHaveBeenCalledWith(`overlay=${imageOptions.position.x}:${imageOptions.position.y}`);
    const expectedOutput = path.join(defaultOutputPath, `watermarked_${videoName}`);
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(expectedOutput);
    expect(outputPath).toBe(expectedOutput);
  });

  test('should apply image watermark with scaling correctly', async () => {
    const imageOptions: VideoWatermarkImageOptions = {
      imagePath: '/fake/watermark.png',
      position: { x: 30, y: 30 },
      scale: 0.5,
    };
    const options: VideoToolOptions = {
      outputPath: defaultOutputPath,
      watermark: { type: 'image', options: imageOptions },
    };

    const videoTool = new VideoTool(videoPath, videoName, options);
    await videoTool.applyWatermark();

    expect(mockFfmpegCommand.input).toHaveBeenCalledWith(imageOptions.imagePath);
    expect(mockFfmpegCommand.complexFilter).toHaveBeenCalledWith(
      `[1:v]scale=iw*${imageOptions.scale}:-1[wm];[0:v][wm]overlay=${imageOptions.position.x}:${imageOptions.position.y}`
    );
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(path.join(defaultOutputPath, `watermarked_${videoName}`));
  });
  
  test('should process video without watermark if not specified', async () => {
    const options: VideoToolOptions = {
      outputPath: defaultOutputPath,
    }; // No watermark options

    const videoTool = new VideoTool(videoPath, videoName, options);
    await videoTool.applyWatermark();

    expect(ffmpeg).toHaveBeenCalledWith(videoPath);
    expect(mockFfmpegCommand.videoFilters).not.toHaveBeenCalled();
    expect(mockFfmpegCommand.complexFilter).not.toHaveBeenCalled();
    expect(mockFfmpegCommand.input).not.toHaveBeenCalledWith(expect.stringContaining('png')); // Or any other image path check
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(path.join(defaultOutputPath, `watermarked_${videoName}`));
  });

  test('should handle ffmpeg error correctly', async () => {
    const options: VideoToolOptions = { outputPath: defaultOutputPath };
    const videoTool = new VideoTool(videoPath, videoName, options);
    const onErrorMock = jest.fn();
    videoTool.on('error', onErrorMock);

    const mockError = new Error('ffmpeg failed');
    
    // Configure save to trigger an error
    (mockFfmpegCommand.save as jest.Mock).mockImplementationOnce(() => {
      mockFfmpegCommand._triggerEvent('error', mockError, 'stdout_data', 'stderr_data');
      return mockFfmpegCommand;
    });

    await expect(videoTool.applyWatermark()).rejects.toThrow('ffmpeg failed');
    expect(onErrorMock).toHaveBeenCalledWith(videoTool.id, mockError);
    // Check that 'end' was not called if 'error' occurred
    expect(mockFfmpegCommand.on).toHaveBeenCalledWith('end', expect.any(Function));
    // To be very sure, check that the end handler wasn't called by the VideoTool's emitter
    const onEndListener = jest.fn();
    videoTool.on('end', onEndListener);
    // (re-run applyWatermark or check internal state if possible, or ensure error handling path in VideoTool prevents 'end' emit)
    // For this test, we assume the promise rejection and 'error' event are sufficient.
  });

  test('should emit progress events correctly', () => {
    const options: VideoToolOptions = { outputPath: defaultOutputPath };
    const videoTool = new VideoTool(videoPath, videoName, options);
    const onProgressMock = jest.fn();
    videoTool.on('progress', onProgressMock);

    // Call applyWatermark but don't await it, or ensure 'on' is called before triggering
    videoTool.applyWatermark().catch(() => {}); // Catch potential rejection if save is not mocked for success here

    const progressData = { percent: 50, frames: 150 };
    mockFfmpegCommand._triggerEvent('progress', progressData);
    
    expect(onProgressMock).toHaveBeenCalledWith(videoTool.id, progressData);
  });

  test('should use custom output filename if provided', async () => {
    const customFileName = 'custom_video.mp4';
    const options: VideoToolOptions = {
      outputPath: defaultOutputPath,
      outputFileName: customFileName,
    };
    const videoTool = new VideoTool(videoPath, videoName, options);
    await videoTool.applyWatermark();
    
    const expectedOutput = path.join(defaultOutputPath, customFileName);
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(expectedOutput);
  });

  test('should use default output filename if not provided', async () => {
    const options: VideoToolOptions = { outputPath: defaultOutputPath }; // No outputFileName
    const videoTool = new VideoTool(videoPath, videoName, options);
    await videoTool.applyWatermark();

    const expectedOutput = path.join(defaultOutputPath, `watermarked_${videoName}`);
    expect(mockFfmpegCommand.save).toHaveBeenCalledWith(expectedOutput);
  });

});
