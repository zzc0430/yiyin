export default {
  startTask: 'startTask',
  addTask: 'addTask',
  composite: 'composite',
  compositeFail: 'compositeFail',
  createBgImg: 'createBgImg',
  getConfig: 'getConfig',
  setConfig: 'setConfig',
  resetConfig: 'resetConfig',
  getFontList: 'getFontList',
  addFont: 'addFont',
  delFont: 'delFont',
  miniSize: 'miniSize',
  closeApp: 'closeApp',
  getExitInfo: 'getExitInfo',
  uploadExifImg: 'uploadExifImg',
  pathInfo: 'pathInfo',
  logoList: 'logoList',
  genTextImg: 'genTextImg',
  genMainImgShadow: 'genMainImgShadow',
  drainQueue: 'drainQueue',
  pathJoin: 'pathJoin',
  open: {
    selectPath: 'open:selectPath',
    dir: 'open:dir',
  },
  // Add these for video tasks
  addVideoTask: 'addVideoTask',         // Changed value for dot notation access in app.svele
  startVideoTask: 'startVideoTask',     // Changed value for dot notation access
  drainVideoQueue: 'drainVideoQueue',   // Changed value for consistency
  // onVideoProgress: 'on:video-progress', // Listener key for renderer - moved into 'on' object below

  on: {
    createMask: 'on:createMask',
    taskStart: 'on:taskStart',
    faildTask: 'on:faildTask',
    progress: 'on:progress', // Existing, for images
    composite: 'on:composite',
    assetsUpdate: 'on:assetsUpdate',
    genTextImg: 'on:genTextImg', // Already exists
    genMainImgShadow: 'on:genMainImgShadow', // Already exists
    onVideoProgress: 'on:video-progress', // Added here
    // Potentially add more if needed, e.g., for video errors or completion events sent to renderer
    // onVideoError: 'on:video-error',
    // onVideoComplete: 'on:video-complete',
  },
};
