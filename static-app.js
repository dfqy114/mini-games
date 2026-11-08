/* 小游戏站 · 静态版列表逻辑（无后端，数据由导出脚本注入） */
(function () {
  'use strict';

  var games = Array.isArray(window.__GAMES__) ? window.__GAMES__.slice() : [];
  var site = window.__SITE__ || {};
  var state = { q: '', tag: '', sort: 'new' };

  function $(sel) { return document.querySelector(sel); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10 * 1024 ? 1 : 0) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var now = new Date();
    var sameYear = d.getFullYear() === now.getFullYear();
    return (sameYear ? '' : d.getFullYear() + '/') + (d.getMonth() + 1) + '/' + d.getDate();
  }

  function initials(title) {
    var t = String(title || '').trim();
    if (!t) return '?';
    if (/[\u4e00-\u9fa5]/.test(t.charAt(0))) return t.slice(0, 2);
    var parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return t.slice(0, 2).toUpperCase();
  }

  function filteredGames() {
    var q = state.q.trim().toLowerCase();
    var list = games.filter(function (g) {
      if (state.tag && (g.tags || []).indexOf(state.tag) === -1) return false;
      if (!q) return true;
      var hay = ((g.title || '') + ' ' + (g.desc || '') + ' ' + (g.tags || []).join(' ')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    var sort = state.sort;
    list.sort(function (a, b) {
      if (sort === 'old') return a.uploadedAt - b.uploadedAt;
      if (sort === 'name') return String(a.title).localeCompare(String(b.title), 'zh-Hans-CN');
      if (sort === 'size') return (b.size || 0) - (a.size || 0);
      return b.uploadedAt - a.uploadedAt;
    });
    return list;
  }

  function cardHtml(g) {
    var isNew = Date.now() - (g.uploadedAt || 0) < 3 * 24 * 3600 * 1000;
    var coverImg = g.cover
      ? '<img src="' + escapeHtml(g.cover) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
      : '';
    return '' +
      '<article class="card" data-id="' + escapeHtml(g.id) + '">' +
        '<div class="cover" title="点击开始游戏">' +
          '<div class="cover-fallback">' +
            '<div class="initial">' + escapeHtml(initials(g.title)) + '</div>' +
            '<div class="ghost-text">PLAY</div>' +
          '</div>' +
          coverImg +
          (isNew ? '<span class="badge-new">NEW</span>' : '') +
          '<span class="play-hint">▶</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<h3 class="card-title">' + escapeHtml(g.title) + '</h3>' +
          '<p class="card-desc">' + escapeHtml(g.desc || '点击封面开始游戏') + '</p>' +
          '<div class="card-meta">' +
            '<span>' + fmtSize(g.size) + '</span>' +
            '<span class="tag-dot"></span>' +
            '<span>' + fmtDate(g.uploadedAt) + '</span>' +
            (g.fileCount > 1 ? '<span class="tag-dot"></span><span>' + g.fileCount + ' 个文件</span>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderTags() {
    var box = $('#tags');
    var counts = {};
    games.forEach(function (g) {
      (g.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!names.length) { box.hidden = true; return; }
    box.hidden = false;
    var html = '<button class="tag' + (state.tag ? '' : ' active') + '" data-tag="">全部 ' + games.length + '</button>';
    names.forEach(function (name) {
      html += '<button class="tag' + (state.tag === name ? ' active' : '') + '" data-tag="' + escapeHtml(name) + '">' +
        escapeHtml(name) + ' <span style="opacity:.55">' + counts[name] + '</span></button>';
    });
    box.innerHTML = html;
  }

  function renderStats() {
    var box = $('#stats');
    if (!games.length) {
      box.innerHTML = '<span>还没有发布游戏</span>';
      return;
    }
    var total = games.reduce(function (sum, g) { return sum + (g.size || 0); }, 0);
    box.innerHTML = '<span>共 <strong>' + games.length + '</strong> 个游戏</span>' +
      '<span class="dot"></span><span>占用 <strong>' + fmtSize(total) + '</strong></span>';
  }

  function renderEmpty(hasFilter) {
    var empty = $('#empty');
    if (!games.length) {
      empty.innerHTML = '<div class="emoji">🕹️</div><h3>还没有游戏</h3>' +
        '<p>站长还没有发布游戏，过段时间再来看看吧。</p>';
      empty.hidden = false;
    } else if (hasFilter) {
      empty.innerHTML = '<div class="emoji">🔍</div><h3>没有找到匹配的游戏</h3>' +
        '<p>换个关键词或标签试试，<a href="#" id="clear-filter">清除筛选</a></p>';
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  function render() {
    renderStats();
    renderTags();
    $('#toolbar').hidden = games.length === 0;
    var list = filteredGames();
    $('#grid').innerHTML = list.map(cardHtml).join('');
    renderEmpty(games.length > 0 && list.length === 0);
  }

  function goPlay(id) {
    if (!id) return;
    window.location.href = 'play/' + encodeURIComponent(id) + '.html';
  }

  function renderSiteInfo() {
    var hint = $('#static-hint');
    var parts = [];
    parts.push('共 <strong>' + games.length + '</strong> 个游戏');
    if (site.builtAt) {
      var d = new Date(site.builtAt);
      if (!isNaN(d.getTime())) {
        parts.push('更新于 ' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate());
      }
    }
    hint.innerHTML = parts.join(' · ');
    if (site.repoUrl) {
      var repoLink = $('#repo-link');
      repoLink.href = site.repoUrl;
      repoLink.hidden = false;
    }
    if (site.title) {
      document.title = site.title + ' · HTML 游戏合集';
    }
  }

  function bindEvents() {
    var searchTimer = null;
    $('#search').addEventListener('input', function (e) {
      var value = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.q = value;
        render();
      }, 120);
    });
    $('#sort').addEventListener('change', function (e) {
      state.sort = e.target.value;
      render();
    });
    $('#tags').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tag]');
      if (!btn) return;
      state.tag = btn.getAttribute('data-tag') || '';
      render();
    });
    $('#grid').addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      goPlay(card.getAttribute('data-id'));
    });
    $('#empty').addEventListener('click', function (e) {
      if (e.target.id === 'clear-filter') {
        e.preventDefault();
        state.q = '';
        state.tag = '';
        $('#search').value = '';
        render();
      }
    });
  }

  renderSiteInfo();
  bindEvents();
  render();
})();
