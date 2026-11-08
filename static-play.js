/* 小游戏站 · 静态版播放页逻辑（数据由导出脚本注入） */
(function () {
  'use strict';

  var game = window.__GAME__ || {};
  var frame = document.getElementById('frame');
  var loading = document.getElementById('play-loading');

  function showLoading(show) {
    loading.hidden = !show;
  }

  function setHeader() {
    if (game.title) document.title = game.title + ' · 小游戏站';
    var title = document.getElementById('play-title');
    title.childNodes[0].nodeValue = game.title || '小游戏';
    var tags = Array.isArray(game.tags) && game.tags.length ? '  ·  ' + game.tags.join(' / ') : '  ·  小游戏';
    document.getElementById('play-sub').textContent = (game.desc || '') + tags;
    var openBtn = document.getElementById('btn-open');
    if (game.src) openBtn.href = game.src;
  }

  function load() {
    if (!game.src) {
      showLoading(false);
      document.body.innerHTML = '<div style="padding:60px;color:#8b93a7;font-family:sans-serif">游戏数据缺失，请从列表页进入。</div>';
      return;
    }
    frame.src = game.src;
  }

  frame.addEventListener('load', function () {
    setTimeout(function () { showLoading(false); }, 120);
  });
  // 兜底：8 秒后无论是否 load 都隐藏加载层
  setTimeout(function () { showLoading(false); }, 8000);

  document.getElementById('btn-reload').addEventListener('click', function () {
    if (!game.src) return;
    showLoading(true);
    var url = new URL(game.src, location.href);
    url.searchParams.set('_r', String(Date.now()));
    frame.src = url.toString();
  });

  document.getElementById('btn-full').addEventListener('click', function () {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
      return;
    }
    if (frame.requestFullscreen) frame.requestFullscreen().catch(function () {});
  });

  document.addEventListener('fullscreenchange', function () {
    var btn = document.getElementById('btn-full');
    btn.innerHTML = document.fullscreenElement ? '⛶ <span class="label">退出</span>' : '⛶ <span class="label">全屏</span>';
  });

  setHeader();
  load();
})();
