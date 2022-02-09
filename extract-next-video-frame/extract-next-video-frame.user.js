// ==UserScript==
// @name        extract next video frame
// @namespace   Gizeta.Debris.ExtractNextVideoFrame
// @match       *://www.bilibili.com/video/*
// @grant       none
// @version     0.1.0
// @author      Gizeta
// @description 2022/2/10 03:56:42
// @license     MIT
// ==/UserScript==

/* jshint esversion: 8 */

const LAYER_ID = '--video-frame-preview-layer';
const LAYER_CANVAS_ID = `${LAYER_ID}-canvas`;
const LAYER_TIME_ID = `${LAYER_ID}-time`;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;
const MAX_FRAME_COUNT = 30;

let videoFrames;
let videoElem;
let currentTime;
let frameIndex = 0;

function hideLayer() {
  const layer = document.getElementById(LAYER_ID);
  layer.style.display = 'none';
  videoElem.currentTime = currentTime;
}

function createLayer() {
  if (!document.getElementById(LAYER_ID)) {
    const layer = document.createElement('div');
    document.body.appendChild(layer);
    layer.outerHTML = `<div id="${LAYER_ID}" style="${[
        "position: fixed",
        "width: 100vw",
        "height: 100vh",
        "top: 0",
        "left: 0",
        "z-index: 99999",
        "background: rgba(0, 0, 0, .8)",
      ].join(';')}">
      <canvas width="960" height="720" id="${LAYER_CANVAS_ID}" style="${[
        "position: fixed",
        `width: ${CANVAS_WIDTH}px`,
        `height: ${CANVAS_HEIGHT}px`,
        `top: calc(50vh - ${CANVAS_HEIGHT / 2 + 15}px)`,
        `left: calc(50vw - ${CANVAS_WIDTH / 2}px)`,
        "background: black",
      ].join(';')}"></canvas>
      <div id="${LAYER_TIME_ID}" style="${[
        "position: fixed",
        `width: ${CANVAS_WIDTH}px`,
        "height: 30px",
        `top: calc(50vh + ${CANVAS_HEIGHT / 2 - 15}px)`,
        `left: calc(50vw - ${CANVAS_WIDTH / 2}px)`,
        "line-height: 30px",
        "background: #222",
        "color: white",
        "overflow-x: auto",
        "scrollbar-width: none",
      ].join(';')}">
      </div>
    </div>`;
    document.getElementById(LAYER_ID).addEventListener('click', hideLayer);
    document.getElementById(LAYER_CANVAS_ID).addEventListener('click', function(ev) {
      ev.stopPropagation();
    });
    document.getElementById(LAYER_TIME_ID).addEventListener('click', function(ev) {
      ev.stopPropagation();
      for (const elem of document.getElementById(LAYER_TIME_ID).children) {
        elem.style.background = "#222";
      }
      ev.target.style.background = "#555";
      const id = +ev.target.dataset.index;
      frameIndex = id;
      currentTime = videoFrames[id].time;
      renderFrame();
    });
  }
  document.getElementById(LAYER_ID).style.display = 'block';
}

function renderFrame() {
  const bitmap = videoFrames[frameIndex].bitmap;
  const ratio = Math.max(bitmap.width / CANVAS_WIDTH, bitmap.height / CANVAS_HEIGHT, 1);
  const width = bitmap.width / ratio;
  const height = bitmap.height / ratio;
  const x = (CANVAS_WIDTH - width) / 2;
  const y = (CANVAS_HEIGHT - height) / 2;

  const canvas = document.getElementById(LAYER_CANVAS_ID);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, x, y, width, height);
}

function timeStr(num) {
  let s = num | 0;
  const ms = num - s;
  let m = Math.floor(s / 60);
  s = s - m * 60;
  let h = Math.floor(m / 60);
  m = m - h * 60;
  return `${h ? `${h}:` : ''}${m}:${s}${ms ? ms.toFixed(3).toString().substring(1) : ''}`;
}

function renderTimeline() {
  const timeline = document.getElementById(LAYER_TIME_ID);
  timeline.innerHTML = videoFrames.map((x, i) => `<span data-index="${i}" style="${[
    "font-size: 16px",
    "padding: 5px 10px",
    "cursor: pointer",
  ].join(';')}">${timeStr(x.time)}</span>`).join('');

  renderFrame();
}

window.addEventListener('keydown', function(ev) {
  if (ev.ctrlKey && ev.altKey && ev.key === 'e') {
    capture(document.querySelector('video'));
  }
});

function capture(video) {
  video.pause();

  videoElem = video;
  currentTime = video.currentTime;
  videoFrames = [];

  // firefox-only, should use MediaStreamTrackProcessor instead on chrome
  async function seekFrames() {
    if (videoElem.ended || videoFrames.length >= MAX_FRAME_COUNT) {
      renderTimeline();
      return;
    }

    const bitmap = await createImageBitmap(videoElem);
    videoFrames.push({
      time: video.currentTime,
      bitmap,
    });

    videoElem.addEventListener('seeked', function() {
      seekFrames();
    }, { once: true });
    videoElem.seekToNextFrame();
  }

  createLayer();
  seekFrames();
}
