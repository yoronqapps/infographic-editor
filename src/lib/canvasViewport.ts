export type FitMode = 'page' | 'width' | 'height';

export const clampZoom = (value: number) => Math.min(2, Math.max(0.25, value));

export const calculateFitZoom = (mode: FitMode, canvasWidth: number, canvasHeight: number, viewportWidth: number, viewportHeight: number) => {
  const widthZoom = viewportWidth / canvasWidth;
  const heightZoom = viewportHeight / canvasHeight;
  const target = mode === 'width' ? widthZoom : mode === 'height' ? heightZoom : Math.min(widthZoom, heightZoom);
  return clampZoom(Math.min(target, 1));
};
