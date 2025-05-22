export { default as query } from './query';
export { default as open } from './open';
export { default as image } from './image';

// Add this import
import videoRouter from './video';

// Add this line with other router uses
Router.use(videoRouter);
